# WhoDis

WhoDis 是一个“固定题库 + 动态分支”的选择式自我访谈 Web MVP。

用户不输入自由文本，只通过 30 道单选题完成访谈。系统根据选择路径、标签聚合和模块覆盖情况，最终生成：

- 8 个模块的个人画像报告
- `Agent` 可导入上下文
- 按需生成的 `Skill.md`

当前线上地址：

- [http://whodis.cn](http://whodis.cn)

## 1. 产品定位

WhoDis V1 的目标不是做人格测试，也不是做心理诊断，而是把用户的选择路径整理成一份结构化的个人上下文，方便：

- 用户更清楚地理解自己的思考方式、行动偏好和压力反应
- 用户把这份画像复制到其他 AI 工具中使用
- 其他 AI 在给建议、拆任务、做复盘时更贴近用户的实际偏好

V1 明确不做：

- 登录注册
- 用户中心
- 历史报告列表
- 支付
- 分享闭环功能
- PDF 导出
- 后台管理
- 移动 App
- AI 动态生成题目
- 自由填空题
- MBTI / 人格类型输出
- 心理诊断

## 2. 当前功能

### 2.1 页面

- `/`：首页
- `/chat/:sessionId`：访谈页
- `/report/:sessionId`：报告页

### 2.2 访谈流程

- 创建 `session` 后进入第一题
- 第一题固定为性格结构题：`你觉得自己平时更接近哪一种人？`
- 每题固定 4 个选项
- 点击选项后自动高亮并立即提交
- 提交中禁用其他选项，避免重复点击
- 第二题开始可点击“上一题”
- 回退后重新选择，会覆盖当前题答案，并清空后续题目与答案，重新生成后续路径
- 用户必须完整完成 30 题后，才允许生成报告

### 2.3 报告内容

报告正文固定只包含以下 8 个模块：

1. 整体画像概括
2. 核心底色
3. 性格结构
4. 行为与行动模式
5. 内耗循环
6. 关系模式
7. 压力与防御方式
8. 深层敏感点与需求

报告底部提供：

- `Agent` 可导入上下文
- `Skill.md` 内容
- “如何使用这份画像？”说明模块

### 2.4 Skill.md 按需生成

为了减少首次报告生成时间，当前逻辑已经调整为：

- 首次生成报告时，只生成：
  - 8 个画像模块
  - `Agent` 可导入上下文
- 不再同步生成 `Skill.md`
- 报告页默认显示“尚未生成”
- 用户点击“生成 Skill.md”后，才会单独调用模型生成并保存
- 如果当前报告已经存在 `Skill.md`，则直接展示，不会重复生成

## 3. 技术栈

- Monorepo：`pnpm workspace`
- 前端：`React 19` + `TypeScript` + `Vite` + `Ant Design`
- 后端：`NestJS` + `TypeScript`
- 数据库：`PostgreSQL`
- ORM：`Prisma`
- 进程管理：`PM2`
- 反向代理：`Nginx`

Node 版本要求：

- `>= 20.19.0`

项目脚本当前默认通过本机 `nvm` 中的 Node 运行，根目录 `package.json` 里固定了：

- `~/.nvm/versions/node/v22.21.1/bin`

如果你的本地 Node 版本不足，请先切换或升级到 Node 20+。

## 4. 目录结构

```text
WhoDis/
├── backend/                         # NestJS API
│   ├── prisma/                      # Prisma schema 与迁移
│   │   └── migrations/
│   ├── src/
│   │   ├── llm.service.ts           # DeepSeek 调用封装
│   │   ├── question-bank.ts         # 固定题库
│   │   ├── report.service.ts        # 报告与 Skill.md 生成
│   │   ├── selection.service.ts     # 动态选题规则
│   │   ├── session.controller.ts    # API 路由
│   │   └── session.service.ts       # session / 答题流程
│   └── .env.example
├── frontend/
│   ├── public/                      # favicon、logo、分享图
│   ├── src/
│   │   ├── api.ts                   # 前端接口请求
│   │   ├── main.tsx                 # 页面与路由
│   │   ├── styles.css               # 全局样式
│   │   └── types.ts                 # 前端类型
│   └── index.html                   # meta / favicon / share card
├── docker-compose.yml               # 本地 PostgreSQL
├── package.json                     # workspace 脚本
└── pnpm-workspace.yaml
```

## 5. 本地开发

### 5.1 环境准备

需要先准备：

- Node.js 20+
- pnpm
- Docker / Docker Desktop

### 5.2 安装与启动

```bash
cd /Users/Project/WhoDis

pnpm install
docker compose up -d postgres
cp backend/.env.example backend/.env
pnpm db:generate
pnpm db:migrate
pnpm dev
```

默认地址：

- 前端：`http://127.0.0.1:5173/`
- 后端：`http://127.0.0.1:3000/`
- PostgreSQL：`localhost:5432`

说明：

- 如果 `5173` 被占用，Vite 会自动切换端口
- 如果 `3000` 被占用，后端启动会失败，需要先释放端口
- 本地调试时，如果浏览器显示的不是最新端口，请以终端输出为准

### 5.3 常用命令

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

# 执行本地迁移
pnpm db:migrate
```

## 6. 环境变量

`backend/.env.example`：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/whodis?schema=public"
LLM_PROVIDER="deepseek"
DEEPSEEK_API_KEY="sk-your-deepseek-api-key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_MODEL="deepseek-v4-flash"
```

说明：

- `DATABASE_URL`：本地 PostgreSQL 连接
- `LLM_PROVIDER`：当前仅支持 `deepseek`
- `DEEPSEEK_API_KEY`：必填，不要提交到 Git
- `DEEPSEEK_BASE_URL`：默认 `https://api.deepseek.com`
- `DEEPSEEK_MODEL`：当前默认 `deepseek-v4-flash`

## 7. 核心业务规则

### 7.1 题库与分支

- 题库固定，不由 AI 生成
- 每题固定 4 个选项
- 每个选项都包含：
  - `text`
  - `tags`
  - `nextHints`
- 系统根据最近一次选择、模块覆盖和阶段优先级，动态选择下一题

当前题库共 32 道：

- `personality_structure`：6
- `behavior_action`：5
- `relationship_pattern`：5
- `pressure_defense`：5
- `core_base`：4
- `inner_loop`：4
- `deep_needs`：3

### 7.2 选题规则

当前实现位于：

- [backend/src/selection.service.ts](/Users/Project/WhoDis/backend/src/selection.service.ts)

实际逻辑：

- 已答题不重复
- 前 1-5 题优先：
  - `personality_structure`
  - `behavior_action`
- 第 6-10 题优先：
  - `relationship_pattern`
  - `pressure_defense`
- 第 11-15 题优先：
  - `core_base`
  - `inner_loop`
  - `deep_needs`
- 15 题后优先补齐缺失模块
- 30 题后允许生成报告
- 如果题库被问完，也允许生成报告

### 7.3 报告生成限制

当前实现已经收敛为：

- `questionCount >= 30` 才可生成报告

也就是说：

- 不存在 15 题直接生成
- 15 题后的逻辑仅用于补齐缺失模块
- `SelectionService.canGenerateReport()` 当前只在 30 题时返回 `true`

## 8. 报告生成与 LLM

### 8.1 当前模型职责

DeepSeek 不参与：

- 出题
- 题库改写
- 分支选题
- session 状态控制

DeepSeek 只参与：

- 报告正文生成
- `Agent` 可导入上下文生成
- `Skill.md` 按需生成

### 8.2 首次报告生成输入

为了减少生成耗时，当前传给模型的输入已经瘦身为：

- 题号 `orderNo`
- 模块 `module`
- 题目文本 `questionText`
- 用户选中的选项文本 `selectedOptionText`
- 选中标签 `selectedTags`
- 标签统计 `tagSummary`
- 模块回答数量 `moduleCounts`

当前不会再把以下内容传给首次报告生成：

- 每题完整 4 个选项全文
- 未选择选项全文

### 8.3 Skill.md 生成输入

点击“生成 Skill.md”时，模型输入为：

- 报告正文 `contentJson`
- `agentContext`
- `tagSummary`
- `moduleCounts`

### 8.4 当前等待体验

报告生成中，前端会显示阶段式文案：

- `正在整理选择路径...`
- `正在提取画像信号...`
- `正在生成个人画像...`
- `正在生成 Agent 上下文...`

当生成超过 20 秒时，会额外提示：

- `报告仍在生成中，请不要关闭页面。`

单独生成 `Skill.md` 时显示：

- `正在生成 Skill.md...`

### 8.5 耗时记录

`Report` 表当前已经记录：

- `generationDurationMs`

该字段表示“首次生成报告”的服务端耗时，单位为毫秒。

说明：

- 这是报告正文 + `AgentContext` 的生成耗时
- 当前不包含后续单独生成 `Skill.md` 的耗时

## 9. 前端交互说明

### 9.1 首页

- 手绘纸张风格 UI
- 顶部品牌 logo + favicon 已接入
- 已配置分享卡片 meta：
  - `title`
  - `description`
  - `og:*`
  - `twitter:*`

### 9.2 访谈页

- 点击选项自动进入下一题
- 没有“下一题”按钮
- 顶部显示已完成题数
- 题面显示 `x / 30`
- 支持上一题
- 移动端已处理顶部栏覆盖问题

### 9.3 报告页

- 显示 8 个正文模块
- 支持复制完整报告
- 支持复制 `Agent` 上下文
- 如果 `Skill.md` 已生成，支持复制 `Skill.md`
- 如果 `Skill.md` 未生成，显示“尚未生成”并允许按需生成

## 10. 后端接口

当前接口位于：

- [backend/src/session.controller.ts](/Users/Project/WhoDis/backend/src/session.controller.ts)

```text
POST /api/session/create
GET  /api/session/:id
POST /api/session/:id/answer
POST /api/session/:id/previous
POST /api/session/:id/report
POST /api/session/:id/report/skill
GET  /api/session/:id/report
```

### 10.1 接口说明

`POST /api/session/create`

- 创建 session
- 写入第一题

`GET /api/session/:id`

- 获取 session 状态
- 返回当前题、当前题数、是否可返回上一题

`POST /api/session/:id/answer`

- 提交当前题选择
- 自动生成下一题或进入 `ready_to_report`

`POST /api/session/:id/previous`

- 回到上一题

`POST /api/session/:id/report`

- 在完成 30 题后生成报告
- 首次只生成 8 个模块和 `agentContext`

`POST /api/session/:id/report/skill`

- 如果当前报告还没有 `Skill.md`，则单独生成并保存

`GET /api/session/:id/report`

- 获取报告详情

## 11. 数据库模型

Prisma schema 位于：

- [backend/prisma/schema.prisma](/Users/Project/WhoDis/backend/prisma/schema.prisma)

核心模型：

- `Session`
- `Question`
- `Answer`
- `Report`

### 11.1 Session

- `status`
- `currentQuestionId`
- `questionCount`
- `canGenerateReport`
- `createdAt`
- `updatedAt`

### 11.2 Question

- `bankQuestionId`
- `module`
- `stage`
- `questionText`
- `optionsJson`
- `orderNo`

### 11.3 Answer

- `selectedOptionId`
- `selectedOptionText`
- `selectedTags`
- `nextHints`

### 11.4 Report

- `title`
- `contentJson`
- `agentContext`
- `skillMarkdown`
- `generationDurationMs`
- `createdAt`

## 12. 部署说明

当前生产环境：

- 服务器：`whodis-prod`
- 部署目录：`/var/www/WhoDis`
- 前端目录：`/var/www/WhoDis/frontend/dist`
- 后端进程：`whodis-api`
- 域名：
  - [http://whodis.cn](http://whodis.cn)
  - [http://www.whodis.cn](http://www.whodis.cn)

### 12.1 生产更新命令

如果服务器 Git 能正常拉取：

```bash
ssh whodis-prod
source ~/.nvm/nvm.sh
cd /var/www/WhoDis
git pull --ff-only origin main
pnpm install --frozen-lockfile
pnpm db:generate
pnpm --filter @whodis/backend exec prisma migrate deploy
pnpm build
pm2 restart whodis-api
sudo nginx -t
sudo systemctl reload nginx
```

说明：

- 当前服务器曾出现 `https` 方式 `git fetch / pull` 卡住的问题
- 遇到这种情况时，部署改为从本地已推送提交打包同步到服务器
- 部署时不要覆盖服务器 `backend/.env`

## 13. 已知注意事项

- `frontend/dist/` 是构建产物，不作为日常源码编辑目录
- `.env` 不能提交到 Git
- `stitch/` 目录已加入忽略，不再提交设计稿
- `node_modules/` 不应提交到 GitHub
- 如果本地 `3000` 端口被占用，后端会直接启动失败
- 如果 Docker 没启动，本地数据库相关命令会失败

## 14. 当前验收状态

当前项目已经具备以下能力：

- 首页可创建 `session`
- 第一题固定
- 每题固定 4 个选项
- 点击选项自动进入下一题
- 可返回上一题并覆盖后续路径
- 已答题不重复
- 完整完成 30 题后可生成报告
- 报告只包含 8 个正文模块
- 报告可生成 `Agent` 上下文
- `Skill.md` 支持按需生成
- 生成报告时有阶段式 loading
- 报告生成耗时已落库

## 15. 相关文件

如果你要继续开发，优先看这些文件：

- [backend/src/question-bank.ts](/Users/Project/WhoDis/backend/src/question-bank.ts)
- [backend/src/selection.service.ts](/Users/Project/WhoDis/backend/src/selection.service.ts)
- [backend/src/session.service.ts](/Users/Project/WhoDis/backend/src/session.service.ts)
- [backend/src/report.service.ts](/Users/Project/WhoDis/backend/src/report.service.ts)
- [backend/src/llm.service.ts](/Users/Project/WhoDis/backend/src/llm.service.ts)
- [frontend/src/main.tsx](/Users/Project/WhoDis/frontend/src/main.tsx)
- [frontend/src/api.ts](/Users/Project/WhoDis/frontend/src/api.ts)
- [frontend/src/styles.css](/Users/Project/WhoDis/frontend/src/styles.css)
