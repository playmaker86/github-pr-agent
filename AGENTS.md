# github-pr-agent

GitHub Action，使用 GitHub Models (gpt-4o-mini) 对 Pull Request 进行 AI 代码审查。

## 命令

| 命令 | 作用 |
|------|------|
| `npm run build` | `tsc --noEmit` 类型检查 + `ncc` 打包 `src/` → `dist/index.js`（单文件） |

## 结构

- `src/index.ts` — Action 入口，编排整个审查流程
- `src/github.ts` — GitHub API 封装（获取 PR diff、发布评论）
- `src/models.ts` — GitHub Models API 调用（分块审查 + 汇总），使用 `openai` SDK
- `src/prompt.ts` — 中文审查提示词模板

## 审查流程

```
PR 触发 → 获取 diff → 按文件分批审查 → 汇总 → 发布评论
```

- 每批文件 diff ≤ 15000 字符，避免超过 GitHub Models 免费层 8K token 限制
- 超大文件仅发送文件名 + 变更统计摘要，不做逐行审查
- 默认模型 `gpt-4o-mini`，可通过 Action input 切换

## 注意

- `dist/` 必须提交到仓库（GitHub Action 入口），不要加入 .gitignore。 `dist/` 由 ncc 生成，是包含所有依赖的自包含单文件
- 项目使用 ESM（`type: module`），ncc 打包后同样输出 ESM
- 无测试/lint/CI/格式化工具
- 鉴权使用 `${{ github.token }}`，零配置
- API 端點: `https://models.inference.ai.azure.com`
