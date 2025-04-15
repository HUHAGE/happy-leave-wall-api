import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { createLikesTable } from '../utils/db';

// 从 messages.ts 复用 CORS 配置
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8080',
  'https://happy-leave-wall.vercel.app',
  'https://happy-leave-wall-api.vercel.app',
  'https://www.huhawall.fun'
];

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())])]
  : DEFAULT_ALLOWED_ORIGINS;

function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  if (!origin) return;
  
  if (process.env.NODE_ENV === 'development' || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
}

// 获取客户端 IP
function getClientIP(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? (typeof forwarded === 'string' ? forwarded : forwarded[0])?.split(',')[0]
    : req.socket.remoteAddress;
  return ip || 'unknown';
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 处理 CORS
  setCorsHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 确保数据表存在
    await createLikesTable();

    const messageId = parseInt(req.query.messageId as string);
    if (isNaN(messageId)) {
      return res.status(400).json({ message: '无效的留言ID' });
    }

    const userIp = getClientIP(req);

    switch (req.method) {
      case 'POST':
        return addLike(messageId, userIp, res);
      case 'DELETE':
        return removeLike(messageId, userIp, res);
      case 'GET':
        return checkLikeStatus(messageId, userIp, res);
      default:
        return res.status(405).json({ message: '方法不允许' });
    }
  } catch (error) {
    console.error('处理点赞请求失败:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}

// 添加点赞
async function addLike(messageId: number, userIp: string, res: VercelResponse) {
  try {
    // 检查留言是否存在
    const message = await sql`
      SELECT id FROM messages WHERE id = ${messageId}
    `;
    
    if (message.rowCount === 0) {
      return res.status(404).json({ message: '留言不存在' });
    }

    // 尝试插入点赞记录
    const result = await sql`
      INSERT INTO likes (message_id, user_ip)
      VALUES (${messageId}, ${userIp})
      ON CONFLICT (message_id, user_ip) DO NOTHING
      RETURNING id
    `;

    // 如果成功插入（没有冲突），增加点赞数
    if (result.rowCount > 0) {
      await sql`
        UPDATE messages 
        SET likes_count = likes_count + 1 
        WHERE id = ${messageId}
      `;
      return res.status(200).json({ message: '点赞成功' });
    } else {
      return res.status(409).json({ message: '您已经点过赞了' });
    }
  } catch (error) {
    console.error('添加点赞失败:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}

// 取消点赞
async function removeLike(messageId: number, userIp: string, res: VercelResponse) {
  try {
    // 删除点赞记录
    const result = await sql`
      DELETE FROM likes 
      WHERE message_id = ${messageId} AND user_ip = ${userIp}
      RETURNING id
    `;

    // 如果成功删除，减少点赞数
    if (result.rowCount > 0) {
      await sql`
        UPDATE messages 
        SET likes_count = likes_count - 1 
        WHERE id = ${messageId}
      `;
      return res.status(200).json({ message: '取消点赞成功' });
    } else {
      return res.status(404).json({ message: '未找到点赞记录' });
    }
  } catch (error) {
    console.error('取消点赞失败:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}

// 检查点赞状态
async function checkLikeStatus(messageId: number, userIp: string, res: VercelResponse) {
  try {
    const result = await sql`
      SELECT id FROM likes 
      WHERE message_id = ${messageId} AND user_ip = ${userIp}
    `;

    return res.status(200).json({
      message: '获取点赞状态成功',
      data: {
        hasLiked: result.rowCount > 0
      }
    });
  } catch (error) {
    console.error('检查点赞状态失败:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
} 