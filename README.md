# WhoDis

WhoDis V1 是一个“固定题库 + 动态分支”的选择式自我访谈 Web MVP。

用户只通过选择题完成访谈，系统根据选择路径、标签和模块完成度，生成：

- 个人画像报告
- Agent 可导入上下文
- `Skill.md` 内容

V1 不做登录注册、用户中心、历史报告、支付、分享、PDF、后台管理、移动 App、AI 动态生成题目、自由填空题、MBTI 人格类型或心理诊断。

## 技术栈

- Monorepo：pnpm workspace
- 前端：React + TypeScript + Vite + Ant Design
- 后端：NestJS + TypeScript
- 数据库：PostgreSQL
- ORM：Prisma
- Node：`>=20.19.0`，当前项目建议使用 `.nvmrc` 中的 `22.21.1`

## 目录结构

```text
WhoDis/
  backend/              # NestJS API 服务
    prisma/             # Prisma schema 与迁移
    src/                # 后端业务代码、题库、选题、报告生成
  frontend/             # React Web 前端
    src/                # 三页面路由、API 客户端、样式
  docker-compose.yml    # 本地 PostgreSQL
  pnpm-workspace.yaml   # workspace 配置
```

## 本地启动

先确保 Docker Desktop 已启动。

```bash
cd /Users/Project/WhoDis

# 安装依赖
pnpm install

# 启动 PostgreSQL
docker compose up -d postgres

# 创建本地环境变量
cp backend/.env.example backend/.env

# 生成 Prisma Client
pnpm db:generate

# 初始化数据库表
pnpm db:migrate

# 同时启动前后端
pnpm dev
```

默认地址：

- 前端：`http://127.0.0.1:5173/`
- 后端：`http://127.0.0.1:3000/`
- PostgreSQL：`localhost:5432`

如果 `5173` 被占用，Vite 会自动切换端口，请以终端输出为准。

## 常用命令

```bash
# 启动前后端
pnpm dev

# 只启动前端
pnpm dev:frontend

# 只启动后端
pnpm dev:backend

# 构建前后端
pnpm build

# 生成 Prisma Client
pnpm db:generate

# 执行数据库迁移
pnpm db:migrate
```

## 页面

- `/`：首页，创建 session 并进入访谈
- `/chat/:sessionId`：访谈页，展示当前问题和 4 个选项
- `/report/:sessionId`：报告页，展示 8 个正文模块、Agent 上下文和 Skill.md

## 后端接口

```text
POST /api/session/create
GET  /api/session/:id
POST /api/session/:id/answer
POST /api/session/:id/report
GET  /api/session/:id/report
```

## 核心规则

- 题库固定，路径动态
- 每题固定 4 个选项
- 用户只做选择，不输入文字
- 每个选项绑定 `tags` 和 `nextHints`
- 已答题不会重复
- 第一题固定为“你觉得自己平时更接近哪一种人？”
- 必须完整完成 30 道题后才允许生成报告
- 15 题后会优先补齐缺失模块，但不会提前生成报告
- 报告不输出人格类型，不做心理诊断

## 题库模块

当前题库共 32 道：

- `personality_structure`：6 道
- `behavior_action`：5 道
- `relationship_pattern`：5 道
- `pressure_defense`：5 道
- `core_base`：4 道
- `inner_loop`：4 道
- `deep_needs`：3 道

模块最低覆盖要求：

- `personality_structure >= 2`
- `behavior_action >= 2`
- `relationship_pattern >= 2`
- `pressure_defense >= 2`
- `core_base >= 1`
- `inner_loop >= 1`
- `deep_needs >= 1`

## 报告结构

报告正文只包含 8 个模块：

1. 整体画像概括
2. 核心底色
3. 性格结构
4. 行为与行动模式
5. 内耗循环
6. 关系模式
7. 压力与防御方式
8. 深层敏感点与需求

报告底部单独输出：

- Agent 可导入上下文
- Skill.md 内容

V1 的报告生成使用规则和模板实现，后续可以在 `ReportService` 中替换为 LLM 生成。

## 数据库

本地数据库连接示例见：

```text
backend/.env.example
```

默认连接：

```text
postgresql://postgres:postgres@localhost:5432/whodis?schema=public
```

Prisma 模型包括：

- `Session`
- `Question`
- `Answer`
- `Report`

## DeepSeek 报告生成

WhoDis V1 的题库和选题逻辑仍然完全由本地规则控制，AI 不生成题目。

DeepSeek 只用于用户完成 30 题后的报告生成：

- 8 个正文模块
- Agent 可导入上下文
- Skill.md 内容

后端通过 `LlmService` 统一封装模型调用。需要在 `backend/.env` 中配置：

```env
LLM_PROVIDER="deepseek"
DEEPSEEK_API_KEY="你的 DeepSeek API Key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-v4-flash"
```

如果 DeepSeek 调用失败，后端会返回“模型调用失败”错误，不会写入报告。

相关代码：

- `backend/src/llm.service.ts`
- `backend/src/report.service.ts`

## 验收点

- 首页能创建 session 并进入访谈页
- 第一题固定为性格结构题
- 每题固定 4 个选项
- 用户选择后进入不同题目路径
- 已答题不重复
- 30 题前不能生成报告
- 完整完成 30 题后才可生成报告
- 报告只包含 8 个正文模块
- 报告底部包含 Agent 上下文和 Skill.md
- 可复制完整报告、Agent 上下文、Skill.md
- 不出现 MBTI、人格类型、心理诊断、“AI 眼中的你”等表达

## 当前限制

- 需要本地 PostgreSQL 可用后才能完整测试 API
- Docker CLI 存在但 Docker daemon 未启动时，`docker compose up -d postgres` 会失败
- 前端构建时 Ant Design 可能触发 Vite chunk size 提示，这是包体提示，不影响运行
