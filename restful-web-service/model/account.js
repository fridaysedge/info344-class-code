'use strict';
/**
 * account.js 
 */
var uid = require('uid-safe');
var bcrypt = require('bcrypt-nodejs');

module.exports = {
    // Creates a funded, default account for the provided user.
    createMainAccount: function(pool, user_id){
        var query = `
            INSERT INTO accounts ( 
                account_id, accountname, balance, default_account, user_id)
            VALUES (FLOOR (rand() * 5000 * 5000), 'Main', 100, 1, ?)
        `;
        pool.getConnection(function(err, connection){
            connection.queryAsync('SET autocommit = 0')
                .then(function() {
                    return connection.queryAsync('START TRANSACTION');
                })
                .then(function(results) {
                    return connection.queryAsync(query, [user_id]);
                })
                .then(function() {
                    return connection.queryAsync('COMMIT');
                })
                .catch(function(err) {
                    return connection.queryAsync('ROLLBACK');
                })
                .then(function() {
                    connection.release();
                });
        });
    },
    
    // Returns the number of accounts for the provided user.
    getAccountQty: function(pool, user_id, callback){
        var query = `
            SELECT COUNT(user_id) AS qty
            FROM accounts
            WHERE user_id = ?
        `;
        pool.getConnection(function(err, connection){
            connection.queryAsync(query, [user_id])
                .catch(function(err) {
                    console.error(err);
                })
                .then(function(results) {
                    callback(null, results);
                })
                .then(function() {
                    connection.release();
                });          
        });

    },
    
    // Creates a empty account for the provided user.
    addNewAccount: function(pool, account_name, user_id, callback){
        var query = `
            INSERT INTO accounts ( 
                account_id, accountname, balance, default_account, user_id)
            VALUES (FLOOR (rand() * 5000 * 5000), ?, 0, 0, ?)
        `;
        pool.getConnection(function(err, connection){
            connection.queryAsync('SET autocommit = 0')
                .then(function() {
                    return connection.queryAsync('START TRANSACTION');
                })
                .then(function(results) {
                    return connection.queryAsync(query,
                        [account_name, user_id]);
                })
                .then(function() {
                    return connection.queryAsync('COMMIT');
                })
                .catch(function(err) {
                    return connection.queryAsync('ROLLBACK');
                })
                .then(function() {
                    callback();
                })
                .then(function() {
                    connection.release();
                });          
        });
    },
    
    // Returns the balance and default information for the provided account.
    getAccountClosureInfo: function(pool, account, callback){
        var query = `
            SELECT balance, default_account
            FROM accounts
            WHERE account_id = ?
        `;
        pool.getConnection(function(err, connection){
            connection.queryAsync(query, [account])
                .catch(function(err) {
                    console.error(err);
                })
                .then(function(results) {
                    callback(null, results);
                })
                .then(function() {
                    connection.release();
                });           
        });
    },
    
    // Deletes the provided account.
    closeAccount: function(pool, user_id, account, callback){
        var query = `
            DELETE FROM accounts
            WHERE account_id = ?
        `;
        pool.getConnection(function(err, connection){
            connection.queryAsync('SET autocommit = 0')
                .then(function() {
                    return connection.queryAsync('START TRANSACTION');
                })
                .then(function(results) {
                    return connection.queryAsync(query, [account]);
                })
                .then(function() {
                    return connection.queryAsync('COMMIT');
                })
                .catch(function(err) {
                    return connection.queryAsync('ROLLBACK');
                })
                .then(function() {
                    callback();
                })
                .then(function() {
                    connection.release();
                });            
        });
    },
    
    // Transfers funds between accounts owned by the same user.
    transferMyAccounts: function(pool, from, to, amount, reason,
        user_id, callback){
        pool.getConnection(function(err, connection){
            connection.queryAsync('SET autocommit = 0')
                .then(function() {
                    return connection.queryAsync('START TRANSACTION');
                })
                // Subtract the provided amount from the "from" account.
                .then(function() {
                    var debitQuery = `
                        UPDATE accounts 
                        SET balance = (
                            SELECT balance
                            WHERE account_id = ?
                        ) - ?
                        WHERE account_id = ?
                    `;
                    return connection.queryAsync(debitQuery, [
                        from, amount, from
                    ]);
                })
                // Add the provided amount to the "to" account.
                .then(function() {
                    var creditQuery = `
                        UPDATE accounts 
                        SET balance = (
                            SELECT balance
                            WHERE account_id = ?
                        ) + ?
                        WHERE account_id = ?
                    `;
                    return connection.queryAsync(creditQuery, [
                        to, amount, to
                    ]);
                })
                // Record the transaction.
                .then(function() {
                    var transactionQuery = `
                        INSERT INTO transactions (amount, reason, source_id, 
                            source_user_id, destination_id, destination_user_id)
                        VALUES (?, ?, ?, ?, ?, ?);
                    `;
                    return connection.queryAsync(transactionQuery, [
                        amount, reason, from, user_id, to, user_id
                    ]);
                })
                .then(function() {
                    return connection.queryAsync('COMMIT');
                })
                .catch(function(e) {
                    err = e;
                    return connection.queryAsync('ROLLBACK');
                })
                .then(function() {
                    callback(err);
                })
                .then(function() {
                    connection.release();
                });         
        });
    },
    
    // Transfers funds between accounts owned by different users.
    transferOtherAccounts: function(pool, from, email, amount, reason, 
        user_id, callback){
        pool.getConnection(function(err, connection){
            connection.queryAsync('SET autocommit = 0')
                .then(function() {
                    return connection.queryAsync('START TRANSACTION');
                })
                // Subtract the provided amount from the "from" account.
                .then(function() {
                    var debitQuery = `
                        UPDATE accounts 
                        SET balance = (
                            SELECT balance
                            WHERE account_id = ?
                        ) - ?
                        WHERE account_id = ?
                    `;
                    return connection.queryAsync(debitQuery, [
                        from, amount, from
                    ]);
                })
                // Find the "default" account number of the provided user name.
                .then(function() {
                    var findAccountQuery = `
                        SELECT account_id INTO @target_account FROM accounts 
                        INNER JOIN users
                        ON accounts.user_id = users.id
                        WHERE username = ? AND default_account = 1
                    `;
                    return connection.queryAsync(findAccountQuery, [email]);
                })
                // Find the user id associated with that account number.
                .then(function() {
                    var findTargetUserQuery = `
                        SELECT user_id INTO @target_user_id FROM accounts 
                        WHERE account_id = @target_account
                    `;
                    return connection.queryAsync(findTargetUserQuery, [email]);
                })
                // Add the provided amount to the "to" account.
                .then(function() {
                    var creditQuery = `
                        UPDATE accounts 
                        SET balance = (
                            SELECT balance
                            WHERE account_id = @target_account
                        ) + ?
                        WHERE account_id = @target_account
                    `;
                    return connection.queryAsync(creditQuery, [amount]);
                })
                // Record the transaction.
                .then(function() {
                    var transactionQuery = `
                        INSERT INTO transactions (amount, reason, source_id, 
                            source_user_id, destination_id, destination_user_id)
                        VALUES (?, ?, ?, ?, @target_account, @target_user_id);
                    `;
                    return connection.queryAsync(transactionQuery, [
                        amount, reason, from, user_id
                    ]);
                })
                .then(function() {
                    return connection.queryAsync('COMMIT');
                })
                .catch(function(e) {
                    err = e;
                    return connection.queryAsync('ROLLBACK');
                })
                .then(function() {
                    callback(err);
                })
                .then(function() {
                    connection.release();
                });          
        });
    },
    
    // Updates the user name and / or password.
    updateUser: function(pool, user_id, username, password, callback){
        pool.getConnection(function(err, connection){
            connection.queryAsync('SET autocommit = 0')
                .then(function() {
                    return connection.queryAsync('START TRANSACTION');
                })
                // If applicable, update the usename.
                .then(function() {
                    var updateUsernameQuery = `
                        UPDATE users
                        SET username =  ?
                        WHERE id = ?
                    `;
                    // Was a username provided?
                    if(username){
                        return connection.queryAsync(updateUsernameQuery, 
                            [username, user_id]);
                    }
                })
                // If applicable, update the password.
                .then(function() {
                    var updateUserPasswordQuery = `
                        UPDATE users
                        SET password =  ?
                        WHERE id = ?
                    `;
                    // Was a password provided?
                    if(password){
                        return connection.queryAsync(updateUserPasswordQuery, 
                            [bcrypt.hashSync(password, null, null), user_id]);
                    }
                })
                .then(function() {
                    return connection.queryAsync('COMMIT');
                })
                .catch(function(e) {
                    err = e;
                    return connection.queryAsync('ROLLBACK');
                })
                .then(function() {
                    callback(err);
                })
                .then(function() {
                    connection.release();
                }); 
        });
    },
    
    // Returns a listing of account information for the provided user.
    getAccountBalance: function(pool, account, callback){
        var query = `
            SELECT * FROM accounts
            WHERE account_id = ? 
        `;
        pool.getConnection(function(err, connection){
            connection.queryAsync(query, [account])
                .catch(function(err) {
                    console.error(err);
                })
                .then(function(results) {
                    callback(null, results);
                })
                .then(function() {
                    connection.release();
                });             
        });
    },
    
    // Returns a listing of account information for the provided user.
    readAccounts: function(pool, user_id, callback){
        var query = `
            SELECT * FROM accounts WHERE user_id = ? 
            ORDER BY default_account DESC
        `;
        pool.getConnection(function(err, connection){
            connection.queryAsync(query, [user_id])
                .catch(function(err) {
                    console.error(err);
                })
                .then(function(results) {
                    callback(null, results);
                })
                .then(function() {
                    connection.release();
                });             
        });
    },
    
    // Returns the balance and default status for the provided account number.
    getAccountDetails: function(pool, account_id, callback){
        var query = `
            SELECT balance, default_account
            FROM accounts
            WHERE account_id = ?
        `;
        pool.getConnection(function(err, connection){
            connection.queryAsync(query, [account_id])
                .catch(function(err) {
                    console.error(err);
                })
                .then(function(results) {
                    callback(null, results);
                })
                .then(function() {
                    connection.release();
                }); 
        });
    },
    
    // Returns transaction information for the provided account.
    readTransactions: function(pool, user_id, account, callback){
        var query = `
            SELECT DATE_FORMAT(time_stamp,'%m-%d-%Y') AS time_stamp, 
                reason, 
                IF(source_user_id = ?, source_id, (SELECT username FROM users WHERE id = source_user_id)) AS source_id, 
                IF(destination_user_id = ?, destination_id, (SELECT username FROM users WHERE id = destination_user_id)) AS destination_id, 
                amount 
            FROM transactions
            WHERE source_id = ? OR destination_id = ?
            ORDER BY time_stamp DESC
        `;
        pool.getConnection(function(err, connection){
            connection.queryAsync(query, [user_id, user_id, account, account])
                .catch(function(err) {
                    console.error(err);
                })
                .then(function(results) {
                    callback(null, results);
                })
                .then(function() {
                    connection.release();
                });          
        });
    }
};
