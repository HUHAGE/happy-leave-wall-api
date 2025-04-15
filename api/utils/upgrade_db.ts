import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

// 升级walls表，将created_by字段类型从UUID改为INTEGER
export async function upgradeWallsTable() {
  try {
    // 1. 创建临时表
    await sql.query(`
      -- 创建临时表，使用新的created_by类型
      CREATE TABLE IF NOT EXISTS walls_temp (
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

      -- 复制数据（忽略原表中不符合新类型的数据）
      INSERT INTO walls_temp (
        id, name, description, style, max_messages, requires_approval, 
        created_by, created_at, updated_at, is_active, 
        background_color, font_family, is_public, view_count
      )
      SELECT 
        id, name, description, style, max_messages, requires_approval, 
        CASE 
          WHEN created_by ~ '^[0-9]+$' THEN created_by::INTEGER
          ELSE 1 -- 默认值，对于无法转换的UUID
        END as created_by,
        created_at, updated_at, is_active, 
        background_color, font_family, is_public, view_count
      FROM walls
      WHERE created_by ~ '^[0-9]+$' OR TRUE;

      -- 删除原表
      DROP TABLE IF EXISTS walls;

      -- 重命名临时表为正式表
      ALTER TABLE walls_temp RENAME TO walls;

      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_walls_created_by ON walls(created_by);
      CREATE INDEX IF NOT EXISTS idx_walls_created_at ON walls(created_at);
      CREATE INDEX IF NOT EXISTS idx_walls_is_public ON walls(is_public);

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
    `);
    
    console.log('Walls表升级成功');
    return { success: true, message: 'Walls表已成功升级，created_by字段类型从UUID改为INTEGER' };
  } catch (error: any) {
    console.error('升级Walls表失败:', error);
    throw error;
  }
}

// 执行所有升级操作
export async function upgradeDatabase() {
  try {
    await upgradeWallsTable();
    return { success: true, message: '数据库升级成功' };
  } catch (error: any) {
    console.error('数据库升级失败:', error);
    return { success: false, error: error.message || '未知错误' };
  }
}

// 导出默认函数用于Vercel Serverless Function调用
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST' && req.headers.authorization === process.env.ADMIN_API_KEY) {
    try {
      const result = await upgradeDatabase();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message || '数据库升级失败' });
    }
  } else {
    return res.status(405).json({ success: false, error: '方法不允许或未授权' });
  }
} 