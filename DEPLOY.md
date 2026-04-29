# 部署指南

## 前置条件（在服务器上执行）

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 docker-compose
sudo apt install docker-compose-plugin -y

# 验证安装
docker --version
docker compose version
```

## 部署步骤

### 1. 克隆项目到服务器

```bash
git clone https://github.com/luckygbean/MilkDragon ~/website
```

### 2. 启动服务

```bash
cd ~/website
sudo docker compose up -d --build
```

### 3. 查看状态

```bash
docker compose ps       # 查看容器状态
docker compose logs -f  # 查看实时日志
```

### 4. 访问网站

浏览器打开：`http://YOUR_SERVER_IP:5000`

---

## 常用运维命令

```bash
# 停止服务
docker compose down

# 重启服务
docker compose restart

# 更新代码后重新部署
git pull
sudo docker compose up -d --build

# 查看日志
docker compose logs -f app
```

## 数据库

数据库文件保存在 `~/website/data/task_slayer.db`，容器删除后数据不会丢失。

备份数据库：
```bash
cp ~/website/data/task_slayer.db ~/website/data/task_slayer.db.bak
```
