import { sql } from '@vercel/postgres';

// 创建消息表
export async function createMessagesTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        nickname VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'general',
        towho VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Messages table ready');
  } catch (error) {
    console.error('Error creating messages table:', error);
    throw error;
  }
}

// 消息类型枚举
export const MessageType = {
  general: 'general', // 游客留言
  common: 'common', // 公共留言
  private: 'private' // 私密留言
} as const;

// 消息接口
export interface Message {
  id: number;
  nickname: string;
  content: string;
  type: typeof MessageType[keyof typeof MessageType];
  towho?: string;
  created_at: Date;
} 