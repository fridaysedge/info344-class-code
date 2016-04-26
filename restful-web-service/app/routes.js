
var account = require('../model/account.js');

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
            console.log("hello");

            if (req.body.remember) {
              req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
              req.session.cookie.expires = false;
            }
        res.redirect('/');
    });

	app.get('/signup', function(req, res) {
		res.render('signup.ejs');
	});

	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/account',
		failureRedirect : '/signup',
        failureFlash : true
	}));

    app.get('/github', passport.authenticate('github'));
    
    app.get('/signin/github/callback', passport.authenticate('github'), 
        function(req, res) {
            res.render('account.ejs');
    }); 

	app.get('/account', isLoggedIn, function(req, res) {
        account.readAccounts(connection, req.user.id, function(err, accountInfo){
            res.render('account.ejs', {
                user : req.user,
                accounts : accountInfo
            });
        });
	});
    
    app.get('/add-account', isLoggedIn, function(req, res) {
        res.render('add-account.ejs', {
            user : req.user
        });
	});
    
    app.post('/add-account', isLoggedIn, function(req, res) {
        account.addNewAccount(connection, req.body.account_name, req.user.id);
        res.redirect('/account');
	});

	app.get('/transfer-my-accounts', isLoggedIn, function(req, res) {
        account.readAccounts(connection, req.user.id, function(err, accountInfo){
            res.render('transfer-my-accounts.ejs', {
                user : req.user,
                accounts : accountInfo
            });
        });
	});
    
    app.post('/transfer-my-accounts', isLoggedIn, function(req, res) {
        
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
    
    app.get('/transfer-other-accounts', isLoggedIn, function(req, res) {
        account.readAccounts(connection, req.user.id, function(err, accountInfo){
            res.render('transfer-other-accounts.ejs', {
                user : req.user,
                accounts : accountInfo
            });
        });
	});
    
    app.post('/transfer-other-accounts', isLoggedIn, function(req, res) {
        
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
    
    app.post('/transactions', isLoggedIn, function(req, res) {
        account.readTransactions(
            connection, 
            req.user.id,
            req.body.account,
            function(err, accountInfo){
                console.log(accountInfo)
                res.render('transactions.ejs', {
                    user : req.user,
                    transactions : accountInfo
                });
        });
	});
    
	app.get('/logout', function(req, res) {
        connection.end();
		req.logout();
		res.redirect('/');
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
