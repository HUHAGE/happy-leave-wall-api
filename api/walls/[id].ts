import { VercelRequest, VercelResponse } from '@vercel/node';
import { getWallById } from '../models/wall';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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