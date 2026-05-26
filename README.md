# MilkDragon — Task Slayer

一个游戏化的任务管理系统。将现实中的任务转化为需要击败的怪物，通过完成任务获得经验值、升级、解锁成就，帮助克服拖延症。

## 功能特性

- **多用户系统**：注册、登录、登出，Session 鉴权
- **任务管理**：创建、编辑、删除任务，支持简单/中等/困难三种难度
- **战斗系统**：每个任务对应一只怪物，完成进度即为攻击怪物
- **经验值与升级**：根据任务难度获得不同经验值，升级后最大 HP 提升
- **成就系统**：9 种成就，达到对应里程碑自动解锁
- **连击记录**：追踪连续完成任务的天数
- **每日进度日志**：为每个任务记录每日进度百分比与备注
- **管理后台**：`/admin` 路由，需管理员权限，包含数据统计、用户管理、趋势图表

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Python 3, Flask, Flask-CORS, Werkzeug |
| 数据库 | SQLite3 |
| 前端 | HTML5, CSS3, Vanilla JavaScript |

## 项目结构

```
MilkDragon/
├── backend/
│   ├── models/             # 数据模型 (task, xp, achievement, monster)
│   ├── routes/             # API 路由
│   │   ├── auth.py         # 注册 / 登录 / 登出 / 当前用户
│   │   ├── tasks.py        # 任务 CRUD + 进度
│   │   ├── battle.py       # 攻击怪物
│   │   ├── player.py       # 玩家数据
│   │   ├── achievements.py # 成就
│   │   └── admin.py        # 管理后台 API
│   ├── app.py              # 应用入口
│   ├── config.py           # 配置（XP 参数、Session 设置）
│   ├── database.py         # 数据库初始化与连接
│   └── schema.sql          # 数据库表结构
├── task-slayer/            # 前端静态文件
│   ├── index.html          # 主游戏页面
│   ├── admin.html          # 管理后台页面
│   ├── css/
│   │   ├── style.css       # 主样式
│   │   └── admin.css       # 管理后台样式
│   ├── js/
│   │   ├── battle.js       # 主游戏逻辑
│   │   └── admin.js        # 管理后台逻辑
│   └── assets/             # 角色动画资源
├── requirements.txt
└── README.md
```

## 快速开始

### 环境要求

- Python 3.8+
- 现代浏览器（Chrome / Firefox / Edge）

### 安装与启动

**1. 克隆仓库**

```bash
git clone <仓库地址>
cd MilkDragon
```

**2. 创建虚拟环境并安装依赖**

```bash
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

**3. 启动后端**

必须在 `backend/` 目录下启动，否则相对路径导入会失败：

```bash
cd backend
python app.py
```

后端运行在 `http://127.0.0.1:5000`，首次启动自动：
- 创建 `task_slayer.db`
- 执行建表 SQL
- 写入初始怪物（Skeleton / Flying Eye / Goblin）和 9 种成就数据

**4. 访问游戏**

打开浏览器访问 `http://127.0.0.1:5000`，注册账号即可开始游戏。

---

## 管理后台

访问 `http://127.0.0.1:5000/admin`，需要 `is_admin = 1` 的账号登录。

### 创建管理员账号

在 `backend/` 目录下执行（将 `你的用户名` 替换为实际用户名）：

```bash
python -c "
import sqlite3
db = sqlite3.connect('task_slayer.db')
db.execute('UPDATE users SET is_admin=1 WHERE username=\"你的用户名\"')
db.commit()
print('done')
"
```

或者直接插入新管理员：

```bash
python -c "
import sqlite3
from werkzeug.security import generate_password_hash
db = sqlite3.connect('task_slayer.db')
db.execute('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)',
           ('admin', generate_password_hash('your_password')))
db.commit()
print('done')
"
```

### 后台功能

| 标签 | 内容 |
|------|------|
| Overview | 用户数、任务数、完成率、难度分布、怪物击败统计 |
| Users | 所有用户列表，支持搜索，可授予/撤销管理员权限 |
| Charts | 最近 14 天注册趋势与任务创建趋势折线图 |

---

## API 概览

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册（username ≥3位，password ≥6位） |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 登出 |
| GET  | `/api/auth/me` | 获取当前登录用户信息 |

### 任务

| 方法 | 路径 | 说明 |
|------|------|------|
| GET    | `/api/tasks` | 获取任务列表 |
| POST   | `/api/tasks` | 创建任务 |
| PUT    | `/api/tasks/<id>` | 更新任务 |
| DELETE | `/api/tasks/<id>` | 删除任务 |
| POST   | `/api/tasks/<id>/progress` | 提交每日进度 |
| POST   | `/api/tasks/<id>/complete` | 完成任务 |

### 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/battle/attack` | 攻击怪物（获取 XP） |
| GET  | `/api/player/stats` | 获取玩家数据 |
| POST | `/api/player/reset` | 重置玩家进度 |
| GET  | `/api/achievements` | 获取成就列表 |

### 管理（需 is_admin=1）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/admin/stats` | 全站统计数据 |
| GET  | `/api/admin/users` | 所有用户列表 |
| POST | `/api/admin/users/<id>/toggle-admin` | 切换用户管理员状态 |

## 注意事项

- 数据库文件 `task_slayer.db` 自动生成于 `backend/` 目录，不要提交到 git
- 启动时必须 `cd backend` 后再运行 `python app.py`，不能在根目录启动
- 开发模式下 Session cookie 未启用 Secure 标志，生产环境需修改 `config.py`
