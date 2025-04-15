import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { Message, MessageType, createMessagesTable } from './utils/db';

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
    // 确保数据表存在
    await createMessagesTable();

    // 解析路径
    const url = new URL(req.url || '', `http://${req.headers.host}`);
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
  } catch (error) {
    console.error('请求处理失败:', error);
    console.error('错误详情:', error instanceof Error ? error.message : '未知错误');
    console.error('请求URL:', req.url);
    console.error('请求方法:', req.method);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}

// 获取留言列表
async function getMessages(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      page = '1',
      limit = '10',
      type,
      search
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

    const whereStr = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    // 执行查询，包含点赞数
    const messages = await sql.query(
      `SELECT m.*, COALESCE(m.likes_count, 0) as likes_count 
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

// 创建新留言
async function createMessage(req: VercelRequest, res: VercelResponse) {
  try {
    const { nickname, content, type, towho} = req.body;

    // 验证必填字段
    if (!nickname || !content) {
      return res.status(400).json({ message: '昵称和内容为必填项' });
    }

    // 验证留言类型
    if (!Object.values(MessageType).includes(type)) {
      return res.status(400).json({ message: '无效的留言类型' });
    }

    // 创建新留言
    const result = await sql`
      INSERT INTO messages (nickname, content, type, towho)
      VALUES (${nickname}, ${content}, ${type}, ${towho})
      RETURNING *
    `;

    return res.status(201).json({
      message: '留言成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('留言失败:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
}

// 获取单条留言详情
async function getMessage(messageId: number, req: VercelRequest, res: VercelResponse) {
  try {
    // 获取留言详情，包含点赞数
    const result = await sql`
      SELECT m.*, COALESCE(m.likes_count, 0) as likes_count 
      FROM messages m
      WHERE m.id = ${messageId}
    `;

    if (result.rowCount === 0) {
      return res.status(404).json({ message: '留言不存在' });
    }

    // 获取评论数量
    const commentCountResult = await sql`
      SELECT COUNT(*) as comment_count 
      FROM comments 
      WHERE message_id = ${messageId}
    `;

    // 获取最新的5条评论
    const recentComments = await sql`
      SELECT * FROM comments 
      WHERE message_id = ${messageId}
      ORDER BY created_at DESC 
      LIMIT 5
    `;

    const message = result.rows[0];
    const commentCount = parseInt(commentCountResult.rows[0].comment_count);

    return res.status(200).json({
      message: '获取成功',
      data: {
        ...message,
        comment_count: commentCount,
        recent_comments: recentComments.rows
      }
    });
  } catch (error) {
    console.error('获取留言详情失败:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
} 