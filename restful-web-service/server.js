'use strict';

var express  = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var session  = require('express-session');
var passport = require('passport');
//var cookieParser = require('cookie-parser');
var RedisStore = require('connect-redis')(session);
var flash = require('connect-flash');
var bluebird = require('bluebird');
var mysql = require('mysql');
var dbConfig = require('./secret/db-config.json');
var connection = bluebird.promisifyAll(mysql.createConnection(dbConfig));

connection.query('USE ' + dbConfig.database);

require('./model/passport')(passport, connection);

//read this from an environment variable
//set the environment variable using the command
//  $ export COOKIE_SIG_SECRET="41edbf0184d95053721192d641af27500a480162"
//and then start the server
var cookieSigSecret = process.env.COOKIE_SIG_SECRET;
if (!cookieSigSecret) {
    console.error('Please set COOKIE_SIG_SECRET');
    process.exit(1);
}

var app = express();
app.use(morgan('dev')); 
//app.use(cookieParser());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(bodyParser.json());

app.set('view engine', 'ejs');

//add session support to the application
//and tell it to store session data in our
//local Redis database (you can also pass)
//a {host: host-name} object to the RedisStore()
//constructor to use a different host 
app.use(session({
    secret: cookieSigSecret,
    resave: false,
    saveUninitialized: false,
    store: new RedisStore()
}));

/*
app.use(session({
	secret: 'vidyapathaisalwaysrunning',
	resave: true,
	saveUninitialized: true
 } ));
 */

app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // for messages

require('./app/routes.js')(app, passport, connection);

app.listen(80, function() {
    console.log('server is listening...');
});
