module.exports = {
  server: {
    port: process.env.PORT || 3000
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com',
    model: 'gpt-3.5-turbo',
    maxTokens: 2000,
    temperature: 0.3
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  admin: {
    username: process.env.ADMIN_USERNAME || 'root',
    password: process.env.ADMIN_PASSWORD || '123456'
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: [
      'text/plain',
      'text/csv',
      'application/json',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'audio/mpeg',
      'audio/wav',
      'audio/mp4'
    ]
  }
};