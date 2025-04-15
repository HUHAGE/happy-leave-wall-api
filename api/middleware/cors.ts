import { VercelRequest, VercelResponse } from '@vercel/node';

// CORS 配置
const corsConfig = {
  allowedOrigins: [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://www.huhawall.online',
    'https://huhawall.online'
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24小时
};

// CORS 中间件
export function cors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  
  // 检查请求源是否在允许列表中
  if (origin && corsConfig.allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // 允许携带凭证
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // 允许的请求方法
  res.setHeader('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '));
  
  // 允许的请求头
  res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
  
  // 预检请求的有效期
  res.setHeader('Access-Control-Max-Age', corsConfig.maxAge.toString());

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
} 