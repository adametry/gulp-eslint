/*global describe, it, beforeEach */
'use strict';

var should = require('should'),
	gutil = require('gulp-util'),
	eslint = require('../');

require('mocha');

describe('gulp-eslint failOnError', function () {

	var files;

	/**
	 * Create gutil.Files
	 */
	beforeEach(function () {
		files = [
			new gutil.File({
				cwd:  'test/',
				base: 'test/fixtures',
				path: 'test/fixtures',
				contents: null,
				isDirectory: true
			}),
			new gutil.File({
				cwd:  'test/',
				base: 'test/fixtures',
				path: 'test/fixtures/passing.js',
				contents: new Buffer('(function () {\n\n\t"use strict";\n\n}());\n')
			}),
			new gutil.File({
				cwd:  'test/',
				base: 'test/fixtures',
				path: 'test/fixtures/undeclared.js',
				contents: new Buffer('(function () {\n\t"use strict";\n\n\tx = 0;\n\n}());\n')
			}),
			new gutil.File({
				cwd:  'test/',
				base: 'test/fixtures',
				path: 'test/fixtures/use-strict.js',
				contents: new Buffer("(function () {\n\n\tvoid 0;\n\n}());\n\n")
			})
		];
	});

	it('should fail if an error is found', function (done) {

		var lintStream = eslint({
			rules:{
				'strict': 2,
				'no-undef': 2
			}
		});

		var failStream = eslint.failOnError();

		failStream.on('error', function(error) {
			should.exist(error);
			done();
		}).on('end', function () {
			done(new Error('Stream completed without failure'));
		});

		should.exist(lintStream.pipe);
		lintStream.pipe(failStream);

		files.forEach(lintStream.write);
		lintStream.end();
	});

	it('should pass if only warnings are found', function (done) {

		var lintStream = eslint({
			rules:{
				'strict': 1,
				'no-undef': 1
			}
		});

		var failStream = eslint.failOnError();

		failStream.on('error', function(error) {
			should.exist(error);
			done(error);
		}).on('end', function () {
			done();
		});

		should.exist(lintStream.pipe);
		lintStream.pipe(failStream);

		files.forEach(lintStream.write);
		lintStream.end();
	});

});
