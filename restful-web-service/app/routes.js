'use strict';
/**
 * routes.js establishes all available endpoints for the web service
 * application.
 */
var account = require('../model/account.js');

/**
 * Verifies that the provided request is authenticated so the route chain may
 * continue. If the request is not authenticated a 401 redirect to the
 * login endpoint occurs.
 */
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated())
    return next();
  else
    res.redirect(401, '/login');
}

module.exports = function(app, passport, pool) {
    
    // Entry endpoint for the web service.
	app.get('/', 
        function(req, res) {
		    res.render('index.ejs');
	    }
    );
    
    // Allows a non authenticated user to view the login page.
	app.get('/login', 
        function(req, res) {
		    res.render('login.ejs', { message: req.flash('loginMessage') });
	    }
    );
    
    // Allows a non authenticated user to make a login request.
	app.post('/login',
        passport.authenticate('local-login', {
            successRedirect : '/account',
            failureRedirect : '/login',
            failureFlash : true
		})
    );
    
    // Allows a non authenticated user to view the signup page.
	app.get('/signup', 
        function(req, res) {
		    res.render('signup.ejs');
	    }
    );

    // Allows a non authenticated user to make a signup request.
	app.post('/signup', 
        passport.authenticate('local-signup', {
            successRedirect : '/account',
            failureRedirect : '/signup',
            failureFlash : true
        })
    );
    
    // Allows a authenticated user to view their account page.
	app.get('/account', ensureAuthenticated,
        // Retrieve the users account information. 
        function(req, res, next) {       
            account.readAccounts(pool, req.user.id, 
                function(err, accountInfo){
                    req.account = accountInfo;
                    next();
                });
	    },
        // Displays the users account information.
        function (req, res) {
            res.render('account.ejs', {
                user : req.user,
                accounts : req.account
            });
        }
    );
    
    // Allows a authenticated user to view their "update user" page.
    app.get('/update-user', ensureAuthenticated, 
        function(req, res) {
            res.render('update-user.ejs', {
                user : req.user
            });
	    }
    );
    
    // Allows a authenticated user to update their user information.
    app.post('/update-user', ensureAuthenticated, 
        // Updates the provided user information.
        function(req, res) {
            account.updateUser(
                pool, 
                req.user.id, 
                req.body.username, 
                req.body.password,
                // After the user has been updated, redirect to accounts.
                function(){
                    res.redirect('/account');                                
                }
            );
	    }
    );
    
    // Allows a authenticated user to view the "add account" page.
    app.get('/add-account', ensureAuthenticated, 
        function(req, res) {
            res.render('add-account.ejs', {
                user : req.user
            });
	    }
    );
    
    // Allows a authenticated user to add a new account.
    app.post('/add-account', ensureAuthenticated, 
        // Retrieves the number of accounts for the user
        function(req, res) {
            account.getAccountQty(pool, req.user.id, 
                // Adds the account
                function(err, accountInfo){
                    // Is the user elligible to add an account?
                    if(accountInfo[0].qty < 5){
                        // If true, add account, then redirect
                        account.addNewAccount(
                            pool, 
                            req.body.account_name, 
                            req.user.id,
                            function(){
                                res.redirect('/account');                                
                            }
                        );
                    }else{
                        // If false, redirect with error
                        res.redirect(400, '/account');
                    }
            });
	    }
    );

    // Allows a authenticated user to view the "transfer (My Accounts)" page.
	app.get('/transfer-my-accounts', ensureAuthenticated, 
        // Retrieve the users account information.
        function(req, res) {
            account.readAccounts(pool, req.user.id, 
                // Display the page.
                function(err, accountInfo){
                    res.render('transfer-my-accounts.ejs', {
                        user : req.user,
                        accounts : accountInfo
                    });
                }
            );
        }
    );
    
    // Allows a authenticated user to transfer funds (between "My" accounts).
    app.post('/transfer-my-accounts', ensureAuthenticated,
        // Transfer the funds
        function(req, res, next) {
            account.transferMyAccounts(
                pool,
                req.body.from,
                req.body.to,
                req.body.amount,
                req.body.reason,
                req.user.id,
                function(){
                    next();
                }
            );
	    },
        // Redirect the user to the account page.
        function(req, res){
            res.redirect('/account');
        }
    );
    
    // Allows authenticated user to view the "transfer (Other Accounts)" page.
    app.get('/transfer-other-accounts', ensureAuthenticated, 
        // Retrieve the users account information.
        function(req, res) {
            account.readAccounts(pool, req.user.id,
                // Display the page.
                function(err, accountInfo){
                    res.render('transfer-other-accounts.ejs', {
                        user : req.user,
                        accounts : accountInfo
                    });
                }
            );
        }
    );
    
    // Allows authenticated user to transfer funds (between "Other" accounts).
    app.post('/transfer-other-accounts', ensureAuthenticated, 
        // Transfer the funds
        function(req, res, next) {
            account.transferOtherAccounts(
                pool,
                req.body.from,
                req.body.email,
                req.body.amount,
                req.body.reason,
                req.user.id,
                function(){
                    next();
                }
            );
	    },
        // Redirect the user to the account page.
        function(req, res){
            res.redirect('/account');
        }
    );
    
    // Allows authenticated user to view transactions from a specific account.
    app.post('/transactions', ensureAuthenticated, 
        // Retrieve transaction information.
        function(req, res) {
            account.readTransactions(
                pool, 
                req.user.id,
                req.body.account,
                // Dispaly page.
                function(err, accountInfo){
                    res.render('transactions.ejs', {
                        user : req.user,
                        account: req.body.account,
                        transactions : accountInfo
                    });
                }
            );
        }
    );
    
    // Allows authenticated user to close a specific account.
    app.post('/close-account', ensureAuthenticated, 
        function(req, res) {
            // Retrieve required information about the account.
            account.getAccountClosureInfo(pool, req.body.account, 
                // Attempts to close the account.
                function(err, accountInfo){
                    // Is the account elligible for closure?
                    if(accountInfo[0].balance == 0 && 
                        accountInfo[0].default_account != 1 ){
                        // If true close it.
                        account.closeAccount(
                            pool, 
                            req.user.id,
                            req.body.account,
                            function(){
                                res.redirect('/account');
                            }
                        );
                    }else{
                        // If false redirect with error.
                        res.redirect(400, '/account');
                    }
                }
            );
	    }
    );
    
    // Logs out an authenticated user.
	app.get('/logout', function(req, res) {
        req.session.destroy(function(err){
            if(err){
                console.log(err);
            } else {
                res.redirect('/');
            }
        });
	});

};