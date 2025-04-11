import { VercelRequest, VercelResponse } from '@vercel/node';
import dbConnect from '../utils/dbConnect';
import { Message, MessageType } from '../models/Message';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允许' });
  }

  try {
    // 连接数据库
    await dbConnect();

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