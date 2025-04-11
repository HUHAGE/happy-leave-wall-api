import mongoose from 'mongoose';

// 定义留言类型枚举
export enum MessageType {
  GENERAL = 'general',    // 普通留言
  SUGGESTION = 'suggestion',  // 建议
  QUESTION = 'question',   // 问题
  FEEDBACK = 'feedback'    // 反馈
}

// 定义留言数据结构接口
export interface IMessage {
  nickname: string;        // 用户昵称
  content: string;        // 留言内容
  type: MessageType;      // 留言类型
  createdAt: Date;       // 留言时间
}

// 创建 Mongoose Schema
const messageSchema = new mongoose.Schema<IMessage>({
  nickname: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 50
  },
  content: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: { 
    type: String,
    enum: Object.values(MessageType),
    default: MessageType.GENERAL
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// 创建并导出 Model
export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema); 