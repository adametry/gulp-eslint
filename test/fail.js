/*global describe, it, beforeEach */
'use strict';

var fs = require('fs'),
	es = require('event-stream'),
	should = require('should'),
	path = require('path'),
	gutil = require('gulp-util'),
	eslint = require('../');

require('mocha');

describe('gulp-eslint failOnError', function () {

	var files;

	/**
	 * Create gutil.Files from file paths
	 */
	function readFiles(filePaths) {
		return filePaths.map(function (filePath) {
			var stat = fs.statSync(filePath);
			return new gutil.File({
				cwd:  'test/',
				base: path.dirname(filePath),
				path: path.resolve(filePath),
				stat: stat,
				contents: stat.isDirectory() ? null: fs.readFileSync(filePath)
			});
		});
	}

	beforeEach(function () {
		files = readFiles([
			'test',
			'test/fixtures',
			'test/fixtures/ignored.js',
			'test/fixtures/passing.js',
			'test/fixtures/undeclared.js',
			'test/fixtures/use-strict.js'
		]);
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
