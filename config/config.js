const config = {
  production: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    CORS_ORIGIN: [
      'https://console.swaroop.ai',
      'https://main.d3c6urjiujlay0.amplifyapp.com',
      'https://er4c5dmwnt.ap-northeast-1.awsapprunner.com'
    ]
  },
  development: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    CORS_ORIGIN: ['http://localhost:3000']
  }
};

module.exports = config[process.env.NODE_ENV || 'development']; 