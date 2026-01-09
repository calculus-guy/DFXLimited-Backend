const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { config } = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

app.use(helmet());

app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use('/api', routes);

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

app.use(errorHandler);

module.exports = app;