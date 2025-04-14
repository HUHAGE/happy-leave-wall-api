import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

// 允许的源
const allowedOrigins = ['http://localhost:8080', 'https://www.huhawall.online', 'https://www.huhawall.fun'];

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // 处理 CORS
  const origin = request.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Access-Control-Max-Age', '86400');
  }

  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

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