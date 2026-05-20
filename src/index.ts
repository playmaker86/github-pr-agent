import * as core from "@actions/core";
import * as github from "@actions/github";
import { getPRFiles, postComment, setCommitStatus } from "./github.js";
import { reviewFiles, summarizeReviews } from "./models.js";

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput("github_token") || process.env.GITHUB_TOKEN || "";
    const apiKey = core.getInput("api_key", { required: true });
    const model = core.getInput("model") || "deepseek-v4-flash";

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

    const pr = await octokit.rest.pulls.get({ owner, repo, pull_number: pullNumber });
    const headSha = pr.data.head.sha;

    await setCommitStatus(octokit, owner, repo, headSha, "pending", "AI 代码审查进行中...");

    const files = await getPRFiles(octokit, owner, repo, pullNumber);
    core.info(`获取到 ${files.length} 个变更文件`);

    if (files.length === 0) {
      core.info("无文件变更，跳过审查");
      await setCommitStatus(octokit, owner, repo, headSha, "success", "无文件变更");
      return;
    }

    const fileReviews = await reviewFiles(apiKey, model, files);
    core.info(`完成 ${fileReviews.length} 批次审查`);

    const summary = await summarizeReviews(apiKey, model, fileReviews);

    const header = `## 🤖 AI 代码审查\n\n`;
    const body = header + summary;

    await postComment(octokit, owner, repo, pullNumber, body);
    core.info("审查评论已发布");

    const passed = /未发现明显问题/.test(summary) || /✅/.test(summary);
    await setCommitStatus(
      octokit, owner, repo, headSha,
      passed ? "success" : "failure",
      passed ? "未发现明显问题" : "发现代码问题",
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    core.setFailed(`审查失败: ${msg}`);

    const githubToken = core.getInput("github_token") || process.env.GITHUB_TOKEN || "";
    if (githubToken) {
      try {
        const octokit = github.getOctokit(githubToken);
        const owner = github.context.repo.owner;
        const repo = github.context.repo.repo;
        const pullNumber = github.context.payload.pull_request?.number;
        if (pullNumber) {
          const pr = await octokit.rest.pulls.get({ owner, repo, pull_number: pullNumber });
          await setCommitStatus(octokit, owner, repo, pr.data.head.sha, "error", `审查失败: ${msg}`);
        }
      } catch { /* 状态上报失败不影响主流程 */ }
    }
  }
}

run();
