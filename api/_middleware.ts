import { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  matcher: '/api/:path*',
};

export default function middleware(request: VercelRequest, response: VercelResponse, next: () => void) {
  // 允许的源，在生产环境中应该设置为具体的域名
  const allowedOrigins = ['http://localhost:8080', 'https://www.huhawall.online','https://www.huhawall.fun'];
  const origin = request.headers.origin;

  // 如果请求源在允许列表中，则设置对应的源
  if (origin && allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
  }

  // 允许的请求方法
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // 允许的请求头
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Content-Type, Authorization'
  );

  // 允许发送凭证（如 cookies）
  response.setHeader('Access-Control-Allow-Credentials', 'true');

  // 预检请求的缓存时间（单位：秒）
  response.setHeader('Access-Control-Max-Age', '86400');

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  // 继续处理请求
  return next();
} 