'use strict';

var uid = require('uid-safe');
var bcrypt = require('bcrypt-nodejs');

module.exports = {
    createMainAccount: function(connection, user_id){
        var query = `
            INSERT INTO accounts ( 
                account_id, accountname, balance, default_account, user_id)
            VALUES (FLOOR (rand() * 5000 * 5000), 'Main', 100, 1, ?)
        `
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

            });
    },
    
    getAccountQty: function(connection, user_id, callback){
        var query = `
            SELECT COUNT(user_id) AS qty
            FROM accounts
            WHERE user_id = ?
        `
        connection.queryAsync(query, [user_id])
            .catch(function(err) {
                console.error(err);
            })
            .then(function(results) {
                callback(null, results);
            });
    },
    
    addNewAccount: function(connection, account_name, user_id){
        var query = `
            INSERT INTO accounts ( 
                account_id, accountname, balance, default_account, user_id)
            VALUES (FLOOR (rand() * 5000 * 5000), ?, 0, 0, ?)
        `
        connection.queryAsync('SET autocommit = 0')
            .then(function() {
                return connection.queryAsync('START TRANSACTION');
            })
            .then(function(results) {
                return connection.queryAsync(query, [account_name, user_id]);
            })
            .then(function() {
                return connection.queryAsync('COMMIT');
            })
            .catch(function(err) {
                return connection.queryAsync('ROLLBACK');
            })
            .then(function() {

            });
    },
    
    getAccountClosureInfo: function(connection, account, callback){
        var query = `
            SELECT balance, default_account
            FROM accounts
            WHERE account_id = ?
        `
        connection.queryAsync(query, [account])
            .catch(function(err) {
                console.error(err);
            })
            .then(function(results) {
                callback(null, results);
            });
    },
    
    closeAccount: function(connection, user_id, account){
        var query = `
            DELETE FROM accounts
            WHERE account_id = ?
        `
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

            });
    },
    
    
    transferMyAccounts: function(connection, from, to, amount, reason, user_id){

        connection.queryAsync('SET autocommit = 0')
            .then(function() {
                return connection.queryAsync('START TRANSACTION');
            })
            .then(function() {
                var debitQuery = `
                    UPDATE accounts 
                    SET balance = (
                        SELECT balance
                        WHERE account_id = ?
                    ) - ?
                    WHERE account_id = ?
                `
                return connection.queryAsync(debitQuery, [
                    from, amount, from
                ]);
            })
            .then(function() {
                var creditQuery = `
                    UPDATE accounts 
                    SET balance = (
                        SELECT balance
                        WHERE account_id = ?
                    ) + ?
                    WHERE account_id = ?
                `
                return connection.queryAsync(creditQuery, [
                    to, amount, to
                ]);
            })
            .then(function() {
                var transactionQuery = `
                    INSERT INTO transactions (amount, reason, source_id, 
                        source_user_id, destination_id, destination_user_id)
                    VALUES (?, ?, ?, ?, ?, ?);
                `
                return connection.queryAsync(transactionQuery, [
                    amount, reason, from, user_id, to, user_id
                ]);
            })
            .then(function() {
                return connection.queryAsync('COMMIT');
            })
            .catch(function(err) {
                return connection.queryAsync('ROLLBACK');
            })
            .then(function() {

            });
    },
    
    transferOtherAccounts: function(connection, from, email, amount, reason, user_id){

        connection.queryAsync('SET autocommit = 0')
            .then(function() {
                return connection.queryAsync('START TRANSACTION');
            })
            .then(function() {
                var debitQuery = `
                    UPDATE accounts 
                    SET balance = (
                        SELECT balance
                        WHERE account_id = ?
                    ) - ?
                    WHERE account_id = ?
                `
                return connection.queryAsync(debitQuery, [
                    from, amount, from
                ]);
            })
            .then(function() {
                var findAccountQuery = `
                    SELECT account_id INTO @target_account FROM accounts 
                    INNER JOIN users
                    ON accounts.user_id = users.id
                    WHERE username = ? AND default_account = 1
                `
                return connection.queryAsync(findAccountQuery, [email]);
            })
            .then(function() {
                var findTargetUserQuery = `
                    SELECT user_id INTO @target_user_id FROM accounts 
                    WHERE account_id = @target_account
                `
                return connection.queryAsync(findTargetUserQuery, [email]);
            })
            .then(function() {
                var creditQuery = `
                    UPDATE accounts 
                    SET balance = (
                        SELECT balance
                        WHERE account_id = @target_account
                    ) + ?
                    WHERE account_id = @target_account
                `
                return connection.queryAsync(creditQuery, [amount]);
            })
            .then(function() {
                var transactionQuery = `
                    INSERT INTO transactions (amount, reason, source_id, 
                        source_user_id, destination_id, destination_user_id)
                    VALUES (?, ?, ?, ?, @target_account, @target_user_id);
                `
                return connection.queryAsync(transactionQuery, [
                    amount, reason, from, user_id
                ]);
            })
            .then(function() {
                return connection.queryAsync('COMMIT');
            })
            .catch(function(err) {
                return connection.queryAsync('ROLLBACK');
            })
            .then(function() {

            });
    },
    
    updateUser: function(connection, user_id, username, password){
        connection.queryAsync('SET autocommit = 0')
            .then(function() {
                return connection.queryAsync('START TRANSACTION');
            })
            .then(function() {
                var updateUsernameQuery = `
                    UPDATE users
                    SET username =  ?
                    WHERE id = ?
                `
                if(username){
                    return connection.queryAsync(updateUsernameQuery, 
                        [username, user_id]);
                }
            })
            .then(function() {
                var updateUsernameQuery = `
                    UPDATE users
                    SET password =  ?
                    WHERE id = ?
                `
                if(password){
                    return connection.queryAsync(updateUsernameQuery, 
                        [bcrypt.hashSync(password, null, null), user_id]);
                }
            })
            .then(function() {
                return connection.queryAsync('COMMIT');
            })
            .catch(function(err) {
                return connection.queryAsync('ROLLBACK');
            })
            .then(function() {

            });
    },
    
    readAccounts: function(connection, user_id, callback){
        var query = `
            SELECT * FROM accounts WHERE user_id = ? 
            ORDER BY default_account DESC
        `
        connection.queryAsync(query, [user_id])
            .catch(function(err) {
                console.error(err);
            })
            .then(function(results) {
                callback(null, results);
            });
    },
    
    getAccountDetails: function(connection, account_id, callback){
        var query = `
            SELECT balance, default_account
            FROM accounts
            WHERE account_id = ?
        `
        connection.queryAsync(query, [account_id])
            .catch(function(err) {
                console.error(err);
            })
            .then(function(results) {
                callback(null, results);
            });
    },
    
    readTransactions: function(connection, user_id, account, callback){
        var query = `
            SELECT DATE_FORMAT(time_stamp,'%m-%d-%Y') AS time_stamp, 
                reason, 
                IF(source_user_id = ?, source_id, (SELECT username FROM users WHERE id = source_user_id)) AS source_id, 
                IF(destination_user_id = ?, destination_id, (SELECT username FROM users WHERE id = destination_user_id)) AS destination_id, 
                amount 
            FROM transactions
            WHERE source_id = ? OR destination_id = ?
            ORDER BY time_stamp DESC
        `
        connection.queryAsync(query, [user_id, user_id, account, account])
            .catch(function(err) {
                console.error(err);
            })
            .then(function(results) {
                callback(null, results);
            });
    }
};
