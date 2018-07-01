var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var testRouter = require('./routes/test');
var assignmentsRouter = require('./routes/assignments');
var companiesRouter = require('./routes/companies');
var studentsRouter = require('./routes/students');
var subscriptionsRouter = require('./routes/subscriptions');
var authenicationRouter = require('./routes/authentication');
const jwt = require('jsonwebtoken');
var helmet = require('helmet');
var fs = require('fs');


var cors = require('cors');

var app = express();

var mysql = require('mysql');

app.use(helmet());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/uploads', express.static('uploads'));

app.all('/uploads/*', function(req, res, next) {
  if(!req.headers.authorization){

    res.send({succes: false, result: "No token"})
  }
  else{
    fs.readFile(path.resolve("bin/secret.txt") ,'utf8', function(err, data) {

      if (err){
        res.send({succes: false, result: "Somethings wrong with secret"})
      }
      jwt.verify(token, supersecretcode, function(err, decoded){
        if(!err){
            res.send(JSON.stringify({success: true, msg: "Access granted"}));
        } else {
          res.send(err);
        }
    });
    });
  }
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/tests', testRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/authentication', authenicationRouter);

app.use(cors());


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
