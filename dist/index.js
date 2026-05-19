"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const github_1 = require("./github");
const models_1 = require("./models");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const githubToken = core.getInput("github_token") || process.env.GITHUB_TOKEN || "";
            const model = core.getInput("model") || "gpt-4o-mini";
            if (!githubToken) {
                core.setFailed("缺少 github_token");
                return;
            }
            const ctx = github.context;
            const { owner, repo } = ctx.repo;
            const pullNumber = (_a = ctx.payload.pull_request) === null || _a === void 0 ? void 0 : _a.number;
            if (!pullNumber) {
                core.setFailed("无法获取 PR 编号，请确保在 pull_request 事件中运行");
                return;
            }
            core.info(`正在审查 PR #${pullNumber} (${owner}/${repo})，模型: ${model}`);
            const octokit = github.getOctokit(githubToken);
            const files = yield (0, github_1.getPRFiles)(octokit, owner, repo, pullNumber);
            core.info(`获取到 ${files.length} 个变更文件`);
            if (files.length === 0) {
                core.info("无文件变更，跳过审查");
                return;
            }
            const fileReviews = yield (0, models_1.reviewFiles)(githubToken, model, files);
            core.info(`完成 ${fileReviews.length} 批次审查`);
            const summary = yield (0, models_1.summarizeReviews)(githubToken, model, fileReviews);
            const header = `## 🤖 AI 代码审查\n\n`;
            const body = header + summary;
            yield (0, github_1.postComment)(octokit, owner, repo, pullNumber, body);
            core.info("审查评论已发布");
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            core.setFailed(`审查失败: ${msg}`);
        }
    });
}
run();
