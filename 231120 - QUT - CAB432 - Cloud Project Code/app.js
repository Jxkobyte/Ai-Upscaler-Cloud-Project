var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const S3HandlerClass = require("./utility/S3Handler");
const S3Handler = new S3HandlerClass();
// const DataHandlerClass = require("./utility/DataHandler");
// const DataHandler = new DataHandlerClass(S3Handler);
const RedisHandlerClass = require("./utility/RedisHandler");
const RedisHandler = new RedisHandlerClass();

//AWS-SDK Setup
const AWS = require("aws-sdk");
if (!process.env.aws_ec2) {
    console.log("Not running on AWS EC2. Checking for environment variables...");
    if (!process.env.aws_access_key_id || !process.env.aws_secret_access_key || !process.env.aws_session_token || !process.env.aws_region) {
        console.log("Attempting to load environment variables from .env file as API keys are missing...");
        require('dotenv').config();
        //Check if API keys are still missing
        if (!process.env.aws_access_key_id || !process.env.aws_secret_access_key || !process.env.aws_session_token || !process.env.aws_region) {
            console.log("Environment variables not found. Exiting...");
            process.exit(1);
        }
        console.log("Environment variables found. Continuing...");
    } else {
        console.log("Environment variables found. Continuing...");
    }
    // AWS.config.update({
    //     accessKeyId: process.env.aws_access_key_id,
    //     secretAccessKey: process.env.aws_secret_access_key,
    //     sessionToken: process.env.aws_session_token,
    //     region: process.env.aws_region
    // });
} else {
    console.log("Running on AWS EC2. Continuing...");
    // AWS.config.getCredentials(function(err) {
    //     if (err) console.log(err.stack);
    //     // credentials not loaded
    //     else {
    //         console.log("Access key:", AWS.config.credentials.accessKeyId);
    //     }
    // });
    // //TODO: Hardcoding the region is not ideal. Find a better way to do this.
    // AWS.config.update({
    //     region: process.env.aws_region
    // });
}

(async () => {
    console.log("Checking if bucket exists...");
    await S3Handler.createBucket(process.env.aws_bucket_name);
})();

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Attach utility classes to request object
app.use(function (req, res, next) {
    req.AWS = AWS;
    req.S3Handler = S3Handler;
    //req.DataHandler = DataHandler;
    req.RedisHandler = RedisHandler;
    next();
});

app.use('/', indexRouter);
// app.use('/users', usersRouter);
app.use('/image', require('./routes/image'));
app.use('/upload', require('./routes/upload'));
app.use('/api/result', require('./routes/api/result'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
