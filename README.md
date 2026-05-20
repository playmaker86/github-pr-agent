# 🤖 github-pr-agent

GitHub Action，使用 AI 对 Pull Request 进行代码审查，发现问题后禁止合并。

## 功能

- PR 创建或更新时自动触发审查
- 使用 AI（DeepSeek / OpenAI 等）检测代码质量和潜在 Bug
- 审查结果以 PR 评论形式发布
- 发现代码问题自动禁止合并（通过 Commit Status Check）

## 快速开始

### 1. 申请 API Key

在 [DeepSeek API Platform](https://platform.deepseek.com) 注册并创建 API Key。

### 2. 配置 Secret

在仓库 **Settings** → **Secrets and variables** → **Actions** 中：

| Name | Value |
|------|-------|
| `DEEPSEEK_API_KEY` | 你的 DeepSeek API Key |

### 3. 添加 Workflow

在仓库 `.github/workflows/review.yml` 中创建：

```yaml
name: PR Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: playmaker86/github-pr-agent@main
        with:
          api_key: ${{ secrets.DEEPSEEK_API_KEY }}
          model: deepseek-v4-flash
```

### 4. 配置分支保护（可选）

如果希望**审查不通过时禁止合并 PR**，还需配置分支保护规则：

1. 打开仓库 **Settings** → **Branches**
2. 点击 **Add branch protection rule**
3. **Branch name pattern** 填写目标分支名，如 `main`
4. 勾选 ✅ **Require status checks to pass before merging**
5. 在搜索框中输入 `PR Code Review`，勾选出现的结果
6. 点击 **Create** 保存

> **效果**：审查未完成或发现问题时，PR 合并按钮灰掉，禁止合并。

## Inputs

| 参数 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `api_key` | ✅ | — | AI API Key（DeepSeek / OpenAI 等）|
| `api_base` | | `https://api.deepseek.com` | AI API 端點，可切换其他 OpenAI 兼容服务 |
| `model` | | `deepseek-v4-flash` | 使用的 AI 模型 |
| `github_token` | | `${{ github.token }}` | GitHub Token（用于获取 PR diff 和发布评论）|


## Commit Status 说明

| 状态 | 含义 |
|------|------|
| 🟡 Pending | AI 审查进行中 |
| 🟢 Success | 未发现代码问题 |
| 🔴 Failure | 发现代码问题 |
| 🔴 Error | 审查流程异常 |

结合分支保护规则后，只有 🟢 Success 才允许合并。

## 审查内容

- 🔴 严重：逻辑错误、边界条件遗漏、空值引用、类型错误
- 🟡 警告：代码可读性、重复代码、命名规范
- 🟢 建议：优化方案、最佳实践
