/* global describe, it, beforeEach */
'use strict';

var File = require('vinyl'),
	PassThrough = require('stream').PassThrough,
	should = require('should'),
	eslint = require('../');

require('mocha');

describe('gulp-eslint result', function() {

	it('should provide a ESLint result', function(done) {
		var resultCount = 0;
		var lintStream = eslint({
			envs: ['browser'],
			rules: {
				'no-undef': 2,
				'strict': [1, 'global']
			}
		});

		lintStream
		.pipe(eslint.result(function(result) {
			should.exists(result);
			result.messages.should.be.instanceof(Array).with.a.lengthOf(2);
			result.errorCount.should.equal(1);
			result.warningCount.should.equal(1);
			resultCount++;
		}))
		.on('finish', function() {
			resultCount.should.equal(3);
			done();
		});

		lintStream.write(new File({
			path: 'test/fixtures/invalid-1.js',
			contents: new Buffer('document = "abuse read-only value";')
		}));

		lintStream.write(new File({
			path: 'test/fixtures/invalid-2.js',
			contents: new Buffer('document = "abuse read-only value";')
		}));

		lintStream.write(new File({
			path: 'test/fixtures/invalid-3.js',
			contents: new Buffer('document = "abuse read-only value";')
		}));

		lintStream.end();
	});

	it('should catch thrown errors', function(done) {
		var file = new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('#invalid!syntax}')
		});
		file.eslint = {};

		function finished() {
			done(new Error('Unexpected Finish'));
		}

		eslint.result(function() {
			throw new Error('Expected Error');
		})
		.on('error', function(error) {
			this.removeListener('finish', finished);
			should.exists(error);
			error.message.should.equal('Expected Error');
			error.name.should.equal('Error');
			error.plugin.should.equal('gulp-eslint');
			done();
		})
		.on('finish', finished)
		.end(file);
	});

	it('should catch thrown null', function(done) {
		var file = new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('#invalid!syntax}')
		});
		file.eslint = {};

		function finished() {
			done(new Error('Unexpected Finish'));
		}

		eslint.result(function() {
			throw null;
		})
		.on('error', function(error) {
			this.removeListener('finish', finished);
			should.exists(error);
			error.message.should.equal('Unknown Error');
			error.name.should.equal('Error');
			error.plugin.should.equal('gulp-eslint');
			done();
		})
		.on('finish', finished)
		.end(file);
	});

	it('should throw an error if not provided a function argument', function() {

		try {
			eslint.result();
		} catch (error) {
			should.exists(error);
			should.exists(error.message);
			error.message.should.equal('Expected callable argument');
			return;
		}

		throw new Error('Expected exception to be thrown');

	});

	it('should ignore files without an ESLint result', function(done) {

		var file = new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('#invalid!syntax}')
		});

		eslint.result(function() {
			throw new Error('Expected no call');
		})
		.on('error', function(error) {
			this.removeListener('finish', done);
			done(error);
		})
		.on('finish', done)
		.end(file);
	});

	it('should support an async result handler', function(done) {
		var asyncComplete = false;
		var file = new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('#invalid!syntax}')
		});
		var resultStub = {};
		file.eslint = resultStub;

		function ended() {
			asyncComplete.should.equal(true);
			done();
		}

		var resultStream = eslint.result(function(result, callback) {
			should.exists(result);
			result.should.equal(resultStub);

			(typeof callback).should.equal('function');

			setTimeout(function() {
				asyncComplete = true;
				callback();
			}, 10);
		})
		.on('error', function(error) {
			this.removeListener('end', ended);
			done(error);
		})
		.on('end', ended);

		// drain result into pass-through stream
		resultStream.pipe(new PassThrough({objectMode: true}));

		resultStream.end(file);

	});

});

describe('gulp-eslint results', function() {

	it('should provide ESLint results', function(done) {
		var resultsCalled = false;
		var lintStream = eslint({
			envs: ['browser'],
			rules: {
				'no-undef': 2,
				'strict': [1, 'global']
			}
		});

		lintStream
		.pipe(eslint.results(function(results) {
			should.exists(results);
			results.should.be.instanceof(Array).with.a.lengthOf(3);
			results.errorCount.should.equal(3);
			results.warningCount.should.equal(3);
			resultsCalled = true;
		}))
		.on('finish', function() {
			resultsCalled.should.equal(true);
			done();
		});

		lintStream.write(new File({
			path: 'test/fixtures/invalid-1.js',
			contents: new Buffer('document = "abuse read-only value";')
		}));

		lintStream.write(new File({
			path: 'test/fixtures/invalid-2.js',
			contents: new Buffer('document = "abuse read-only value";')
		}));

		lintStream.write(new File({
			path: 'test/fixtures/invalid-3.js',
			contents: new Buffer('document = "abuse read-only value";')
		}));

		lintStream.end();
	});

	it('should catch thrown errors', function(done) {
		var file = new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('#invalid!syntax}')
		});
		file.eslint = {};

		function finished() {
			done(new Error('Unexpected Finish'));
		}

		eslint.results(function() {
			throw new Error('Expected Error');
		})
		.on('error', function(error) {
			this.removeListener('finish', finished);
			should.exists(error);
			error.message.should.equal('Expected Error');
			error.name.should.equal('Error');
			error.plugin.should.equal('gulp-eslint');
			done();
		})
		.on('finish', finished)
		.end(file);
	});

	it('should throw an error if not provided a function argument', function() {

		try {
			eslint.results();
		} catch (error) {
			should.exists(error);
			should.exists(error.message);
			error.message.should.equal('Expected callable argument');
			return;
		}

		throw new Error('Expected exception to be thrown');

	});

	it('should ignore files without an ESLint result', function(done) {
		var resultsCalled = false;
		var file = new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('#invalid!syntax}')
		});

		function finished() {
			resultsCalled.should.equal(true);
			done();
		}

		eslint.results(function(results) {
			should.exists(results);
			results.should.be.instanceof(Array).with.a.lengthOf(0);
			resultsCalled = true;
		})
		.on('error', function(error) {
			this.removeListener('finish', finished);
			done(error);
		})
		.on('finish', finished)
		.end(file);
	});

	it('should support an async results handler', function(done) {
		var asyncComplete = false;
		var file = new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('#invalid!syntax}')
		});
		var resultStub = {};
		file.eslint = resultStub;

		function ended() {
			asyncComplete.should.equal(true);
			done();
		}

		var resultStream = eslint.results(function(results, callback) {
			should.exists(results);
			results.should.be.instanceof(Array).with.a.lengthOf(1);

			var result = results[0];
			result.should.equal(resultStub);

			(typeof callback).should.equal('function');

			setTimeout(function() {
				asyncComplete = true;
				callback();
			}, 10);
		})
		.on('error', function(error) {
			this.removeListener('end', ended);
			done(error);
		})
		.on('end', ended);

		// drain result into pass-through stream
		resultStream.pipe(new PassThrough({objectMode: true}));

		resultStream.end(file);

	});

});
