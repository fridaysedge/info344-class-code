'use strict';
/**
 * passport.js establishes user authorization strategies for the web service
 * application.
 */
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var account = require('./account.js');

module.exports = function(passport, pool) {
    
    // Configure session user instances
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    
    passport.deserializeUser(function(id, done) {
        pool.getConnection(function(err, connection){
            connection.query("SELECT * FROM users WHERE id = ? ",[id], 
                function(err, rows){
                    connection.release();
                    done(err, rows[0]);
                }
            );
        });
    });
    
    // Configure the strategies.
    passport.use(
        'local-signup',
        new LocalStrategy({
            passReqToCallback : true
        },
        function(req, username, password, done) {
            // Create a new user, hash their password.
            var newUserMysql = {
                username: username,
                password: bcrypt.hashSync(password, null, null)
            };
            
            // Add the user.
            var insertQuery = `
                INSERT INTO users (username, password) 
                VALUES (?,?)
            `;
            pool.getConnection(function(err, connection){
                 connection.query(insertQuery,
                    [newUserMysql.username, newUserMysql.password],
                    function(err, rows) {
                        newUserMysql.id = rows.insertId;
                        // Add the default account for the new user.
                        account.createMainAccount(pool, newUserMysql.id);
                        connection.release();
                        return done(null, newUserMysql);
                });               
            });
        })
    );

    passport.use(
        'local-login',
        new LocalStrategy({
            passReqToCallback : true
        },
        function(req, username, password, done) {
            // Look for the user.
            pool.getConnection(function(err, connection){
                connection.query("SELECT * FROM users WHERE username = ?",
                    [username], function(err, rows){
                    // Was there an error with the query?
                    if (err){
                        connection.release();
                        return done(err);
                    }
                    // Was the username found?
                    if (!rows.length) {
                        connection.release();
                        return done(null, false, 
                            req.flash('loginMessage', 'User Not Found!'));
                    }
                    // Does the password match?
                    if (!bcrypt.compareSync(password, rows[0].password)){
                        connection.release();
                        return done(null, false,
                            req.flash('loginMessage', 'Incorrect Password!'));
                    }
                    connection.release();
                    return done(null, rows[0]);
                });              
            });
        })
    );
};