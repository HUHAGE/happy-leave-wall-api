import { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../utils/dbConnect';
import { Message, MessageType } from '../models/Message';

// CORS 配置
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000'  // 默认允许本地开发环境
];

// 从环境变量获取允许的源站
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? [...DEFAULT_ALLOWED_ORIGINS, ...process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())]
  : DEFAULT_ALLOWED_ORIGINS;

// CORS 中间件
function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  
  // 检查请求源是否在允许列表中
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res);
    return res.status(200).end();
  }

  // 为所有请求设置 CORS 头
  setCorsHeaders(req, res);
  
  await dbConnect();

  switch (req.method) {
    case 'GET':
      return getMessages(req, res);
    case 'POST':
      return createMessage(req, res);
    default:
      return res.status(405).json({ message: '方法不允许' });
  }
}

// 获取留言列表
async function getMessages(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // 构建查询条件
    const query: any = {};
    if (type && Object.values(MessageType).includes(type as MessageType)) {
      query.type = type;
    }

    // 验证分页参数
    const pageNumber = Math.max(1, parseInt(page as string));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNumber - 1) * limitNumber;

    // 构建排序条件
    const sort: { [key: string]: 'asc' | 'desc' } = {};
    if (['createdAt', 'type'].includes(sortBy as string)) {
      sort[sortBy as string] = (order as 'asc' | 'desc') === 'asc' ? 'asc' : 'desc';
    }

    // 查询数据
    const [messages, total] = await Promise.all([
      Message.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Message.countDocuments(query)
    ]);

    return res.status(200).json({
      message: '获取成功',
      data: {
        messages,
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
    const { nickname, content, type } = req.body;

    // 验证必填字段
    if (!nickname || !content) {
      return res.status(400).json({ message: '昵称和内容为必填项' });
    }

    // 验证留言类型
    if (type && !Object.values(MessageType).includes(type)) {
      return res.status(400).json({ message: '无效的留言类型' });
    }

    // 创建新留言
    const message = await Message.create({
      nickname,
      content,
      type: type || MessageType.GENERAL,
      createdAt: new Date()
    });

    return res.status(201).json({
      message: '留言成功',
      data: message
    });
  } catch (error) {
    console.error('留言失败:', error);
    return res.status(500).json({ message: '服务器内部错误' });
  }
} 