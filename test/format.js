/* global describe, it, beforeEach */
'use strict';

const File = require('vinyl');
const stream = require('stream');
const should = require('should');
const eslint = require('..');

require('mocha');

function getFiles() {
	return [
		new File({
			path: 'test/fixtures',
			contents: null,
			isDirectory: true
		}),
		new File({
			path: 'test/fixtures/use-strict.js',
			contents: Buffer.from('(function () {\n\n\tvoid 0;\n\n}());\n\n')
		}),
		new File({
			path: 'test/fixtures/undeclared.js',
			contents: Buffer.from('(function () {\n\t"use strict";\n\n\tx = 0;\n\n}());\n')
		}),
		new File({
			path: 'test/fixtures/passing.js',
			contents: Buffer.from('(function () {\n\n\t"use strict";\n\n}());\n')
		})
	];
}

describe('gulp-eslint format', () => {
	let formatCount;
	let writeCount;

	/**
	 * Custom ESLint formatted result writer for counting write attempts
	 * rather than writing to the console.
	 *
	 * @param {String} message - a message to count as written
	 */
	function outputWriter(message) {
		should.exist(message);
		message.should.match(/^\d+ messages$/);
		writeCount++;
	}

	/**
	 * Custom ESLint formatted result writer that will throw an exception
	 *
	 * @throws Error Always thrown to test error handling in writers
	 * @param {String} message - a message to trigger an error
	 */
	function failWriter(message) {
		const error = new Error('Writer Test Error' + (message ? ': ' + message : ''));
		error.name = 'TestError';
		throw error;
	}

	describe('format all results', () => {
		/**
		 * Custom ESLint result formatter for counting format passes and
		 * returning a expected formatted result message.
		 *
		 * @param {Array} results - ESLint results
		 * @param {Object} config - format config
		 * @returns {String} formatted results
		 */
		function formatResults(results, config) {
			should.exist(config);
			should.exist(results);
			results.should.be.instanceof(Array).with.a.lengthOf(3);
			formatCount++;

			const messageCount = results.reduce((sum, result) => {
				return sum + result.messages.length;
			}, 0);

			return messageCount + ' messages';
		}

		beforeEach(() => {
			formatCount = 0;
			writeCount = 0;
		});

		it('should format all ESLint results at once', done => {
			const files = getFiles();

			const lintStream = eslint({useEslintrc: false, rules: {'strict': 2}});
			lintStream.on('error', done);

			const formatStream = eslint.format(formatResults, outputWriter);

			formatStream
				.on('error', done)
				.on('finish', () => {
					formatCount.should.equal(1);
					writeCount.should.equal(1);
					done();
				});

			should.exist(lintStream.pipe);
			lintStream.pipe(formatStream);

			files.forEach(function(file) {
				lintStream.write(file);
			});
			lintStream.end();
		});

		it('should not attempt to format when no linting results are found', done => {
			const files = getFiles();

			const passthruStream = new stream.PassThrough({objectMode: true})
				.on('error', done);

			const formatStream = eslint.format(formatResults, outputWriter);

			formatStream
				.on('error', done)
				.on('finish', () => {
					formatCount.should.equal(0);
					writeCount.should.equal(0);
					done();
				});

			should.exist(passthruStream.pipe);
			passthruStream.pipe(formatStream);

			files.forEach(function(file) {
				passthruStream.write(file);
			});
			passthruStream.end();
		});

	});

	describe('format each result', () => {

		function formatResult(results, config) {
			should.exist(config);
			should.exist(results);
			results.should.be.instanceof(Array).with.a.lengthOf(1);
			formatCount++;

			return `${results.reduce((sum, result) => sum + result.messages.length, 0)} messages`;
		}

		it('should format individual ESLint results', done => {
			formatCount = 0;
			writeCount = 0;

			const files = getFiles();

			const lintStream = eslint({useEslintrc: false, rules: {'strict': 2}})
				.on('error', done);

			const formatStream = eslint.formatEach(formatResult, outputWriter)
				.on('error', done)
				.on('finish', function() {
				// the stream should not have emitted an error
					this._writableState.errorEmitted.should.equal(false);

					const fileCount = files.length - 1;// remove directory
					formatCount.should.equal(fileCount);
					writeCount.should.equal(fileCount);
					done();
				});

			should.exist(lintStream.pipe);
			lintStream.pipe(formatStream);

			files.forEach(file => lintStream.write(file));
			lintStream.end();
		});

		it('should catch and wrap format writer errors in a PluginError', done => {
			formatCount = 0;
			writeCount = 0;

			const files = getFiles();

			const lintStream = eslint({useEslintrc: false, rules: {'strict': 2}})
				.on('error', done);

			const formatStream = eslint.formatEach(formatResult, failWriter);

			formatStream
				.on('error', err => {
					should.exists(err);
					err.message.should.equal('Writer Test Error: 1 messages');
					err.name.should.equal('TestError');
					err.plugin.should.equal('gulp-eslint');
					done();
				})
				.on('finish', () => {
					done(new Error('Expected PluginError to fail stream'));
				});

			should.exist(lintStream.pipe);
			lintStream.pipe(formatStream);

			files.forEach(file => lintStream.write(file));
			lintStream.end();
		});

	});

});
