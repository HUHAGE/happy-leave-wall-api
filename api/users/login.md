# 用户登录接口文档

## 接口说明
该接口用于用户登录，验证用户身份并返回用户信息。

## 接口信息
- **接口URL**: `https://www.huhawall.online/api/users/login`
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
  "username": "string",  // 必填，用户名
  "password": "string"   // 必填，密码
}
```

### 参数说明
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

## 响应结果
### 成功响应
- **状态码**: 200
- **响应体**:
```json
{
  "message": "登录成功",
  "user": {
    "id": "number",       // 用户ID
    "username": "string"  // 用户名
  }
}
```

### 错误响应
1. **参数缺失**
- **状态码**: 400
```json
{
  "error": "用户名和密码都是必需的"
}
```

2. **用户名或密码错误**
- **状态码**: 401
```json
{
  "error": "用户名或密码错误"
}
```

3. **请求方法错误**
- **状态码**: 405
```json
{
  "error": "只支持 POST 方法"
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
curl -X POST https://www.huhawall.online/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 使用 JavaScript/TypeScript
```javascript
const response = await fetch('https://www.huhawall.online/api/users/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'testuser',
    password: 'password123'
  })
});

const data = await response.json();
console.log(data);
```

## 注意事项
1. 所有请求都需要设置 `Content-Type: application/json` 请求头
2. 为了安全考虑，密码错误时不会明确提示是密码错误还是用户名错误
3. 目前支持的域名：
   - `http://localhost:8080`（本地开发环境）
   - `https://www.huhawall.online`
   - `https://www.huhawall.fun` 