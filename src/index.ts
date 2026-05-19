import * as core from "@actions/core";
import * as github from "@actions/github";
import { getPRFiles, postComment } from "./github";
import { reviewFiles, summarizeReviews } from "./models";

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput("github_token") || process.env.GITHUB_TOKEN || "";
    const model = core.getInput("model") || "gpt-4o-mini";

    if (!githubToken) {
      core.setFailed("缺少 github_token");
      return;
    }

    const ctx = github.context;
    const { owner, repo } = ctx.repo;
    const pullNumber = ctx.payload.pull_request?.number;

    if (!pullNumber) {
      core.setFailed("无法获取 PR 编号，请确保在 pull_request 事件中运行");
      return;
    }

    core.info(`正在审查 PR #${pullNumber} (${owner}/${repo})，模型: ${model}`);

    const octokit = github.getOctokit(githubToken);

    const files = await getPRFiles(octokit, owner, repo, pullNumber);
    core.info(`获取到 ${files.length} 个变更文件`);

    if (files.length === 0) {
      core.info("无文件变更，跳过审查");
      return;
    }

    const fileReviews = await reviewFiles(githubToken, model, files);
    core.info(`完成 ${fileReviews.length} 批次审查`);

    const summary = await summarizeReviews(githubToken, model, fileReviews);

    const header = `## 🤖 AI 代码审查\n\n`;
    const body = header + summary;

    await postComment(octokit, owner, repo, pullNumber, body);
    core.info("审查评论已发布");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    core.setFailed(`审查失败: ${msg}`);
  }
}

run();
