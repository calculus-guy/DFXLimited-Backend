const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const { config } = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { xssSanitize } = require('./middleware/sanitize');
const ApiError = require('./utils/ApiError');

const app = express();

// Trust proxy for Render/Heroku/etc (needed for rate limiter and secure cookies)
app.set('trust proxy', 1);

app.use(helmet());

app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(cookieParser());

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xssSanitize);

app.use('/api', routes);

app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

app.use(errorHandler);

module.exports = app;