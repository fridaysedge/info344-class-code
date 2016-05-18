'use strict';

var should = require('should');
var request = require('request-promise');

var url = 'http://localhost:8080';

var host = process.env.HOST || '127.0.0.1';
var baseUrl = 'http://' + host;

// Login Page
describe('routes', function() {
	it('Should get the login page', function() {
		var options = {
            method: 'GET',
			uri: baseUrl + '/login',
            resolveWithFullResponse: true 
		};

		request(options)
			.then(function(res) {
        should.equal(res.statusCode, 200, 'statusCode does not equal 200.');
        should.equal(res.headers['content-type'], 'text/html; charset=utf-8', 'Wrong content type');
			});
	})
});

// Account Page
describe('routes', function() {
	it('Should not be able to get the login page', function() {
		var options = {
            method: 'GET',
			uri: baseUrl + '/account',
            resolveWithFullResponse: true 
		};

		request(options)
			.then(function(res) {
        should.equal(res.statusCode, 401, 'statusCode does not equal 401.');
        should.equal(res.headers['content-type'], 'text/html; charset=utf-8', 'Wrong content type');
			});
	})
});






