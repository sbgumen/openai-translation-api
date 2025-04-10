/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  // 记录错误
  console.error('Error:', err);
  
  // 处理Multer错误
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `文件大小超过限制 (${err.message})`
      });
    }
    return res.status(400).json({
      success: false,
      message: `文件上传错误: ${err.message}`
    });
  }
  
  // 处理JWT错误
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '身份验证失败，请重新登录'
    });
  }
  
  // 处理OpenAI API错误
  if (err.message && err.message.includes('OpenAI')) {
    return res.status(500).json({
      success: false,
      message: '调用AI服务失败',
      error: err.message
    });
  }
  
  // 默认错误响应
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  // 根据请求类型返回错误响应
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } else {
    // 网页请求返回错误页面
    res.status(statusCode).send(`
      <html>
        <head><title>错误</title></head>
        <body>
          <h1>错误</h1>
          <p>${message}</p>
          ${process.env.NODE_ENV === 'development' ? `<pre>${err.stack}</pre>` : ''}
        </body>
      </html>
    `);
  }
}

module.exports = errorHandler;