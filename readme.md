好的，我来为你编写一个简单易懂的操作手册：

# 快乐留言墙 API 操作手册

## 一、环境准备

1. **安装必要的软件**
   - 安装 [Node.js](https://nodejs.org/) (建议选择 LTS 版本)
   - 安装 [Git](https://git-scm.com/)
   - 安装 VS Code 或其他代码编辑器

2. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

## 二、本地开发

1. **首次运行项目**
   ```bash
   # 克隆项目（如果是第一次）
   git clone [你的项目地址]
   
   # 进入项目目录
   cd happy-leave-wall-api
   
   # 安装依赖
   npm install
   
   # 登录 Vercel（第一次使用需要）
   vercel login
   
   # 启动本地开发服务器
   npm run dev
   ```

2. **测试 API**
   - 打开浏览器访问：`http://localhost:3000/api/hello`
   - 如果看到 `{"message":"Hello from the API!"}` 说明运行成功

## 三、代码更新流程

1. **本地修改代码**
   - 所有 API 代码都在 `api` 文件夹中
   - 新建 API 只需在 `api` 文件夹中创建新的 `.ts` 文件
   - 文件名就是 API 路径，例如：
     - `api/hello.ts` → `/api/hello`
     - `api/users/login.ts` → `/api/users/login`

2. **本地测试**
   ```bash
   # 启动本地服务器测试
   npm run dev
   ```

3. **部署更新**
   ```bash
   # 部署到生产环境
   npm run deploy
   ```

## 四、常见操作

1. **添加新的 API 端点**
   - 在 `api` 文件夹中创建新文件，例如 `api/users/create.ts`
   - 基本模板如下：
   ```typescript
   import { VercelRequest, VercelResponse } from '@vercel/node';

   export default function handler(request: VercelRequest, response: VercelResponse) {
     // 你的代码逻辑
     response.status(200).json({
       message: '这是新的 API'
     });
   }
   ```

2. **添加环境变量**
   - 本地开发：在项目根目录创建 `.env` 文件
   - 生产环境：在 Vercel 控制台添加
     1. 登录 [Vercel 控制台](https://vercel.com)
     2. 选择你的项目
     3. 点击 "Settings" → "Environment Variables"
     4. 添加需要的环境变量

3. **查看部署状态**
   - 访问 [Vercel 控制台](https://vercel.com)
   - 选择你的项目
   - 在 "Deployments" 标签页查看所有部署记录

## 五、故障排查

1. **本地运行失败**
   - 检查 Node.js 版本是否正确
   - 删除 `node_modules` 文件夹，重新运行 `npm install`
   - 确保所有环境变量都已正确设置

2. **部署失败**
   - 检查 Vercel 控制台的构建日志
   - 确保所有必要的环境变量都已在 Vercel 控制台设置
   - 确保代码没有语法错误

3. **API 返回 500 错误**
   - 检查 Vercel 控制台的 "Functions" 日志
   - 本地使用 `npm run dev` 测试相同接口

## 六、重要提示

1. **安全注意事项**
   - 不要将敏感信息（密码、密钥等）直接写在代码中
   - 使用环境变量存储敏感信息
   - 定期更新依赖包以修复安全漏洞

2. **最佳实践**
   - 每次修改前先在本地测试
   - 保持代码结构清晰，每个文件只处理一个功能
   - 定期备份数据库（如果使用）

## 七、有用的命令速查表

```bash
# 启动本地开发服务器
npm run dev

# 部署到生产环境
npm run deploy

# 查看 Vercel 项目信息
vercel list

# 拉取最新的环境变量
vercel env pull

# 查看部署日志
vercel logs
```

如果你遇到任何问题或需要更详细的说明，请随时询问！
