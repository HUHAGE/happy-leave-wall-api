# 点赞接口文档

## 基础信息

- 接口域名：`https://happy-leave-wall-api.vercel.app`
- 开发环境：`http://localhost:3000`

## 接口列表

### 1. 获取点赞状态

检查当前用户是否已对指定留言点赞。

#### 请求信息

- 请求路径：`/api/messages/like`
- 请求方法：`GET`
- Content-Type：`application/json`

#### 请求参数

Query 参数：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| messageId | number | 是 | 留言ID | 1 |

#### 响应信息

```json
{
  "message": "获取点赞状态成功",
  "data": {
    "hasLiked": true  // true表示已点赞，false表示未点赞
  }
}
```

### 2. 点赞

对指定留言进行点赞。

#### 请求信息

- 请求路径：`/api/messages/like`
- 请求方法：`POST`
- Content-Type：`application/json`

#### 请求参数

Query 参数：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| messageId | number | 是 | 留言ID | 1 |

#### 响应信息

点赞成功：
```json
{
  "message": "点赞成功"
}
```

已经点过赞：
```json
{
  "message": "您已经点过赞了",
  "status": 409
}
```

留言不存在：
```json
{
  "message": "留言不存在",
  "status": 404
}
```

### 3. 取消点赞

取消对指定留言的点赞。

#### 请求信息

- 请求路径：`/api/messages/like`
- 请求方法：`DELETE`
- Content-Type：`application/json`

#### 请求参数

Query 参数：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| messageId | number | 是 | 留言ID | 1 |

#### 响应信息

取消点赞成功：
```json
{
  "message": "取消点赞成功"
}
```

未找到点赞记录：
```json
{
  "message": "未找到点赞记录",
  "status": 404
}
```

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 409 | 资源冲突（已点赞） |
| 500 | 服务器内部错误 |

## 注意事项

1. 点赞使用用户 IP 作为唯一标识，同一 IP 只能对同一条留言点赞一次
2. 点赞和取消点赞会自动更新留言的点赞总数
3. 删除留言时会自动删除相关的点赞记录

## 调用示例

```javascript
// 检查点赞状态
const checkResponse = await fetch(`/api/messages/like?messageId=1`);
const { data: { hasLiked } } = await checkResponse.json();

// 点赞
const likeResponse = await fetch(`/api/messages/like?messageId=1`, {
  method: 'POST'
});

// 取消点赞
const unlikeResponse = await fetch(`/api/messages/like?messageId=1`, {
  method: 'DELETE'
});
```

## 相关接口

- [获取留言列表](/api/docs/messages.md)：返回的留言数据中包含 `likes_count` 字段，表示该留言的点赞总数 