/* global describe, it, beforeEach */
'use strict';

const File = require('vinyl');
const path = require('path');
const should = require('should');
const eslint = require('../');

require('mocha');

describe('gulp-eslint failOnError', () =>  {
	it('should fail a file immediately if an error is found', done =>  {
		const lintStream = eslint({useEslintrc: false, rules: {'no-undef': 2}});

		function endWithoutError() {
			done(new Error('An error was not thrown before ending'));
		}

		lintStream.pipe(eslint.failOnError())
			.on('error', function(err)  {
				this.removeListener('finish', endWithoutError);
				should.exists(err);
				err.message.should.equal('\'x\' is not defined.');
				err.fileName.should.equal(path.resolve('test/fixtures/invalid.js'));
				err.plugin.should.equal('gulp-eslint');
				done();
			})
			.on('finish', endWithoutError);

		lintStream.write(new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('x = 1;')
		}));

		lintStream.end();
	});

	it('should pass a file if only warnings are found', done =>  {

		const lintStream = eslint({useEslintrc: false, rules: {'no-undef': 1, 'strict': 0}});

		lintStream.pipe(eslint.failOnError())
			.on('error', done)
			.on('finish', done);

		lintStream.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('x = 0;')
		}));
	});

	it('should handle ESLint reports without messages', done =>  {

		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});
		file.eslint = {};

		eslint.failOnError()
			.on('error', (err) =>  {
				this.removeListener('finish', done);
				done(err);
			})
			.on('finish', done)
			.end(file);
	});

});

describe('gulp-eslint failAfterError', () =>  {

	it('should fail when the file stream ends if an error is found', done =>  {
		const lintStream = eslint({useEslintrc: false, rules: {'no-undef': 2}});

		function endWithoutError() {
			done(new Error('An error was not thrown before ending'));
		}

		lintStream.pipe(eslint.failAfterError())
			.on('error', function(err)  {
				this.removeListener('finish', endWithoutError);
				should.exists(err);
				err.message.should.equal('Failed with 1 error');
				err.name.should.equal('ESLintError');
				err.plugin.should.equal('gulp-eslint');
				done();
			})
			.on('finish', endWithoutError);

		lintStream.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('x = 1;')
		}));
	});

	it('should fail when the file stream ends if multiple errors are found', done =>  {
		const lintStream = eslint({useEslintrc: false, rules: {'no-undef': 2}});

		lintStream.pipe(eslint.failAfterError().on('error', (err) =>  {
			should.exists(err);
			err.message.should.equal('Failed with 2 errors');
			err.name.should.equal('ESLintError');
			err.plugin.should.equal('gulp-eslint');
			done();
		}));

		lintStream.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('x = 1; a = false;')
		}));
	});

	it('should pass when the file stream ends if only warnings are found', done =>  {
		const lintStream = eslint({useEslintrc: false, rules: {'no-undef': 1, strict: 0}});

		lintStream.pipe(eslint.failAfterError())
			.on('error', done)
			.on('finish', done);

		lintStream.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('x = 0;')
		}));
	});

	it('should handle ESLint reports without messages', done =>  {
		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});
		file.eslint = {};

		eslint.failAfterError()
			.on('error', done)
			.on('finish', done)
			.end(file);
	});

});
