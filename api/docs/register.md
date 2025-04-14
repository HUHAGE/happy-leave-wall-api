# 用户注册接口文档

## 接口说明
该接口用于创建新用户账号，支持普通账号和微信账号两种注册方式。

## 接口信息
- **接口URL**: `https://www.huhawall.online/api/users/register`
- **请求方式**: POST
- **Content-Type**: application/json

## 请求参数
### 请求体（Request Body）
```json
{
  "username": "string",     // 必填，用户名
  "password": "string",     // 必填，密码
  "accountType": "string",  // 必填，账号类型：'normal' 或 'wechat'
  "email": "string",       // 可选，邮箱
  "nickname": "string"     // 可选，昵称
}
```

### 参数说明
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名，长度3-50个字符 |
| password | string | 是 | 密码，最少6个字符 |
| accountType | string | 是 | 账号类型，只能是 'normal' 或 'wechat' |
| email | string | 否 | 用户邮箱 |
| nickname | string | 否 | 用户昵称 |

## 响应结果
### 成功响应
- **状态码**: 201
- **响应体**:
```json
{
  "message": "注册成功",
  "user": {
    "id": "number",          // 用户ID
    "username": "string",    // 用户名
    "accountType": "string", // 账号类型
    "createdAt": "string"    // 创建时间
  }
}
```

### 错误响应
1. **参数缺失**
- **状态码**: 400
```json
{
  "error": "用户名、密码和账号类型为必填项"
}
```

2. **用户名格式错误**
- **状态码**: 400
```json
{
  "error": "用户名长度必须在 3-50 个字符之间"
}
```

3. **密码格式错误**
- **状态码**: 400
```json
{
  "error": "密码长度必须大于 6 个字符"
}
```

4. **用户名已存在**
- **状态码**: 409
```json
{
  "error": "用户名已存在"
}
```

5. **服务器错误**
- **状态码**: 500
```json
{
  "error": "注册失败，请稍后重试"
}
```

## 调用示例

### 使用 curl
```bash
curl -X POST https://www.huhawall.online/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "accountType": "normal",
    "nickname": "测试用户",
    "email": "test@example.com"
  }'
```

### 使用 JavaScript/TypeScript
```javascript
const response = await fetch('https://www.huhawall.online/api/users/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'testuser',
    password: 'password123',
    accountType: 'normal',
    nickname: '测试用户',
    email: 'test@example.com'
  })
});

const data = await response.json();
console.log(data);
```

## 注意事项
1. 所有请求都需要设置 `Content-Type: application/json` 请求头
2. 用户名是唯一的，不能重复注册
3. 密码在服务器端会进行加密存储
4. 目前支持的域名：
   - `http://localhost:8080`（本地开发环境）
   - `https://www.huhawall.online`
   - `https://www.huhawall.fun`
