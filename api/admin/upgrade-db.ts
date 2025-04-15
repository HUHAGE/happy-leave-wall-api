import { VercelRequest, VercelResponse } from '@vercel/node';
import { upgradeDatabase } from '../utils/upgrade_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS响应头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 仅允许POST请求和带有管理员授权的请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允许POST请求' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: '未授权，需要管理员权限' });
  }

  try {
    const result = await upgradeDatabase();
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('数据库升级失败:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || '数据库升级过程中发生错误' 
    });
  }
} 