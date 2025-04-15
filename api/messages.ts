import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { Message, MessageType, createMessagesTable, createCommentsTable, createLikesTable } from './utils/db';
import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "./middleware/jwt";
import { pool } from "./sql/db";
import { v4 as uuidv4 } from "uuid";

// CORS 配置
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8080',
  'https://happy-leave-wall.vercel.app',
  'https://happy-leave-wall-api.vercel.app',
  'https://www.huhawall.fun',
  'https://www.huhawall.online'
];

// 从环境变量获取允许的源站
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())])]
  : DEFAULT_ALLOWED_ORIGINS;

// 开发环境打印配置信息
if (process.env.NODE_ENV !== 'production') {
  console.log('环境变量 ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);
  console.log('允许的源站列表:', ALLOWED_ORIGINS);
}

// CORS 中间件
function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  
  // 打印调试信息
  console.log('请求源:', origin);
  console.log('当前环境:', process.env.NODE_ENV);
  console.log('允许的源站:', ALLOWED_ORIGINS);
  
  if (!origin) {
    console.log('没有 origin 头部');
    return;
  }

  // 检查是否是允许的源
  if (process.env.NODE_ENV === 'development' || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
  } else {
    console.log('不允许的源:', origin);
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

export const config = {
  runtime: "edge",
};

// 处理消息相关的所有操作（获取消息、创建消息、评论、点赞等）
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 优先处理CORS
  setCorsHeaders(req, res);
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 获取action参数
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const action = url.searchParams.get('action');
    
    // 确保数据表存在
    await createMessagesTable();
    
    // 根据action选择不同的处理方式
    if (action === 'comments') {
      await createCommentsTable();
      return handleComments(req, res);
    } else if (action === 'like') {
      await createLikesTable();
      return handleLike(req, res);
    } else {
      // 默认处理留言
      // 解析路径
      const pathParts = url.pathname.split('/').filter(Boolean);
      
      // 如果路径是 /api/messages/{number}，则获取单条留言
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        const messageId = parseInt(lastPart);
        
        if (!isNaN(messageId)) {
          return getMessage(messageId, req, res);
        }
      }

      switch (req.method) {
        case 'GET':
          return getMessages(req, res);
        case 'POST':
          return createMessage(req, res);
        default:
          return res.status(405).json({ message: '方法不允许' });
      }
    }
  } catch (error) {
    console.error('请求处理失败:', error);
    console.error('错误详情:', error instanceof Error ? error.message : '未知错误');
    console.error('请求URL:', req.url);
    console.error('请求方法:', req.method);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}

// 处理评论相关的请求
async function handleComments(req: VercelRequest, res: VercelResponse) {
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
}

// 处理点赞相关的请求
async function handleLike(req: VercelRequest, res: VercelResponse) {
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
}

// 获取留言列表
async function getMessages(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      page = '1',
      limit = '10',
      type,
      search,
      wall_id
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string)));
    const offset = (pageNumber - 1) * limitNumber;
    
    // 验证消息类型
    const isValidType = type && typeof type === 'string' && Object.values(MessageType).includes(type as keyof typeof MessageType);
    const messageType = isValidType ? type as keyof typeof MessageType : undefined;

    // 构建查询条件
    let whereClause = [];
    let params: any[] = [];
    
    if (messageType) {
      whereClause.push(`type = $${params.length + 1}`);
      params.push(messageType);
    }
    
    if (search) {
      whereClause.push(`(LOWER(nickname) LIKE $${params.length + 1} OR LOWER(content) LIKE $${params.length + 1})`);
      params.push(`%${(search as string).toLowerCase()}%`);
    }

    // 根据wall_id过滤
    if (wall_id) {
      whereClause.push(`wall_id = $${params.length + 1}`);
      params.push(wall_id);
    }

    const whereStr = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    // 执行查询，包含点赞数
    const messages = await sql.query(
      `SELECT m.*, COALESCE(m.likes_count, 0) as likes_count,
      (SELECT COUNT(*) FROM comments c WHERE c.message_id = m.id) as comment_count
      FROM messages m
      ${whereStr}
      ORDER BY created_at DESC 
      LIMIT $${params.length + 1} 
      OFFSET $${params.length + 2}`,
      [...params, limitNumber, offset]
    );

    // 获取总数
    const totalResult = await sql.query(
      `SELECT COUNT(*) as total 
      FROM messages
      ${whereStr}`,
      params
    );

    const total = parseInt(totalResult.rows[0].total);

    return res.status(200).json({
      message: '获取成功',
      data: {
        messages: messages.rows,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber)
        }
      }
    });
  } catch (error) {
    console.error('获取留言列表失败:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}

// 创建留言
async function createMessage(req: VercelRequest, res: VercelResponse) {
  try {
    const { content, nickname, type, wallId, lat, lng, address } = req.body;
    const userIp = getClientIP(req);

    // 验证必填字段
    if (!content || !nickname || !type) {
      return res.status(400).json({ message: '内容、昵称和类型为必填项' });
    }

    // 验证类型
    if (!Object.values(MessageType).includes(type)) {
      return res.status(400).json({ message: '无效的留言类型' });
    }

    // 创建留言
    const result = await sql.query(
      `INSERT INTO messages (content, nickname, type, wall_id, user_ip, likes_count, lat, lng, address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [content, nickname, type, wallId || null, userIp, 0, lat || null, lng || null, address || null]
    );

    return res.status(201).json({
      message: '创建成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('创建留言失败:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}

// 获取单个留言
async function getMessage(messageId: number, req: VercelRequest, res: VercelResponse) {
  try {
    // 检查留言是否存在
    const result = await sql.query(
      `SELECT m.*, COALESCE(m.likes_count, 0) as likes_count,
      (SELECT COUNT(*) FROM comments c WHERE c.message_id = m.id) as comment_count
      FROM messages m
      WHERE m.id = $1`,
      [messageId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: '留言不存在' });
    }

    return res.status(200).json({
      message: '获取成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('获取留言详情失败:', error);
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