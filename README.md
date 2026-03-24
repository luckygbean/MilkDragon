# MilkDragon — Task Slayer

一个游戏化的任务管理系统。将现实中的任务转化为需要击败的怪物，通过完成任务获得经验值、升级、解锁成就，帮助克服拖延症。

## 功能特性

- **任务管理**：创建、编辑、删除任务，支持简单/中等/困难三种难度
- **战斗系统**：每个任务对应一只怪物，完成进度即为攻击怪物
- **经验值与升级**：根据任务难度获得不同经验值，升级后最大 HP 提升
- **成就系统**：9 种成就，达到对应里程碑自动解锁
- **连击记录**：追踪连续完成任务的天数
- **每日进度日志**：为每个任务记录每日进度百分比与备注

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Python 3, Flask, Flask-CORS |
| 数据库 | SQLite3 |
| 前端 | HTML5, CSS3, Vanilla JavaScript |

## 项目结构

```
MilkDragon/
├── backend/                # Flask 后端
│   ├── models/             # 数据模型
│   ├── routes/             # API 路由 (tasks, battle, player, achievements)
│   ├── app.py              # 应用入口
│   ├── config.py           # 配置文件（XP 参数等）
│   ├── database.py         # 数据库初始化与连接
│   ├── schema.sql          # 数据库表结构
│   ├── seed.py             # 初始数据脚本（可选）
│   └── requirements.txt    # Python 依赖
└── task-slayer/            # 前端静态文件
    ├── index.html          # 主页面
    ├── css/style.css       # 样式
    ├── js/battle.js        # 前端逻辑
    └── assets/             # 角色动画资源
```

## 快速开始

### 环境要求

- Python 3.8+
- 现代浏览器（Chrome / Firefox / Edge）

### 安装步骤

**1. 克隆仓库**

```bash
git clone <仓库地址>
cd MilkDragon
```

**2. 安装 Python 依赖**

```bash
pip install -r backend/requirements.txt
```

**3. 启动后端**

```bash
# 在 backend/ 目录下
python app.py
```

后端默认运行在 `http://127.0.0.1:5000`，首次启动会自动：
- 创建 SQLite 数据库（`task_slayer.db`）
- 执行建表 SQL
- 写入初始怪物和成就数据

**4. 打开前端**

直接用浏览器打开 `task-slayer/index.html` 文件即可。

```
MilkDragon/task-slayer/index.html
```

> 前端通过 `http://127.0.0.1:5000/api` 与后端通信，请确保后端已启动。

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tasks` | 获取任务列表 |
| POST | `/api/tasks` | 创建任务 |
| PUT | `/api/tasks/<id>` | 更新任务 |
| DELETE | `/api/tasks/<id>` | 删除任务 |
| POST | `/api/tasks/<id>/progress` | 提交每日进度 |
| POST | `/api/tasks/<id>/complete` | 完成任务 |
| POST | `/api/battle/attack` | 攻击怪物（获取 XP） |
| GET | `/api/player/stats` | 获取玩家数据 |
| POST | `/api/player/reset` | 重置玩家进度 |
| GET | `/api/achievements` | 获取成就列表 |

## 注意事项

- 当前为单用户模式，`user_id` 固定为 `1`
- 数据库文件 `task_slayer.db` 首次运行后自动生成于 `backend/` 目录
