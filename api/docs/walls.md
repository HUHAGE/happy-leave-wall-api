# 留言墙 API 文档

## 基础信息

- 基础路径：`/api/walls`
- 响应格式：JSON
- 时间格式：ISO 8601 (例如：`2024-03-15T08:00:00Z`)

## 数据模型

### 留言墙（Wall）

| 字段名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| id | UUID | 是 | 自动生成 | 留言墙唯一标识 |
| name | string | 是 | - | 留言墙名称，最大长度100字符 |
| description | string | 否 | null | 留言墙描述 |
| style | string | 否 | 'standard' | 留言墙风格，可选值：standard（标准）、cork（软木墙）、blackboard（黑板）、colorful（彩色） |
| maxMessages | number | 否 | 100 | 最大留言数量 |
| requiresApproval | boolean | 否 | false | 是否需要审核 |
| createdBy | UUID | 是 | - | 创建人ID |
| createdAt | datetime | 是 | 当前时间 | 创建时间 |
| updatedAt | datetime | 是 | 当前时间 | 更新时间 |
| isActive | boolean | 否 | true | 是否激活 |
| backgroundColor | string | 否 | null | 背景颜色（例如：#f5f5f5） |
| fontFamily | string | 否 | null | 字体 |
| isPublic | boolean | 否 | true | 是否公开 |
| viewCount | number | 否 | 0 | 查看次数 |

## API 接口

### 1. 创建留言墙

#### 请求

- 方法：`POST`
- 路径：`/api/walls`
- Content-Type: `application/json`

#### 请求体

```json
{
  "name": "我的留言墙",
  "description": "这是一个测试留言墙",
  "style": "cork",
  "maxMessages": 200,
  "requiresApproval": true,
  "createdBy": "user-uuid",
  "backgroundColor": "#f5f5f5",
  "fontFamily": "Arial",
  "isPublic": true
}
```

#### 请求参数说明

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 留言墙名称，不能为空，最大长度100字符 |
| description | string | 否 | 留言墙描述 |
| style | string | 否 | 留言墙风格，可选值：standard、cork、blackboard、colorful |
| maxMessages | number | 否 | 最大留言数量，必须大于0 |
| requiresApproval | boolean | 否 | 是否需要审核 |
| createdBy | string | 是 | 创建人UUID |
| backgroundColor | string | 否 | 背景颜色 |
| fontFamily | string | 否 | 字体 |
| isPublic | boolean | 否 | 是否公开 |

#### 响应

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "我的留言墙",
  "description": "这是一个测试留言墙",
  "style": "cork",
  "maxMessages": 200,
  "requiresApproval": true,
  "createdBy": "user-uuid",
  "createdAt": "2024-03-15T08:00:00Z",
  "updatedAt": "2024-03-15T08:00:00Z",
  "isActive": true,
  "backgroundColor": "#f5f5f5",
  "fontFamily": "Arial",
  "isPublic": true,
  "viewCount": 0
}
```

### 2. 获取留言墙列表

#### 请求

- 方法：`GET`
- 路径：`/api/walls`

#### 查询参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| limit | number | 否 | 10 | 每页数量 |
| offset | number | 否 | 0 | 偏移量 |

#### 响应

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "我的留言墙",
    "description": "这是一个测试留言墙",
    "style": "cork",
    "maxMessages": 200,
    "requiresApproval": true,
    "createdBy": "user-uuid",
    "createdAt": "2024-03-15T08:00:00Z",
    "updatedAt": "2024-03-15T08:00:00Z",
    "isActive": true,
    "backgroundColor": "#f5f5f5",
    "fontFamily": "Arial",
    "isPublic": true,
    "viewCount": 0
  }
  // ... 更多留言墙
]
```

### 3. 获取留言墙详情

#### 请求

- 方法：`GET`
- 路径：`/api/walls/{id}`

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 留言墙ID |

#### 响应

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "我的留言墙",
  "description": "这是一个测试留言墙",
  "style": "cork",
  "maxMessages": 200,
  "requiresApproval": true,
  "createdBy": "user-uuid",
  "createdAt": "2024-03-15T08:00:00Z",
  "updatedAt": "2024-03-15T08:00:00Z",
  "isActive": true,
  "backgroundColor": "#f5f5f5",
  "fontFamily": "Arial",
  "isPublic": true,
  "viewCount": 0
}
```

## 错误响应

当API调用出现错误时，会返回对应的错误信息：

```json
{
  "error": "错误信息"
}
```

### 常见错误码

| HTTP状态码 | 说明 |
|------------|------|
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 405 | 不支持的请求方法 |
| 500 | 服务器内部错误 |

### 常见错误信息

- 创建留言墙时：
  - "留言墙名称是必填项，且长度不能超过100个字符"
  - "创建人ID是必填项"
  - "无效的留言墙风格"
  - "最大留言数量必须是大于0的数字"
  - "创建留言墙失败"

- 获取留言墙时：
  - "无效的留言墙ID"
  - "留言墙不存在"
  - "获取留言墙详情失败"
  - "获取留言墙列表失败" 