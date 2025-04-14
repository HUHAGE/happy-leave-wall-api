# 发送留言接口文档

## 接口说明
该接口用于在留言墙上发送新的留言。

## 接口信息
- **接口URL**: `https://www.huhawall.online/api/messages`
- **请求方式**: POST
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
### 请求体（Request Body）
```json
{
  "nickname": "string",  // 必填，发送人昵称
  "content": "string",   // 必填，留言内容
  "type": "string",      // 必填，留言类型：'general'、'common' 或 'private'
  "towho": "string"      // 选填，留言对象（当type为private时使用）
}
```

### 参数说明
| 参数名 | 类型 | 必填 | 说明 | 限制 |
|--------|------|------|------|------|
| nickname | string | 是 | 发送人昵称 | 不能为空 |
| content | string | 是 | 留言内容 | 长度为1-500个字符 |
| type | string | 否 | 留言类型 | - 可选值：'general'、'common'、'private'<br>- 默认值：'general'（游客留言）<br>- 当设置为'private'时建议填写towho |
| towho | string | 否 | 留言对象 | 当type为'private'时可用于指定留言对象 |

## 响应结果
### 成功响应
- **状态码**: 201
- **响应体**:
```json
{
  "message": "留言发送成功",
  "data": {
    "id": "number",           // 留言ID
    "content": "string",      // 留言内容
    "author": {
      "id": "number",         // 作者ID
      "username": "string"    // 作者用户名
    },
    "createdAt": "string",    // 创建时间，ISO 8601格式
    "updatedAt": "string"     // 更新时间，ISO 8601格式
  }
}
```

### 错误响应
1. **参数错误**
- **状态码**: 400
```json
{
  "error": "留言内容不能为空"
}
```

或

```json
{
  "error": "留言内容超出长度限制"
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
  "error": "只支持 POST 方法"
}
```

4. **发送频率限制**
- **状态码**: 429
```json
{
  "error": "发送留言过于频繁，请稍后再试"
}
```

5. **服务器错误**
- **状态码**: 500
```json
{
  "error": "服务器内部错误"
}
```

## 调用示例

### 使用 curl
```bash
# 默认游客留言
curl -X POST https://www.huhawall.online/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "张三",
    "content": "这是一条测试留言"
  }'

# 指定留言类型
curl -X POST https://www.huhawall.online/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "张三",
    "content": "这是一条测试留言",
    "type": "private",
    "towho": "李四"
  }'
```

### 使用 JavaScript/TypeScript
```javascript
const sendMessage = async ({ nickname, content, type, towho }) => {
  const response = await fetch('https://www.huhawall.online/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nickname,
      content,
      ...(type && { type }), // 如果type未传值，使用默认值'general'
      ...(towho && { towho })
    })
  });

  const data = await response.json();
  return data;
};

// 使用示例
try {
  // 使用默认type（general）发送留言
  const result1 = await sendMessage({
    nickname: '张三',
    content: '这是一条测试留言'
  });
  console.log(result1);

  // 指定type发送私密留言
  const result2 = await sendMessage({
    nickname: '李四',
    content: '这是一条私密留言',
    type: 'private',
    towho: '王五'
  });
  console.log(result2);
} catch (error) {
  console.error('发送留言失败:', error);
}
```

## 注意事项
1. 接口需要用户登录后才能访问
2. 昵称（nickname）为必填项
3. 留言类型（type）若不填则默认为'general'（游客留言）
4. 留言内容长度限制为1-500个字符
5. 为防止垃圾信息，接口有发送频率限制
6. 返回的时间格式为 ISO 8601 标准格式
7. 创建成功后返回状态码为201 