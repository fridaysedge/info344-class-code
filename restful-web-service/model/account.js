'use strict';

var uid = require('uid-safe');

function logRow(row) {
    console.log(row);
}

function logRows(rows) {
    rows.forEach(logRow);
}

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
                console.log('debitQuery fired');
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
                console.log('creditQuery fired');
                return connection.queryAsync(creditQuery, [
                    to, amount, to
                ]);
            })
            .then(function() {
                var transactionQuery = `
                    INSERT INTO transactions (amount, reason, source_id, 
                        destination_id)
                    VALUES (?, ?, ?, ?);
                `
                console.log('transactionQuery fired');
                return connection.queryAsync(transactionQuery, [
                    amount, reason, from, to
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
                console.log('debitQuery fired');
                return connection.queryAsync(debitQuery, [
                    from, amount, from
                ]);
            })
            .then(function() {
                var fundAccountQuery = `
                    SELECT account_id INTO @target_account FROM accounts 
                    INNER JOIN users
                    ON accounts.user_id = users.id
                    WHERE username = ? AND default_account = 1
                `
                return connection.queryAsync(fundAccountQuery, [email]);
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
                console.log('creditQuery fired');
                return connection.queryAsync(creditQuery, [amount]);
            })
            .then(function() {
                var transactionQuery = `
                    INSERT INTO transactions (amount, reason, source_id, 
                        destination_id)
                    VALUES (?, ?, ?, @target_account);
                `
                console.log('transactionQuery fired');
                return connection.queryAsync(transactionQuery, [
                    amount, reason, from
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
    
    readTransactions: function(connection, user_id, account, callback){
        var query = `
            SELECT * FROM transactions WHERE source_id = ? 
            ORDER BY time_stamp DESC
        `
        connection.queryAsync(query, [account])
            .catch(function(err) {
                console.error(err);
            })
            .then(function(results) {
                callback(null, results);
            });
    }
};
