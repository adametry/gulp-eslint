/* global describe, it, beforeEach */
'use strict';

var File = require('vinyl'),
	stream = require('stream'),
	should = require('should'),
	eslint = require('../');

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
			contents: new Buffer('(function () {\n\n\tvoid 0;\n\n}());\n\n')
		}),
		new File({
			path: 'test/fixtures/undeclared.js',
			contents: new Buffer('(function () {\n\t"use strict";\n\n\tx = 0;\n\n}());\n')
		}),
		new File({
			path: 'test/fixtures/passing.js',
			contents: new Buffer('(function () {\n\n\t"use strict";\n\n}());\n')
		})
	];
}

describe('gulp-eslint format', function() {
	var formatCount, writeCount;

	/**
	 * Custom eslint formatted result writer for counting write attempts
	 * rather than writing to the console.
	 * @param {string} message - a message to count as written
	 * @returns {undefined} void
	 */
	function outputWriter(message) {
		should.exist(message);
		message.should.match(/^\d+ messages$/);
		writeCount++;
	}

	/**
	 * Custom eslint formatted result writer that will throw an exception
	 * @exception Error Always thrown to test error handling in writers
	 * @param {string} message - a message to trigger an error
	 * @returns {undefined} void
	 */
	function failWriter(message) {
		var error = new Error('Writer Test Error');
		error.name = 'TestError';
		throw error;
	}

	describe('format all results', function() {
		/**
		 * Custom eslint result formatter for counting format passes and
		 * returning a expected formatted result message.
		 * @param {array} results - eslint results
		 * @param {object} config - format config
		 * @returns {string} formatted results
		 */
		function formatResults(results, config) {
			should.exist(config);
			should.exist(results);
			results.should.be.instanceof(Array).with.a.lengthOf(3);
			formatCount++;

			var messageCount = results.reduce(function(sum, result) {
				return sum + result.messages.length;
			}, 0);

			return messageCount + ' messages';
		}

		beforeEach(function() {
			formatCount = 0;
			writeCount = 0;
		});

		it('should format all eslint results at once', function(done) {
			var files = getFiles();

			var lintStream = eslint().on('error', done);

			var formatStream = eslint.format(formatResults, outputWriter);

			formatStream
			.on('error', done)
			.on('finish', function() {
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

		it('should not attempt to format when no linting results are found', function(done) {
			var files = getFiles();

			var passthruStream = new stream.PassThrough({objectMode: true})
			.on('error', done);

			var formatStream = eslint.format(formatResults, outputWriter);

			formatStream
			.on('error', done)
			.on('finish', function() {
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

	describe('format each result', function() {

		function formatResult(results, config) {
			should.exist(config);
			should.exist(results);
			results.should.be.instanceof(Array).with.a.lengthOf(1);
			formatCount++;

			return results.reduce(function(sum, result) {
				return sum + result.messages.length;
			}, 0) + ' messages';
		}

		it('should format individual eslint results', function(done) {
			formatCount = 0;
			writeCount = 0;

			var files = getFiles();

			var lintStream = eslint()
			.on('error', done)
			.on('finish', function() {
				process.nextTick(function() {
					var fileCount = files.length - 1;// remove directory
					formatCount.should.equal(fileCount);
					writeCount.should.equal(fileCount);
					done();
				});
			});

			var formatStream = eslint.formatEach(formatResult, outputWriter);

			formatStream.on('error', done);

			should.exist(lintStream.pipe);
			lintStream.pipe(formatStream);

			files.forEach(function(file) {
				lintStream.write(file);
			});
			lintStream.end();
		});

		it('should catch and wrap format writer errors in a PluginError', function(done) {
			formatCount = 0;
			writeCount = 0;

			var files = getFiles();

			var lintStream = eslint()
			.on('error', done);

			var formatStream = eslint.formatEach(formatResult, failWriter);

			formatStream
			.on('error', function(err) {
				should.exists(err);
				err.message.should.equal('Writer Test Error');
				err.name.should.equal('TestError');
				err.plugin.should.equal('gulp-eslint');
				done();
			})
			.on('finish', function() {
				done(new Error('Expected PluginError to fail stream'));
			});

			should.exist(lintStream.pipe);
			lintStream.pipe(formatStream);

			files.forEach(function(file) {
				lintStream.write(file);
			});
			lintStream.end();
		});

	});

});
