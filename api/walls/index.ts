import { VercelRequest, VercelResponse } from '@vercel/node';
import { createWall, getWalls, WallStyle } from '../models/wall';

// 验证请求体
function validateCreateWallBody(body: any) {
  if (!body.name || typeof body.name !== 'string' || body.name.length > 100) {
    return '留言墙名称是必填项，且长度不能超过100个字符';
  }
  
  if (!body.createdBy) {
    return '创建人ID是必填项';
  }
  
  if (body.style && !Object.values(WallStyle).includes(body.style)) {
    return '无效的留言墙风格';
  }
  
  if (body.maxMessages && (typeof body.maxMessages !== 'number' || body.maxMessages < 1)) {
    return '最大留言数量必须是大于0的数字';
  }
  
  return null;
}

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const validationError = validateCreateWallBody(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const {
        name,
        description,
        style = WallStyle.STANDARD,
        maxMessages = 100,
        requiresApproval = false,
        createdBy,
        backgroundColor,
        fontFamily,
        isPublic = true
      } = req.body;

      const wall = await createWall(
        name,
        description,
        style,
        maxMessages,
        requiresApproval,
        createdBy,
        backgroundColor,
        fontFamily,
        isPublic
      );

      return res.status(201).json(wall);
    } catch (error) {
      console.error('Error creating wall:', error);
      return res.status(500).json({ error: '创建留言墙失败' });
    }
  } else if (req.method === 'GET') {
    try {
      const limit = Number(req.query.limit) || 10;
      const offset = Number(req.query.offset) || 0;
      
      const walls = await getWalls(limit, offset);
      return res.status(200).json(walls);
    } catch (error) {
      console.error('Error getting walls:', error);
      return res.status(500).json({ error: '获取留言墙列表失败' });
    }
  }

  return res.status(405).json({ error: '不支持的请求方法' });
} 