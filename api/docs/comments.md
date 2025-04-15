# 评论接口文档

## 基础信息

- 接口域名：`https://happy-leave-wall-api.vercel.app`
- 开发环境：`http://localhost:3000`

## 接口列表

### 1. 获取评论列表

获取指定留言的评论列表。

#### 请求信息

- 请求路径：`/api/messages/comments`
- 请求方法：`GET`
- Content-Type：`application/json`

#### 请求参数

Query 参数：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| messageId | number | 是 | 留言ID | 1 |
| page | number | 否 | 页码，默认 1 | 1 |
| limit | number | 否 | 每页条数，默认 10，最大 50 | 10 |

#### 响应信息

```json
{
  "message": "获取成功",
  "data": {
    "comments": [
      {
        "id": 1,
        "message_id": 1,
        "nickname": "张三",
        "content": "这是一条评论",
        "user_ip": "127.0.0.1",
        "likes_count": 0,
        "created_at": "2024-01-01T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

### 2. 添加评论

对指定留言添加评论。

#### 请求信息

- 请求路径：`/api/messages/comments`
- 请求方法：`POST`
- Content-Type：`application/json`

#### 请求参数

Query 参数：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| messageId | number | 是 | 留言ID | 1 |

Body 参数：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| nickname | string | 是 | 评论者昵称 | "张三" |
| content | string | 是 | 评论内容 | "这是一条评论" |

#### 响应信息

```json
{
  "message": "评论成功",
  "data": {
    "id": 1,
    "message_id": 1,
    "nickname": "张三",
    "content": "这是一条评论",
    "user_ip": "127.0.0.1",
    "likes_count": 0,
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

### 3. 删除评论

删除指定的评论。只能删除自己发布的评论。

#### 请求信息

- 请求路径：`/api/messages/comments`
- 请求方法：`DELETE`
- Content-Type：`application/json`

#### 请求参数

Query 参数：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| messageId | number | 是 | 留言ID | 1 |
| commentId | number | 是 | 评论ID | 1 |

#### 响应信息

删除成功：
```json
{
  "message": "删除成功"
}
```

评论不存在或无权限：
```json
{
  "message": "评论不存在或您没有权限删除该评论",
  "status": 404
}
```

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在或无权限 |
| 500 | 服务器内部错误 |

## 注意事项

1. 评论使用用户 IP 作为标识，只能删除自己发布的评论
2. 删除留言时会自动删除该留言下的所有评论（级联删除）
3. 评论支持点赞功能，可以通过点赞接口对评论进行点赞

## 调用示例

```javascript
// 获取评论列表
const getCommentsResponse = await fetch(`/api/messages/comments?messageId=1&page=1&limit=10`);
const { data: { comments, pagination } } = await getCommentsResponse.json();

// 添加评论
const addCommentResponse = await fetch(`/api/messages/comments?messageId=1`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nickname: '张三',
    content: '这是一条评论'
  })
});

// 删除评论
const deleteCommentResponse = await fetch(`/api/messages/comments?messageId=1&commentId=1`, {
  method: 'DELETE'
});
```

## 相关接口

- [留言接口](/api/docs/messages.md)：留言的增删改查
- [点赞接口](/api/docs/like.md)：可用于对评论进行点赞 