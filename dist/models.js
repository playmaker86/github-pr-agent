"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewFiles = reviewFiles;
exports.summarizeReviews = summarizeReviews;
const openai_1 = __importDefault(require("openai"));
const prompt_1 = require("./prompt");
const ENDPOINT = "https://models.inference.ai.azure.com";
const MAX_CHARS_PER_BATCH = 15000;
function createClient(token) {
    return new openai_1.default({ baseURL: ENDPOINT, apiKey: token });
}
function estimateTokens(text) {
    return Math.ceil(text.length / 3);
}
function buildFileSummary(f) {
    return `文件 \`${f.filename}\` 变更量过大（+${f.additions}/-${f.deletions}，共 ${f.changes} 行），跳过逐行审查。请仅基于统计信息给出高层面的审查建议。`;
}
function reviewFiles(token, model, files) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const client = createClient(token);
        const results = [];
        const batches = [];
        let currentBatch = [];
        let currentSize = 0;
        for (const f of files) {
            let patch;
            if (!f.patch || estimateTokens(f.patch) > 6000) {
                patch = buildFileSummary(f);
            }
            else {
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
            const userMessage = (0, prompt_1.buildUserMessage)(batch);
            const resp = yield client.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: prompt_1.SYSTEM_PROMPT },
                    { role: "user", content: userMessage },
                ],
                temperature: 0.3,
            });
            const content = ((_b = (_a = resp.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || "（审查结果为空）";
            const filenames = batch.map((b) => b.filename).join(", ");
            results.push({ filename: filenames, review: content });
        }
        return results;
    });
}
function summarizeReviews(token, model, reviews) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (reviews.length === 0)
            return "无变更需要审查。";
        if (reviews.length === 1)
            return reviews[0].review;
        const client = createClient(token);
        const summaryMessage = (0, prompt_1.buildSummaryMessage)(reviews);
        if (estimateTokens(summaryMessage) > 6000) {
            return reviews
                .map((r) => `## ${r.filename}\n\n${r.review}`)
                .join("\n\n---\n\n");
        }
        const resp = yield client.chat.completions.create({
            model,
            messages: [
                {
                    role: "system",
                    content: "你是一个代码审查汇总助手。请将各文件的审查结果合并为一份结构清晰的 PR Review 报告，使用中文输出。按文件分组，保留每个问题的严重级别。",
                },
                { role: "user", content: summaryMessage },
            ],
            temperature: 0.3,
        });
        return ((_b = (_a = resp.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || "（汇总结果为空）";
    });
}
