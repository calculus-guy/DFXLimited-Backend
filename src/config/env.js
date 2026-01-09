const Joi = require('joi');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(5000),
  MONGODB_URI: Joi.string().required().description('MongoDB connection URI'),
  JWT_ACCESS_SECRET: Joi.string().required().description('JWT access token secret'),
  JWT_REFRESH_SECRET: Joi.string().required().description('JWT refresh token secret'),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  ADMIN_EMAIL: Joi.string().email().required().description('Admin email for seeding'),
  ADMIN_PASSWORD: Joi.string().min(8).required().description('Admin password for seeding'),
  PAYSTACK_SECRET_KEY: Joi.string().required().description('Paystack secret key'),
  PAYSTACK_PUBLIC_KEY: Joi.string().required().description('Paystack public key'),
  CLOUDINARY_CLOUD_NAME: Joi.string().required().description('Cloudinary cloud name'),
  CLOUDINARY_API_KEY: Joi.string().required().description('Cloudinary API key'),
  CLOUDINARY_API_SECRET: Joi.string().required().description('Cloudinary API secret'),
  SMTP_HOST: Joi.string().default('smtp.gmail.com'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().required().description('SMTP email address'),
  SMTP_PASS: Joi.string().required().description('SMTP password or app password'),
  EMAIL_FROM_NAME: Joi.string().default('DFX Limited'),
  EMAIL_FROM_ADDRESS: Joi.string().email().required().description('From email address'),
}).unknown();

const { value: envVars, error } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongodb: {
    uri: envVars.MONGODB_URI,
  },
  jwt: {
    accessSecret: envVars.JWT_ACCESS_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  cors: {
    origin: envVars.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  },
  admin: {
    email: envVars.ADMIN_EMAIL,
    password: envVars.ADMIN_PASSWORD,
  },
  paystack: {
    secretKey: envVars.PAYSTACK_SECRET_KEY,
    publicKey: envVars.PAYSTACK_PUBLIC_KEY,
  },
  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      user: envVars.SMTP_USER,
      pass: envVars.SMTP_PASS,
    },
    from: {
      name: envVars.EMAIL_FROM_NAME,
      address: envVars.EMAIL_FROM_ADDRESS,
    },
  },
};
