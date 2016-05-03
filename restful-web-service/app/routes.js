
var account = require('../model/account.js');
var bluebird = require('bluebird');
var mysql = require('mysql');
var dbConfig = require('../secret/db-config.json');
var connection = bluebird.promisifyAll(mysql.createConnection(dbConfig));

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated())
    return next();
  else
    res.redirect(401, '/login');
}

module.exports = function(app, passport, connection) {
    
	app.get('/', function(req, res) {
		res.render('index.ejs');
	});

	app.get('/login', function(req, res) {
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/account',
            failureRedirect : '/login',
            failureFlash : true
		}),
        function(req, res) {
            res.redirect('/');
        }
    );

	app.get('/signup', function(req, res) {
		res.render('signup.ejs');
	});

	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/account',
		failureRedirect : '/signup',
        failureFlash : true
	}));

	app.get('/account', ensureAuthenticated, function(req, res) {        
        account.readAccounts(connection, req.user.id, 
        function(err, accountInfo){
            res.render('account.ejs', {
                user : req.user,
                accounts : accountInfo
            });
        });
	});
    
    app.get('/update-user', ensureAuthenticated, function(req, res) {
        res.render('update-user.ejs', {
            user : req.user
        });
	});
    
    app.post('/update-user', ensureAuthenticated, function(req, res) {
        account.updateUser(
            connection, 
            req.user.id, 
            req.body.username, 
            req.body.password);
        res.redirect('/account');
	});
    
    app.get('/add-account', ensureAuthenticated, function(req, res) {
        res.render('add-account.ejs', {
            user : req.user
        });
	});
    
    app.post('/add-account', ensureAuthenticated, function(req, res) {
        account.getAccountQty(connection, req.user.id, 
            function(err, accountInfo){
                if(accountInfo[0].qty < 5){
                    account.addNewAccount(connection, req.body.account_name, req.user.id);
                    res.redirect('/account');
                }else{
                    res.redirect(400, '/account');
                }
        });
	});

	app.get('/transfer-my-accounts', ensureAuthenticated, function(req, res) {
        account.readAccounts(connection, req.user.id, function(err, accountInfo){
            res.render('transfer-my-accounts.ejs', {
                user : req.user,
                accounts : accountInfo
            });
        });
	});
    
    app.post('/transfer-my-accounts', ensureAuthenticated, function(req, res) {
        
        account.transferMyAccounts(
            connection,
            req.body.from,
            req.body.to,
            req.body.amount,
            req.body.reason,
            req.user.id
        );
        res.redirect('/account');
	});
    
    app.get('/transfer-other-accounts', ensureAuthenticated, function(req, res) {
        account.readAccounts(connection, req.user.id, function(err, accountInfo){
            res.render('transfer-other-accounts.ejs', {
                user : req.user,
                accounts : accountInfo
            });
        });
	});
    
    app.post('/transfer-other-accounts', ensureAuthenticated, function(req, res) {
        
        account.transferOtherAccounts(
            connection,
            req.body.from,
            req.body.email,
            req.body.amount,
            req.body.reason,
            req.user.id
        );
        res.redirect('/account');
	});
    
    app.post('/transactions', ensureAuthenticated, function(req, res) {
        account.readTransactions(
            connection, 
            req.user.id,
            req.body.account,
            function(err, accountInfo){
                res.render('transactions.ejs', {
                    user : req.user,
                    account: req.body.account,
                    transactions : accountInfo
                });
        });
	});
    
    app.post('/close-account', ensureAuthenticated, function(req, res) {
        account.getAccountClosureInfo(connection, req.body.account, 
            function(err, accountInfo){
                if(accountInfo[0].balance == 0 && accountInfo[0].default_account != 1 ){
                    account.closeAccount(
                        connection, 
                        req.user.id,
                        req.body.account
                    );
                    res.redirect('/account');
                }else{
                    res.redirect(400, '/account');
                }
            }
        );
	});
    
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

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
