import OpenAI from "openai";
import { SYSTEM_PROMPT, buildUserMessage, buildSummaryMessage } from "./prompt.js";

const MAX_CHARS_PER_BATCH = 15000;
const DEEPSEEK_ENDPOINT = "https://api.deepseek.com";

export interface FileReview {
  filename: string;
  review: string;
}

function createClient(apiKey: string): OpenAI {
  return new OpenAI({ baseURL: DEEPSEEK_ENDPOINT, apiKey });
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

function buildFileSummary(f: { filename: string; additions: number; deletions: number; changes: number }): string {
  return `文件 \`${f.filename}\` 变更量过大（+${f.additions}/-${f.deletions}，共 ${f.changes} 行），跳过逐行审查。请仅基于统计信息给出高层面的审查建议。`;
}

export async function reviewFiles(
  apiKey: string,
  model: string,
  files: { filename: string; patch?: string; additions: number; deletions: number; changes: number }[],
): Promise<FileReview[]> {
  const client = createClient(apiKey);
  const results: FileReview[] = [];

  const batches: { filename: string; patch: string }[][] = [];
  let currentBatch: { filename: string; patch: string }[] = [];
  let currentSize = 0;

  for (const f of files) {
    let patch: string;
    if (!f.patch || estimateTokens(f.patch) > 6000) {
      patch = buildFileSummary(f);
    } else {
      patch = f.patch;
    }

    const patchSize = patch.length;

    if (currentBatch.length > 0 && currentSize + patchSize > MAX_CHARS_PER_BATCH) {
      batches.push(currentBatch);
      currentBatch = [];
      currentSize = 0;
    }

    currentBatch.push({ filename: f.filename, patch });
    currentSize += patchSize;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  for (const batch of batches) {
    const userMessage = buildUserMessage(batch);
    const resp = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
    });

    const content = resp.choices[0]?.message?.content || "（审查结果为空）";
    const filenames = batch.map((b) => b.filename).join(", ");
    results.push({ filename: filenames, review: content });
  }

  return results;
}

export async function summarizeReviews(
  apiKey: string,
  model: string,
  reviews: FileReview[],
): Promise<string> {
  if (reviews.length === 0) return "无变更需要审查。";
  if (reviews.length === 1) return reviews[0].review;

  const client = createClient(apiKey);
  const summaryMessage = buildSummaryMessage(reviews);

  if (estimateTokens(summaryMessage) > 6000) {
    return reviews
      .map((r) => `## ${r.filename}\n\n${r.review}`)
      .join("\n\n---\n\n");
  }

  const resp = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "你是一个代码审查汇总助手。请将各文件的审查结果合并为一份结构清晰的 PR Review 报告，使用中文输出。按文件分组，保留每个问题的严重级别。",
      },
      { role: "user", content: summaryMessage },
    ],
    temperature: 0.3,
  });

  return resp.choices[0]?.message?.content || "（汇总结果为空）";
}
