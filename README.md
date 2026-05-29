# WeAuth

> 微信 OAuth SDK 逆向工程 | Lptiyu - 微信 OAuth 协议实现

一个基于 Tauri 的微信扫码登录工具，通过逆向微信协议实现 OAuth 认证流程，为开发者提供便捷的微信登录凭据获取方案。

## ✨ 功能特性

- 🔐 **完整的 OAuth 流程**：支持微信扫码登录，获取完整的认证凭据
- 👤 **用户信息展示**：实时显示用户昵称和头像
- 🛡️ **安全可靠**：本地运行，凭据不经过第三方服务器
- 🎨 **现代化 UI**：基于 React + TailwindCSS 的精美界面
- 📋 **一键复制**：所有凭据支持一键复制到剪贴板
- 🔄 **自动重试**：网络异常或二维码过期自动重试
- 📊 **详细日志**：可查看完整的认证流程日志

## 🚀 快速开始

### 下载使用

前往 [Releases](https://github.com/H3CoF6/weauth/releases) 页面下载最新版本：

- **Windows**: 下载 `.msi` 或 `.exe` 安装包
- 双击安装后即可使用

### 使用步骤

1. 启动应用，点击「我是开发者」进入开发者模式
2. 等待二维码生成
3. 使用微信扫描二维码
4. 在手机上确认登录
5. 自动获取并显示所有认证凭据
6. 点击复制按钮复制所需凭据

## 📦 获取的凭据

- **授权码 (Auth Code)**: 用于换取 Access Token
- **访问令牌 (Access Token)**: 用于调用微信 API
- **刷新令牌 (Refresh Token)**: 用于刷新 Access Token
- **开放平台 ID (OpenID)**: 用户在当前应用的唯一标识
- **联合 ID (UnionID)**: 用户在开放平台的唯一标识

## 🛠️ 技术栈

### 前端
- **Tauri**: 跨平台桌面应用框架
- **React**: UI 框架
- **TypeScript**: 类型安全的 JavaScript
- **TailwindCSS**: 原子化 CSS 框架
- **Framer Motion**: 动画库
- **Vite**: 构建工具

### 后端
- **Rust**: Tauri 后端语言
- **Go**: DLL 核心逻辑
- **Protocol Buffers**: 数据序列化

## 💻 开发指南

### 环境要求

- Node.js 20+
- pnpm 8+
- Rust (最新稳定版)
- Go 1.20+ (如需修改 DLL)

### 本地开发

```bash
# 克隆项目
git clone https://github.com/H3CoF6/weauth.git
cd weauth

# 安装依赖
pnpm install

# 启动开发服务器
pnpm tauri dev
```

### 构建发布

```bash
# 构建生产版本
pnpm tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`

## ⚠️ 注意事项

- 本项目仅供学习研究使用，请勿用于非法用途
- 获取的凭据请妥善保管，不要泄露给他人
- 微信可能会更新协议，导致功能失效
- 使用本工具产生的任何后果由使用者自行承担

## 📝 开发日志

- ✅ 完整的扫码登录流程
- ✅ 用户头像显示
- ✅ 凭据一键复制
- ✅ 详细日志查看
- ✅ 错误自动重试
- ✅ DLL 崩溃保护
- 🚧 机器人集成（开发中）

## 🙏 鸣谢

### 鸣谢

![GitHub Repo Card](https://githubcard.com/LagrangeDev/LagrangeV2.svg)

![GitHub Repo Card](https://githubcard.com/G5t4r/WeProtocol.svg)

![GitHub Repo Card](https://githubcard.com/SnowLuma/SnowLuma.svg)

<del>上面三个项目里面搬运了代码</del>
