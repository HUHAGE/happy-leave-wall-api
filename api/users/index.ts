import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { hash } from 'bcryptjs';

interface RegisterRequest {
  username: string;
  password: string;
  accountType: 'wechat' | 'normal';
  email?: string;
  nickname?: string;
}

// CORS 配置
const allowedOrigins = ['http://localhost:8080', 'https://www.huhawall.online', 'https://www.huhawall.fun'];

function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // 设置 CORS 头
  setCorsHeaders(request, response);

  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // 获取action参数，决定是登录还是注册
  const action = request.query.action as string;

  // 根据action调用相应的处理函数
  if (action === 'login') {
    return await handleLogin(request, response);
  } else if (action === 'register') {
    return await handleRegister(request, response);
  } else {
    return response.status(400).json({ error: '无效的操作类型' });
  }
}

// 处理用户登录
async function handleLogin(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: '只支持 POST 方法' });
  }

  try {
    const { username, password } = request.body;

    // 验证输入
    if (!username || !password) {
      return response.status(400).json({ error: '用户名和密码都是必需的' });
    }

    // 查询用户
    const result = await sql`
      SELECT id, username, password
      FROM users
      WHERE username = ${username}
    `;

    const user = result.rows[0];

    // 用户不存在
    if (!user) {
      return response.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return response.status(401).json({ error: '用户名或密码错误' });
    }

    // 登录成功，返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;
    
    return response.status(200).json({
      message: '登录成功',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('登录错误:', error);
    return response.status(500).json({ error: '服务器内部错误' });
  }
}

// 处理用户注册
async function handleRegister(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: '仅支持 POST 请求' });
  }

  try {
    const { username, password, accountType, email, nickname }: RegisterRequest = request.body;

    // 参数验证
    if (!username || !password || !accountType) {
      return response.status(400).json({ error: '用户名、密码和账号类型为必填项' });
    }

    if (username.length < 3 || username.length > 50) {
      return response.status(400).json({ error: '用户名长度必须在 3-50 个字符之间' });
    }

    if (password.length < 6) {
      return response.status(400).json({ error: '密码长度必须大于 6 个字符' });
    }

    // 检查用户名是否已存在
    const existingUser = await sql`
      SELECT username FROM users WHERE username = ${username}
    `;

    if (existingUser.rowCount > 0) {
      return response.status(409).json({ error: '用户名已存在' });
    }

    // 密码加密
    const hashedPassword = await hash(password, 10);

    // 创建用户
    const result = await sql`
      INSERT INTO users (username, password, account_type, email, nickname)
      VALUES (${username}, ${hashedPassword}, ${accountType}, ${email}, ${nickname})
      RETURNING id, username, account_type, created_at
    `;

    const user = result.rows[0];

    return response.status(201).json({
      message: '注册成功',
      user: {
        id: user.id,
        username: user.username,
        accountType: user.account_type,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('注册失败:', error);
    return response.status(500).json({ error: '注册失败，请稍后重试' });
  }
} 