import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { createCommentsTable } from '../utils/db';

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
    await createCommentsTable();

    const messageId = parseInt(req.query.messageId as string);
    if (isNaN(messageId)) {
      return res.status(400).json({ message: '无效的留言ID' });
    }

    switch (req.method) {
      case 'GET':
        return getComments(messageId, req, res);
      case 'POST':
        return addComment(messageId, req, res);
      case 'DELETE':
        return deleteComment(messageId, req, res);
      default:
        return res.status(405).json({ message: '方法不允许' });
    }
  } catch (error) {
    console.error('处理评论请求失败:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}

// 获取评论列表
async function getComments(messageId: number, req: VercelRequest, res: VercelResponse) {
  try {
    const {
      page = '1',
      limit = '10'
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string)));
    const offset = (pageNumber - 1) * limitNumber;

    // 检查留言是否存在
    const message = await sql`
      SELECT id FROM messages WHERE id = ${messageId}
    `;
    
    if (message.rowCount === 0) {
      return res.status(404).json({ message: '留言不存在' });
    }

    // 获取评论列表
    const comments = await sql`
      SELECT * FROM comments 
      WHERE message_id = ${messageId}
      ORDER BY created_at DESC 
      LIMIT ${limitNumber} 
      OFFSET ${offset}
    `;

    // 获取总数
    const totalResult = await sql`
      SELECT COUNT(*) as total 
      FROM comments
      WHERE message_id = ${messageId}
    `;

    const total = parseInt(totalResult.rows[0].total);

    return res.status(200).json({
      message: '获取成功',
      data: {
        comments: comments.rows,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber)
        }
      }
    });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}

// 添加评论
async function addComment(messageId: number, req: VercelRequest, res: VercelResponse) {
  try {
    const { nickname, content } = req.body;
    const userIp = getClientIP(req);

    // 验证必填字段
    if (!nickname || !content) {
      return res.status(400).json({ message: '昵称和内容为必填项' });
    }

    // 检查留言是否存在
    const message = await sql`
      SELECT id FROM messages WHERE id = ${messageId}
    `;
    
    if (message.rowCount === 0) {
      return res.status(404).json({ message: '留言不存在' });
    }

    // 创建评论
    const result = await sql`
      INSERT INTO comments (message_id, nickname, content, user_ip)
      VALUES (${messageId}, ${nickname}, ${content}, ${userIp})
      RETURNING *
    `;

    return res.status(201).json({
      message: '评论成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('添加评论失败:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}

// 删除评论
async function deleteComment(messageId: number, req: VercelRequest, res: VercelResponse) {
  try {
    const commentId = parseInt(req.query.commentId as string);
    if (isNaN(commentId)) {
      return res.status(400).json({ message: '无效的评论ID' });
    }

    const userIp = getClientIP(req);

    // 检查评论是否存在且属于当前用户
    const result = await sql`
      DELETE FROM comments 
      WHERE id = ${commentId} 
      AND message_id = ${messageId} 
      AND user_ip = ${userIp}
      RETURNING id
    `;

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        message: '评论不存在或您没有权限删除该评论'
      });
    }

    return res.status(200).json({
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
} 