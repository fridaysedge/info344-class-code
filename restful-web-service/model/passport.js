'use strict';

var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var account = require('./account.js');

module.exports = function(passport, connection) {

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        connection.query("SELECT * FROM users WHERE id = ? ",[id], function(err, rows){
            done(err, rows[0]);
        });
    });
    
    passport.use(
        'local-signup',
        new LocalStrategy({
            passReqToCallback : true
        },
        function(req, username, password, done) {
            // create the new user
            var newUserMysql = {
                username: username,
                password: bcrypt.hashSync(password, null, null)  // hash the password
            };

            var insertQuery = "INSERT INTO users (username, password) values (?,?)";
            
            connection.query(insertQuery,[newUserMysql.username, newUserMysql.password],
                function(err, rows) {
                    newUserMysql.id = rows.insertId;
                    // add a new account
                    account.createMainAccount(connection, newUserMysql.id);
                    return done(null, newUserMysql);
            });

        })
    );

    passport.use(
        'local-login',
        new LocalStrategy({
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {
            connection.query("SELECT * FROM users WHERE username = ?",[username], function(err, rows){
                // Did the query work?
                if (err)
                    return done(err);
                // Does that username exist?
                if (!rows.length) {
                    return done(null, false, req.flash('loginMessage', 'No user found.'));
                }
                // Does the password match the user name?
                if (!bcrypt.compareSync(password, rows[0].password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
                return done(null, rows[0]);
            });
        })
    );
};
