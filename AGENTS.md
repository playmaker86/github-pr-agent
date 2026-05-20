# github-pr-agent

GitHub Action，使用 DeepSeek API（或任何 OpenAI 兼容 API）对 Pull Request 进行 AI 代码审查。

## 命令

| 命令 | 作用 |
|------|------|
| `npm run build` | `tsc --noEmit` 类型检查 + `ncc` 打包 `src/` → `dist/index.js`（单文件） |

## 结构

- `src/index.ts` — Action 入口，编排整个审查流程
- `src/github.ts` — GitHub API 封装（获取 PR diff、发布评论、设置 commit status）
- `src/models.ts` — AI API 调用（分块审查 + 汇总），使用 `openai` SDK
- `src/prompt.ts` — 中文审查提示词模板

## 审查流程

```
PR 触发 → 获取 diff → 按文件分批审查 → 汇总 → 发布评论
```

- 每批文件 diff ≤ 15000 字符，避免超过 token 限制
- 超大文件仅发送文件名 + 变更统计摘要，不做逐行审查
- 默认模型 `deepseek-v4-flash`，可通过 Action input 切换
- API 端點默认 `https://api.deepseek.com`，可通过 Action input 切换（兼容 OpenAI、Groq 等）

## 机密信息要求

- `github_token`：默认 `${{ github.token }}`，用于 GitHub API（获取 PR diff、发布评论）
- `api_key`：DeepSeek API Key，需用户在 repo secrets 中配置
- `api_base`：可选，默认 DeepSeek，可按需切换其他 OpenAI 兼容端點

## 注意

- `dist/` 必须提交到仓库（GitHub Action 入口），不要加入 .gitignore。 `dist/` 由 ncc 生成，是包含所有依赖的自包含单文件
- 项目使用 ESM（`type: module`），ncc 打包后同样输出 ESM
- Action runner 使用 `node24`
- 无测试/lint/CI/格式化工具
- workflow 需 `statuses: write` 权限（用于设置 commit status）
