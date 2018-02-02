/* global describe, it, beforeEach */
'use strict';

const File = require('vinyl');
const PassThrough = require('stream').PassThrough;
const should = require('should');
const eslint = require('..');

require('mocha');

describe('gulp-eslint result', () => {
	it('should provide an ESLint result', done => {
		let resultCount = 0;
		const lintStream = eslint({
			useEslintrc: false,
			rules: {
				'no-undef': 2,
				'strict': [1, 'global']
			}
		});

		lintStream
			.pipe(eslint.result(result => {
				should.exists(result);
				result.messages.should.be.instanceof(Array).with.a.lengthOf(2);
				result.errorCount.should.equal(1);
				result.warningCount.should.equal(1);
				resultCount++;
			}))
			.on('finish', () => {
				resultCount.should.equal(3);
				done();
			});

		lintStream.write(new File({
			path: 'test/fixtures/invalid-1.js',
			contents: Buffer.from('x = 1;')
		}));

		lintStream.write(new File({
			path: 'test/fixtures/invalid-2.js',
			contents: Buffer.from('x = 2;')
		}));

		lintStream.write(new File({
			path: 'test/fixtures/invalid-3.js',
			contents: Buffer.from('x = 3;')
		}));

		lintStream.end();
	});

	it('should catch thrown errors', done => {
		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});
		file.eslint = {};

		function finished() {
			done(new Error('Unexpected Finish'));
		}

		eslint.result(() => {
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

	it('should catch thrown null', done => {
		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});
		file.eslint = {};

		function finished() {
			done(new Error('Unexpected Finish'));
		}

		eslint.result(() => {
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

	it('should throw an error if not provided a function argument', () => {

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

	it('should ignore files without an ESLint result', done => {

		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});

		eslint.result(() => {
			throw new Error('Expected no call');
		})
			.on('error', function(error) {
				this.removeListener('finish', done);
				done(error);
			})
			.on('finish', done)
			.end(file);
	});

	it('should support an async result handler', done => {
		let asyncComplete = false;
		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});
		const resultStub = {};
		file.eslint = resultStub;

		function ended() {
			asyncComplete.should.equal(true);
			done();
		}

		const resultStream = eslint.result((result, callback) => {
			should.exists(result);
			result.should.equal(resultStub);

			(typeof callback).should.equal('function');

			setTimeout(() => {
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

describe('gulp-eslint results', () => {

	it('should provide ESLint results', done => {
		let resultsCalled = false;
		const lintStream = eslint({
			useEslintrc: false,
			rules: {
				'no-undef': 2,
				'strict': [1, 'global']
			}
		});

		lintStream
			.pipe(eslint.results(results => {
				should.exists(results);
				results.should.be.instanceof(Array).with.a.lengthOf(3);
				results.errorCount.should.equal(3);
				results.warningCount.should.equal(3);
				resultsCalled = true;
			}))
			.on('finish', () => {
				resultsCalled.should.equal(true);
				done();
			});

		lintStream.write(new File({
			path: 'test/fixtures/invalid-1.js',
			contents: Buffer.from('x = 1;')
		}));

		lintStream.write(new File({
			path: 'test/fixtures/invalid-2.js',
			contents: Buffer.from('x = 2;')
		}));

		lintStream.write(new File({
			path: 'test/fixtures/invalid-3.js',
			contents: Buffer.from('x = 3;')
		}));

		lintStream.end();
	});

	it('should catch thrown errors', done => {
		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});
		file.eslint = {};

		function finished() {
			done(new Error('Unexpected Finish'));
		}

		eslint.results(() => {
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

	it('should throw an error if not provided a function argument', () => {

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

	it('should ignore files without an ESLint result', done => {
		let resultsCalled = false;
		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});

		function finished() {
			resultsCalled.should.equal(true);
			done();
		}

		eslint.results(results => {
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

	it('should support an async results handler', done => {
		let asyncComplete = false;
		const file = new File({
			path: 'test/fixtures/invalid.js',
			contents: Buffer.from('#invalid!syntax}')
		});
		const resultStub = {};
		file.eslint = resultStub;

		function ended() {
			asyncComplete.should.equal(true);
			done();
		}

		const resultStream = eslint.results((results, callback) => {
			should.exists(results);
			results.should.be.instanceof(Array).with.a.lengthOf(1);

			const result = results[0];
			result.should.equal(resultStub);

			(typeof callback).should.equal('function');

			setTimeout(() => {
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
