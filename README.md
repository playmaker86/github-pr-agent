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

permissions:
  contents: read
  pull-requests: write
  statuses: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: playmaker86/github-pr-agent@v1
        with:
          api_key: ${{ secrets.DEEPSEEK_API_KEY }}
          model: deepseek-v4-flash
```

### 4. 配置分支保护（可选）

如果希望**审查不通过时禁止合并 PR**，还需配置 Rulesets：

1. 先让 workflow 成功运行一次（例如开一个 PR），这会在 GitHub 系统中创建 `PR Code Review` 状态检查
2. 打开仓库 **Settings** → **Rules** → **Rulesets** → **New ruleset** → **New branch ruleset**
3. **Ruleset name**: 自定义名称，如 `PR Review Check`
4. **Target branches**: 点 **Add a target** → 选择 **Include default branch**
5. **Branch protections**: 勾选 ✅ **Require status checks to pass**
6. 在输入框中填入 `PR Code Review`，点 **+** 添加
7. 确保 **Enforcement status** 为 **Active**
8. 点 **Create** 保存

> **提示**：如果 Rulesets 界面找不到上述选项，也可用旧的 **Settings → Branches → Add rule** 界面，效果相同。

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
