'use strict';

var express  = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var session  = require('express-session');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
var bluebird = require('bluebird');
var mysql = require('mysql');
var dbConfig = require('./secret/db-config.json');
var connection = bluebird.promisifyAll(mysql.createConnection(dbConfig));

connection.query('USE ' + dbConfig.database);

require('./model/passport')(passport, connection);

var app = express();
app.use(morgan('dev')); 
app.use(cookieParser());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(bodyParser.json());

app.set('view engine', 'ejs');

app.use(session({
	secret: 'vidyapathaisalwaysrunning',
	resave: true,
	saveUninitialized: true
 } ));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); // for messages

require('./app/routes.js')(app, passport, connection);

app.listen(80, function() {
    console.log('server is listening...');
});
