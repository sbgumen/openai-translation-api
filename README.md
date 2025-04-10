# OpenAI Translation API


基于OpenAI API的多功能翻译服务，支持文本、表格、文档和音频翻译，带有现代化管理控制台。



## 📋 目录

- [特性](#-特性)
- [系统要求](#-系统要求)
- [安装](#-安装)
- [配置](#-配置)
- [启动服务](#-启动服务)
- [API参考](#-api参考)
  - [认证](#认证)
  - [文本翻译](#文本翻译)
  - [表格翻译](#表格翻译)
  - [文件翻译](#文件翻译)
- [管理控制台](#-管理控制台)
- [客户端示例](#-客户端示例)
- [表格翻译优化](#-表格翻译优化)
- [错误处理](#-错误处理)
- [安全建议](#-安全建议)
- [常见问题](#-常见问题)
- [许可证](#-许可证)

## ✨ 特性

- 🔤 **文本翻译** - 翻译普通文本内容
- 📊 **表格翻译** - 支持多种表格格式的智能翻译
- 📄 **文档翻译** - 翻译多种文档格式
- 🎵 **音频翻译** - 将音频转录然后翻译
- 🔑 **API密钥管理** - 安全的密钥创建和管理
- 🛡️ **管理控制台** - 现代化的管理界面
- ⚙️ **灵活配置** - 支持配置OpenAI模型和参数
- 🌐 **国际化支持** - 支持多语言翻译
- 📝 **API文档** - 内置详细的接口文档

## 💻 系统要求

- Node.js 14.0+
- npm 6.0+

## 🚀 安装

### 克隆仓库

```bash
git clone https://github.com/sbgumen/openai-translation-api.git
cd openai-translation-api
```

### 安装依赖

```bash
npm install
```

## ⚙️ 配置

### 环境变量

##添加配置
复制`.env.example`文件为`.env`并配置以下变量:

```bash
# 服务器配置
PORT=3000                        # 服务器端口
NODE_ENV=development             # 环境(development/production)

# OpenAI配置
OPENAI_API_KEY=your_openai_api_key  # OpenAI API密钥
OPENAI_API_BASE_URL=https://api.openai.com/v1  # API基础URL(可配置国内中转地址)

# JWT配置
JWT_SECRET=your_jwt_secret_key_change_this_in_production  # JWT密钥
JWT_EXPIRES_IN=24h              # JWT过期时间

# 管理员配置
ADMIN_USERNAME=root             # 默认管理员用户名
ADMIN_PASSWORD=123456           # 默认管理员密码
```
openai国内中转api:[https://api.lzx1.top](https://api.lzx1.top)
## 🏃 启动服务

### 开发模式启动

```bash
npm run dev
```

### 生产模式启动

```bash
npm start
```

### 访问服务

- API服务地址: `http://localhost:3000/`
- API文档: `http://localhost:3000/docs`
- 管理控制台: `http://localhost:3000/admin`
  - 默认用户名: `root`
  - 默认密码: `123456`

## 📘 API参考

### 认证

所有API调用需要在请求头中包含有效的API密钥:

```
X-API-Key: your-api-key-here
```

### 文本翻译

**端点**: `POST /api/translate/text`

**请求头**:
```
Content-Type: application/json
X-API-Key: your-api-key
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| text | string | 是 | 要翻译的文本 |
| sourceLanguage | string | 否 | 源语言（默认为"中文"） |
| targetLanguage | string | 否 | 目标语言（默认为"英文"） |

**请求示例**:

```json
{
  "text": "人工智能正在改变我们的生活方式。",
  "sourceLanguage": "中文",
  "targetLanguage": "英文"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "translatedText": "Artificial intelligence is changing our way of life.",
    "usage": {
      "prompt_tokens": 23,
      "completion_tokens": 9,
      "total_tokens": 32
    }
  }
}
```

### 表格翻译

**端点**: `POST /api/translate/table`

**请求头**:
```
Content-Type: application/json
X-API-Key: your-api-key
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| table | object/array | 是 | 要翻译的表格数据，支持以下格式：<br>- 对象数组: `[{},{},...]`<br>- 二维数组: `[[],[],...]`<br>- 嵌套对象: `{key:{...},...}` |
| sourceLanguage | string | 否 | 源语言（默认为"中文"） |
| targetLanguage | string | 否 | 目标语言（默认为"英文"） |

**请求示例**:

```json
{
  "table": [
    {"姓名": "张三", "职位": "软件工程师", "部门": "研发部"},
    {"姓名": "李四", "职位": "产品经理", "部门": "产品部"}
  ],
  "sourceLanguage": "中文",
  "targetLanguage": "英文"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "translatedTable": [
      {"name": "Zhang San", "position": "Software Engineer", "department": "R&D Department"},
      {"name": "Li Si", "position": "Product Manager", "department": "Product Department"}
    ],
    "usage": {
      "prompt_tokens": 82,
      "completion_tokens": 48,
      "total_tokens": 130
    }
  }
}
```

### 文件翻译

**端点**: `POST /api/translate/file`

**请求格式**: `multipart/form-data`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | file | 是 | 要翻译的文件，支持以下格式：<br>- 文本文件: `.txt`<br>- 表格文件: `.csv`, `.json`, `.xls`, `.xlsx`<br>- 文档文件: `.doc`, `.docx`<br>- 音频文件: `.mp3`, `.wav`, `.mp4`<br>最大文件大小：10MB |
| sourceLanguage | string | 否 | 源语言（默认为"中文"） |
| targetLanguage | string | 否 | 目标语言（默认为"英文"） |

**响应示例** (文本文件):

```json
{
  "success": true,
  "data": {
    "translatedText": "This is the translated content of the document.",
    "usage": {
      "prompt_tokens": 45,
      "completion_tokens": 10,
      "total_tokens": 55
    }
  }
}
```

**响应示例** (音频文件):

```json
{
  "success": true,
  "data": {
    "originalText": "这是原始的音频转录内容",
    "translatedText": "This is the original transcribed audio content",
    "usage": {
      "transcription": {
        "seconds": 5
      },
      "translation": {
        "prompt_tokens": 30,
        "completion_tokens": 12,
        "total_tokens": 42
      }
    }
  }
}
```

## 🛠️ 管理控制台

管理控制台提供直观的图形界面来管理API密钥和系统设置:

### 功能

1. **API密钥管理**
   - 创建新的API密钥
   - 设置密钥过期时间
   - 监控密钥使用情况
   - 删除失效密钥

2. **系统设置**
   - 选择OpenAI模型
     - gpt-3.5-turbo: 平衡速度与性能
     - gpt-3.5-turbo-16k: 支持更长文本
     - gpt-4: 更高翻译质量
     - gpt-4-turbo: 最新性能

3. **安全功能**
   - 管理员密码修改
   - 会话管理
   - 身份验证保护

### 访问控制台

访问地址: `http://localhost:3000/admin`

默认凭据:
- 用户名: `root`
- 密码: `123456`

## 📱 客户端示例

### Curl

```bash
# 文本翻译
curl -X POST \
  http://localhost:3000/api/translate/text \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: your-api-key-here' \
  -d '{
    "text": "你好，世界！",
    "sourceLanguage": "中文",
    "targetLanguage": "英文"
  }'

# 表格翻译
curl -X POST \
  http://localhost:3000/api/translate/table \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: your-api-key-here' \
  -d '{
    "table": [
      {"姓名": "张三", "职位": "软件工程师"},
      {"姓名": "李四", "职位": "产品经理"}
    ],
    "sourceLanguage": "中文",
    "targetLanguage": "英文"
  }'

# 文件翻译
curl -X POST \
  http://localhost:3000/api/translate/file \
  -H 'X-API-Key: your-api-key-here' \
  -F 'file=@/path/to/your/document.txt' \
  -F 'sourceLanguage=中文' \
  -F 'targetLanguage=英文'
```

### Node.js

```javascript
const axios = require('axios');

// 文本翻译
async function translateText() {
  try {
    const response = await axios.post(
      'http://localhost:3000/api/translate/text',
      {
        text: '人工智能正在改变我们的生活方式。',
        sourceLanguage: '中文',
        targetLanguage: '英文'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'your-api-key-here'
        }
      }
    );
    
    console.log(response.data);
  } catch (error) {
    console.error('翻译失败:', error.response?.data || error.message);
  }
}
```

### Python

```python
import requests
import json

# 文本翻译
def translate_text():
    url = "http://localhost:3000/api/translate/text"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": "your-api-key-here"
    }
    data = {
        "text": "人工智能正在改变我们的生活方式。",
        "sourceLanguage": "中文",
        "targetLanguage": "英文"
    }
    
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"翻译请求失败: {e}")
        return None
```

## 📊 表格翻译优化

本服务针对表格翻译做了专门优化，支持多种表格格式:

### 支持的表格格式

1. **对象数组格式**
```json
[
  {"姓名": "张三", "职位": "软件工程师"},
  {"姓名": "李四", "职位": "产品经理"}
]
```

2. **二维数组格式**
```json
[
  ["姓名", "职位"],
  ["张三", "软件工程师"],
  ["李四", "产品经理"]
]
```

3. **嵌套对象格式**
```json
{
  "员工1": {"姓名": "张三", "职位": "软件工程师"},
  "员工2": {"姓名": "李四", "职位": "产品经理"}
}
```

### 优化特点

- **自动结构检测**: 系统会自动检测并适配不同表格结构
- **键名保留**: 翻译对象时，键名保持不变，只翻译值
- **结构一致性**: 确保翻译前后的数据结构完全一致
- **错误修复**: 对于JSON解析错误会自动尝试修复

## ❗ 错误处理

API会返回适当的HTTP状态码和错误信息，便于调试和错误处理：

| HTTP状态码 | 错误类型 | 说明 |
|-----------|---------|------|
| 400 | 请求错误 | 请求参数不正确或缺失必需参数 |
| 401 | 认证错误 | API密钥缺失、无效或已过期 |
| 413 | 内容过大 | 上传的文件超过大小限制 |
| 415 | 不支持的媒体类型 | 上传的文件类型不受支持 |
| 429 | 请求过多 | 超出API调用频率限制 |
| 500 | 服务器错误 | 服务器内部错误或OpenAI API调用失败 |

**错误响应示例**:

```json
{
  "success": false,
  "message": "API密钥无效或已过期",
  "error": "InvalidApiKey"
}
```

## 🔒 安全建议

1. **更改默认凭据**: 首次登录后立即更改默认管理员密码

2. **API密钥管理**:
   - 为不同用途创建不同的API密钥
   - 设置合理的密钥过期时间
   - 定期轮换密钥
   - 监控异常使用情况

3. **生产环境部署**:
   - 使用HTTPS加密连接
   - 配置适当的网络访问控制
   - 使用环境变量存储敏感信息
   - 定期更新依赖包

## ❓ 常见问题

### 1. API密钥验证失败

**问题**: 请求返回401错误，提示"API密钥无效"

**解决方案**:
- 确认API密钥格式正确且未过期
- 在请求头中使用`X-API-Key`字段
- 通过管理控制台检查密钥状态

### 2. OpenAI API连接问题

**问题**: 服务返回"连接OpenAI API失败"

**解决方案**:
- 检查OpenAI API密钥是否有效
- 如果在中国大陆使用，配置可用的API中转地址
- 确认网络连接稳定

### 3. 表格翻译结构错误

**问题**: 翻译后的表格结构与原始表格不一致

**解决方案**:
- 确保原表格是有效的JSON格式
- 尝试使用`gpt-4`模型获得更准确的结构保留
- 对于复杂表格，将大表格拆分为小块处理

## 📄 许可证

本项目采用MIT许可证 - 详见 [LICENSE](LICENSE) 文件
