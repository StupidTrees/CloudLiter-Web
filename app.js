const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const usersRouter = require('./routes/user');
const relationRouter = require('./routes/relation');
const relationEventRouter = require('./routes/relationEvent')
const conversationRouter = require('./routes/conversation');
const messageRouter = require('./routes/message');
const groupRouter = require('./routes/group');
const tokenVerifier = require('./middleware/tokenVerify')


/**
 * express app的启动流程
 **/

const app = express();

//设置一些基本的中间件
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//加入用于验证token的中间件
app.use(tokenVerifier)//.use(tokenUtils.tokenVerifierMiddleware)


//绑定路由
app.use('/user', usersRouter);
app.use('/relation', relationRouter);
app.use('/relation', relationEventRouter)
app.use('/conversation', conversationRouter);
app.use('/message', messageRouter);
app.use('/group', groupRouter)


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
