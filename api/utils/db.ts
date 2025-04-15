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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        wall_id UUID REFERENCES walls(id) ON DELETE SET NULL
      );
    `;
    
    // 检查是否需要添加wall_id列
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'wall_id';
    `;
    
    if (result.rowCount === 0) {
      await sql`
        ALTER TABLE messages 
        ADD COLUMN IF NOT EXISTS wall_id UUID REFERENCES walls(id) ON DELETE SET NULL;
      `;
      console.log('Added wall_id column to messages table');
    }
    
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
  wall_id?: string; // 添加wall_id字段，可选，UUID类型，但在TypeScript中表示为字符串
  created_at: Date;
}

// 点赞记录接口
export interface Like {
  id: number;
  message_id: number;
  user_ip: string;
  created_at: Date;
}

// 创建点赞表
export async function createLikesTable() {
  try {
    // 先修改 messages 表，添加 likes_count 字段
    await sql`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
    `;
    console.log('Added likes_count column to messages table');

    // 创建点赞记录表
    await sql`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_ip VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, user_ip)
      );
    `;
    console.log('Likes table ready');
  } catch (error) {
    console.error('Error creating likes table:', error);
    throw error;
  }
}

// 评论接口
export interface Comment {
  id: number;
  message_id: number;
  nickname: string;
  content: string;
  user_ip: string;
  created_at: Date;
  likes_count: number;
}

// 创建评论表
export async function createCommentsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        nickname VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        user_ip VARCHAR(50) NOT NULL,
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Comments table ready');
  } catch (error) {
    console.error('Error creating comments table:', error);
    throw error;
  }
}

// Wall样式枚举
export enum WallStyle {
  STANDARD = 'standard',
  CORK = 'cork',
  BLACKBOARD = 'blackboard',
  COLORFUL = 'colorful'
}

// Wall接口定义
export interface Wall {
  id: string;
  name: string;
  description?: string;
  style: WallStyle;
  max_messages: number;
  requires_approval: boolean;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  background_color?: string;
  font_family?: string;
  is_public: boolean;
  view_count: number;
}

// 创建walls表
export async function createWallsTable() {
  try {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS walls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        style VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (style IN ('standard', 'cork', 'blackboard', 'colorful')),
        max_messages INTEGER NOT NULL DEFAULT 100 CHECK (max_messages > 0),
        requires_approval BOOLEAN NOT NULL DEFAULT false,
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT true,
        background_color VARCHAR(7),
        font_family VARCHAR(100),
        is_public BOOLEAN NOT NULL DEFAULT true,
        view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0)
      );

      -- 创建更新时间触发器
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- 如果触发器不存在则创建
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_walls_updated_at') THEN
          CREATE TRIGGER update_walls_updated_at
              BEFORE UPDATE ON walls
              FOR EACH ROW
              EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END
      $$;

      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_walls_created_by ON walls(created_by);
      CREATE INDEX IF NOT EXISTS idx_walls_created_at ON walls(created_at);
      CREATE INDEX IF NOT EXISTS idx_walls_is_public ON walls(is_public);
    `);
    
    console.log('Walls表创建成功');
  } catch (error) {
    console.error('创建Walls表失败:', error);
    throw error;
  }
} 