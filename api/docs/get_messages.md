# 获取留言接口文档

## 接口说明
该接口用于获取留言墙上的留言列表，支持分页查询和按时间排序。

## 接口信息
- **接口URL**: `https://www.huhawall.online/api/messages`
- **请求方式**: GET
- **Content-Type**: application/json
- **跨域支持**: 是

## 跨域配置
接口已配置跨域支持，具体如下：
- **允许的源**: 
  - `http://localhost:8080`（本地开发环境）
  - `https://www.huhawall.online`
  - `https://www.huhawall.fun`
- **允许的请求方法**: GET, POST, PUT, DELETE, OPTIONS
- **允许的请求头**: X-Requested-With, Content-Type, Authorization
- **允许发送凭证**: 是（支持发送 cookies）
- **预检请求缓存时间**: 86400秒（24小时）

## 请求参数
### 查询参数（Query Parameters）
| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| page | number | 否 | 页码，从1开始 | 1 |
| limit | number | 否 | 每页显示数量，最大50 | 10 |
| sort | string | 否 | 排序方式：'latest'（最新）或 'oldest'（最早） | 'latest' |
| type | string | 否 | 留言类型：'general'（游客留言）、'common'（公共留言）或 'private'（私密留言） | 无 |
| search | string | 否 | 搜索关键词，将在昵称和内容中进行模糊搜索 | 无 |

## 响应结果
### 成功响应
- **状态码**: 200
- **响应体**:
```json
{
  "messages": [
    {
      "id": "number",           // 留言ID
      "content": "string",      // 留言内容
      "author": {
        "id": "number",         // 作者ID
        "username": "string"    // 作者用户名
      },
      "createdAt": "string",    // 创建时间，ISO 8601格式
      "updatedAt": "string"     // 更新时间，ISO 8601格式
    }
  ],
  "pagination": {
    "currentPage": "number",    // 当前页码
    "totalPages": "number",     // 总页数
    "totalItems": "number",     // 总留言数
    "limit": "number"          // 每页显示数量
  }
}
```

### 错误响应
1. **参数错误**
- **状态码**: 400
```json
{
  "error": "无效的分页参数"
}
```

2. **未授权访问**
- **状态码**: 401
```json
{
  "error": "请先登录"
}
```

3. **请求方法错误**
- **状态码**: 405
```json
{
  "error": "只支持 GET 方法"
}
```

4. **服务器错误**
- **状态码**: 500
```json
{
  "error": "服务器内部错误"
}
```

## 调用示例

### 使用 curl
```bash
# 获取第一页，每页10条留言
curl "https://www.huhawall.online/api/messages?page=1&limit=10&sort=latest"
```

### 使用 JavaScript/TypeScript
```javascript
const getMessages = async ({
  page = 1,
  limit = 10,
  sort = 'latest',
  type,
  search
} = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort
  });

  if (type) params.append('type', type);
  if (search) params.append('search', search);

  const response = await fetch(
    `https://www.huhawall.online/api/messages?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await response.json();
  return data;
};

// 使用示例
try {
  // 获取所有游客留言
  const result1 = await getMessages({ type: 'general' });
  console.log(result1);

  // 搜索包含"你好"的留言
  const result2 = await getMessages({ search: '你好' });
  console.log(result2);
} catch (error) {
  console.error('获取留言失败:', error);
}
```

## 注意事项
1. 接口需要用户登录后才能访问
2. 分页参数必须是正整数
3. 排序参数只接受 'latest' 或 'oldest'
4. 返回的时间格式为 ISO 8601 标准格式 