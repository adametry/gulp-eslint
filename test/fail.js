/* global describe, it, beforeEach */
'use strict';

var File = require('vinyl'),
	should = require('should'),
	eslint = require('../');

require('mocha');

describe('gulp-eslint failOnError', function() {
	it('should fail a file immediately if an error is found', function(done) {
		var lintStream = eslint({
			envs: ['browser'],
			rules: {
				'no-undef': 2,
				'strict': 0
			}
		});

		lintStream.pipe(eslint.failOnError().on('error', function(err) {
			should.exists(err);
			err.message.should.equal('\"document\" is read only.');
			err.fileName.should.equal('test/fixtures/invalid.js');
			err.plugin.should.equal('gulp-eslint');
			done();
		}))
		.on('end', function() {
			done(new Error('An error was not thrown before ending'));
		});

		lintStream.write(new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('document = "abuse read-only value";')
		}));

		lintStream.end();
	});

	it('should pass a file if only warnings are found', function(done) {

		var lintStream = eslint({rules: {'no-undef': 1, 'strict': 0}});

		lintStream.pipe(eslint.failOnError())
		.on('error', done)
		.on('finish', done);

		lintStream.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('x = 0;')
		}));
	});

	it('should fail when the file stream ends if an error is found', function(done) {
		var lintStream = eslint({
			envs: ['browser'],
			rules: {
				'no-undef': 2,
				'strict': 0
			}
		});

		lintStream.pipe(eslint.failAfterError().on('error', function(err) {
			should.exists(err);
			err.message.should.equal('Failed with 1 error');
			err.name.should.equal('ESLintError');
			err.plugin.should.equal('gulp-eslint');
			done();
		}));

		lintStream.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('document = "abuse read-only value";')
		}));
	});

	it('should fail when the file stream ends if multiple errors are found', function(done) {
		var lintStream = eslint({
			envs: ['browser'],
			rules: {
				'no-undef': 2,
				'strict': 0
			}
		});

		lintStream.pipe(eslint.failAfterError().on('error', function(err) {
			should.exists(err);
			err.message.should.equal('Failed with 2 errors');
			err.name.should.equal('ESLintError');
			err.plugin.should.equal('gulp-eslint');
			done();
		}));

		lintStream.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('document = "abuse read-only value"; a = false;')
		}));
	});

	it('should pass when the file stream ends if only warnings are found', function(done) {
		var lintStream = eslint({rules: {'no-undef': 1, 'strict': 0}});

		lintStream.pipe(eslint.failAfterError())
		.on('error', done)
		.on('finish', done);

		lintStream.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('x = 0;')
		}));
	});

	it('should handle eslint reports without messages', function(done) {
		var lintStream = eslint({rules: {'no-undef': 1, 'strict': 0}});

		lintStream.pipe(eslint.failAfterError())
		.on('error', done)
		.on('finish', done);

		lintStream.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('x = 0;')
		}));
	});

});

describe('gulp-eslint failAfterWarnings', function() {
	it('should pass when the file stream ends if too few warnings found', function(done) {
		var lintStream = eslint({rules: {'no-undef': 1, 'strict': 0}});

		lintStream.pipe(eslint.failAfterWarnings(3))
		.on('error', done)
		.on('finish', done);

		lintStream.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('x = 0; y = 0;')
		}));
	});

	it('should fail when the file stream ends if too many warnings are found', function(done) {
		var lintStream = eslint({
			envs: ['browser'],
			rules: {
				'no-undef': 1,
				'strict': 0
			}
		});

		lintStream.pipe(eslint.failAfterWarnings(1).on('error', function(err) {
			should.exists(err);
			err.message.should.equal('Failed because of too many warnings. ' +
										'Found 2 warnings, threshold is 1.');
			err.name.should.equal('ESLintError');
			err.plugin.should.equal('gulp-eslint');
			done();
		}));

		lintStream.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('x = 0; y = 0;')
		}));
	});

});
