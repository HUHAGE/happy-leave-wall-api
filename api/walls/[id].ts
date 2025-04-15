import { VercelRequest, VercelResponse } from '@vercel/node';
import { getWallById } from '../models/wall';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://www.huhawall.online',
    'https://huhawall.online'
  ];

  const origin = req.headers.origin;
  
  // 设置CORS响应头
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '无效的留言墙ID' });
  }

  if (req.method === 'GET') {
    try {
      const wall = await getWallById(id);
      
      if (!wall) {
        return res.status(404).json({ error: '留言墙不存在' });
      }

      return res.status(200).json(wall);
    } catch (error) {
      console.error('Error getting wall:', error);
      return res.status(500).json({ error: '获取留言墙详情失败' });
    }
  }

  return res.status(405).json({ error: '不支持的请求方法' });
} 