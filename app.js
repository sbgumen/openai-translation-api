require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const fs = require('fs');
const { requestLogger } = require('./utils/logger');

// 创建上传目录
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

// 创建数据目录
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// 导入中间件
const errorHandler = require('./middlewares/errorHandler');

// 导入路由
const translationRoutes = require('./routes/translation');
const adminRoutes = require('./routes/admin');
const docsRoutes = require('./routes/docs'); // 添加文档路由

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 使用更稳定的会话配置
app.use(session({
  secret: process.env.JWT_SECRET || 'default_session_secret',
  resave: true, // 改为true确保会话始终保存
  saveUninitialized: true, // 改为true以便于保存新会话
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 设置会话有效期为1天
  }
}));

// 添加请求日志
app.use(requestLogger);

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 路由
app.use('/api/translate', translationRoutes);
app.use('/admin', adminRoutes);
app.use('/docs', docsRoutes);

// 首页路由
app.get('/', (req, res) => {
  //res.send('OpenAI Translation API 服务已启动');
   res.redirect('/docs');
});

// 错误处理
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器已启动，运行在端口 ${PORT}`);
});

// 优雅地处理进程退出
process.on('SIGINT', () => {
  console.log('接收到SIGINT信号，服务器正在关闭...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('接收到SIGTERM信号，服务器正在关闭...');
  process.exit(0);
});

module.exports = app;