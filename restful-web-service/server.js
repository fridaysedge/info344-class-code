'use strict';
/**
 * server.js creates a server capable of performing MariaDB database
 * interactions with user authentication support. 
 */
var express  = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var session  = require('express-session');
var passport = require('passport');
var RedisStore = require('connect-redis')(session);
var flash = require('connect-flash');
var bluebird = require('bluebird');
var mysql = require('mysql');
var dbConfig = require('./secret/db-config.json');
bluebird.promisifyAll(mysql);
bluebird.promisifyAll(require("mysql/lib/Connection").prototype);
bluebird.promisifyAll(require("mysql/lib/Pool").prototype);
var pool = mysql.createPool(dbConfig);
require('./model/passport')(passport, pool);

// Read environment variable
var cookieSigSecret = process.env.COOKIE_SIG_SECRET;
if (!cookieSigSecret) {
    console.error('Please set COOKIE_SIG_SECRET');
    process.exit(1);
}
//Setup the application
var app = express();
app.disable('view cache');
app.use(morgan('dev')); 
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(flash());

// Add the session support.
app.use(session({
    secret: cookieSigSecret,
    resave: false,
    saveUninitialized: false,
    store: new RedisStore()
}));

// Add authentication support.
app.use(passport.initialize());
app.use(passport.session());

require('./app/routes.js')(app, passport, pool);

// Start the server.
app.listen(80, function() {
    console.log('server is listening...');
});