# 留言接口文档

## 基础信息

- 接口域名：`https://happy-leave-wall-api.vercel.app`
- 开发环境：`http://localhost:3000`

## 接口列表

### 1. 获取单条留言详情

获取指定ID的留言详细信息，包括评论数量和最新评论。

#### 请求信息

- 请求路径：`/api/messages/{messageId}`
- 请求方法：`GET`
- Content-Type：`application/json`

#### 请求参数

Path 参数：

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| messageId | number | 是 | 留言ID | 29 |

#### 响应信息

```json
{
  "message": "获取成功",
  "data": {
    "id": 29,
    "nickname": "张三",
    "content": "这是一条留言",
    "type": "general",
    "towho": null,
    "created_at": "2024-01-01T12:00:00Z",
    "likes_count": 5,
    "comment_count": 3,
    "recent_comments": [
      {
        "id": 1,
        "message_id": 29,
        "nickname": "李四",
        "content": "这是一条评论",
        "user_ip": "127.0.0.1",
        "likes_count": 0,
        "created_at": "2024-01-01T12:30:00Z"
      }
      // ... 最多显示5条最新评论
    ]
  }
}
```

### 2. 获取留言列表

// ... 其他现有文档内容 ... 