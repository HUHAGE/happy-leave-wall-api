import { sql } from '@vercel/postgres';

// 留言墙风格枚举
export enum WallStyle {
  STANDARD = 'standard',
  CORK = 'cork',
  BLACKBOARD = 'blackboard',
  COLORFUL = 'colorful'
}

// 创建留言墙表
export async function createWallTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS walls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        style VARCHAR(20) NOT NULL DEFAULT 'standard',
        max_messages INTEGER NOT NULL DEFAULT 100,
        requires_approval BOOLEAN NOT NULL DEFAULT false,
        created_by UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        background_color VARCHAR(20),
        font_family VARCHAR(50),
        is_public BOOLEAN DEFAULT true,
        view_count INTEGER DEFAULT 0,
        CONSTRAINT valid_style CHECK (style IN ('standard', 'cork', 'blackboard', 'colorful'))
      );
    `;
    console.log('Walls table created successfully');
  } catch (error) {
    console.error('Error creating walls table:', error);
    throw error;
  }
}

// 创建新留言墙
export async function createWall(
  name: string,
  description: string | null,
  style: WallStyle,
  maxMessages: number,
  requiresApproval: boolean,
  createdBy: string,
  backgroundColor?: string,
  fontFamily?: string,
  isPublic: boolean = true
) {
  try {
    const result = await sql`
      INSERT INTO walls (
        name, description, style, max_messages, requires_approval, 
        created_by, background_color, font_family, is_public
      )
      VALUES (
        ${name}, ${description}, ${style}, ${maxMessages}, ${requiresApproval}, 
        ${createdBy}, ${backgroundColor}, ${fontFamily}, ${isPublic}
      )
      RETURNING *;
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error creating wall:', error);
    throw error;
  }
}

// 获取留言墙列表
export async function getWalls(limit: number = 10, offset: number = 0) {
  try {
    const result = await sql`
      SELECT * FROM walls 
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;
    return result.rows;
  } catch (error) {
    console.error('Error getting walls:', error);
    throw error;
  }
}

// 根据ID获取留言墙
export async function getWallById(id: string) {
  try {
    const result = await sql`
      SELECT * FROM walls 
      WHERE id = ${id} AND is_active = true;
    `;
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting wall:', error);
    throw error;
  }
} 