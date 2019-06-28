/* global describe, it, afterEach */
'use strict';

const File = require('vinyl');
const stream = require('stream');
const should = require('should');
const util = require('../util');

require('mocha');

describe('utility methods', () => {
	describe('transform', () => {
		it('should handle files in a stream', done => {
			let passedFile = false;
			const streamFile = new File({
				path: 'test/fixtures/invalid.js',
				contents: Buffer.from('x = 1;')
			});
			const testStream = util.transform((file, enc, cb) => {
				should.exist(file);
				should.exist(cb);
				passedFile = (streamFile === file);
				cb();
			})
			.on('error', done)
			.on('finish', () => {
				passedFile.should.equal(true);
				done();
			});

			testStream.end(streamFile);
		});

		it('should flush when stream is ending', done => {
			let count = 0;
			let finalCount = 0;
			const files = [
				new File({
					path: 'test/fixtures/invalid.js',
					contents: Buffer.from('x = 1;')
				}),
				new File({
					path: 'test/fixtures/undeclared.js',
					contents: Buffer.from('x = 0;')
				})
			];
			const testStream = util.transform((file, enc, cb) => {
				should.exist(file);
				should.exist(cb);
				count += 1;
				cb();
			}, cb => {
				should.exist(cb);
				count.should.equal(files.length);
				testStream._writableState.ending.should.equal(true);
				finalCount = count;
				cb();
			})
			.on('error', done)
			.on('finish', () => {
				finalCount.should.equal(files.length);
				done();
			});

			files.forEach(file => testStream.write(file));

			testStream.end();

		});

	});

	describe('createIgnoreResult', () => {
		it('should create a warning that the file is ignored by ".eslintignore"', () => {
			const file = new File({
				path: 'test/fixtures/ignored.js',
				contents: Buffer.from('')
			});
			const result = util.createIgnoreResult(file);
			should.exist(result);
			result.filePath.should.equal(file.path);
			result.errorCount.should.equal(0);
			result.warningCount.should.equal(1);
			result.messages.should.be.instanceof(Array).and.have.lengthOf(1);
			result.messages[0].message.should.equal('File ignored because of .eslintignore file');

		});

		it('should create a warning for paths that include "node_modules"', () => {
			const file = new File({
				path: 'node_modules/test/index.js',
				contents: Buffer.from('')
			});
			const result = util.createIgnoreResult(file);
			should.exist(result);
			result.filePath.should.equal(file.path);
			result.errorCount.should.equal(0);
			result.warningCount.should.equal(1);
			result.messages.should.be.instanceof(Array).and.have.lengthOf(1);
			result.messages[0].message.should.equal(
				'File ignored because it has a node_modules/** path'
			);

		});

	});

	describe('migrateOptions', () => {
		it('should migrate a string config value to "configPath"', () => {
			const options = util.migrateOptions('Config/Path');
			should.exist(options.configFile);
			options.configFile.should.equal('Config/Path');
		});
	});

	describe('isErrorMessage', () => {

		it('should determine severity a "fatal" message flag', () => {
			const errorMessage = {
				fatal: true,
				severity: 0
			};
			const isError = util.isErrorMessage(errorMessage);
			isError.should.equal(true);

		});

		it('should determine severity from an config array', () => {
			const errorMessage = {
				severity: [2, 1]
			};
			const isError = util.isErrorMessage(errorMessage);
			isError.should.equal(true);

		});

	});

	describe('filterResult', () => {

		const result = {
			filePath: 'test/fixtures/invalid.js',
			messages: [{
				ruleId: 'error',
				severity: 2,
				message: 'This is an error.',
				line: 1,
				column: 1,
				nodeType: 'FunctionDeclaration',
				source: 'function a() { x = 0; }'
			},{
				ruleId: 'warning',
				severity: 1,
				message: 'This is a warning.',
				line: 1,
				column: 1,
				nodeType: 'FunctionDeclaration',
				source: 'function a() { x = 0; }'
			}],
			errorCount: 1,
			warningCount: 1
		};

		it('should filter messages', () => {
			function warningsOnly(message) {
				return message.severity === 1;
			}
			const quietResult = util.filterResult(result, warningsOnly);
			quietResult.filePath.should.equal('test/fixtures/invalid.js');
			quietResult.messages.should.be.instanceof(Array).and.have.lengthOf(1);
			quietResult.errorCount.should.equal(0);
			quietResult.warningCount.should.equal(1);
		});

		it('should remove warning messages', () => {
			const quietResult = util.filterResult(result, true);
			quietResult.filePath.should.equal('test/fixtures/invalid.js');
			quietResult.messages.should.be.instanceof(Array).and.have.lengthOf(1);
			quietResult.errorCount.should.equal(1);
			quietResult.warningCount.should.equal(0);
		});

	});

	describe('resolveFormatter', () => {

		it('should default to the "stylish" formatter', () => {

			const formatter = util.resolveFormatter();
			formatter.should.equal(require('eslint/lib/cli-engine/formatters/stylish'));

		});

		it('should resolve a formatter', () => {

			const formatter = util.resolveFormatter('tap');
			formatter.should.equal(require('eslint/lib/cli-engine/formatters/tap'));

		});

		it('should throw an error if a formatter cannot be resolved', () => {

			function resolveMissingFormatter() {
				util.resolveFormatter('missing-formatter');
			}
			resolveMissingFormatter.should.throw(Error, {
				message: /There was a problem loading formatter/
			});

		});

	});

	describe('resolveWritable', () => {

		it('should default to fancyLog', () => {

			const write = util.resolveWritable();
			write.should.equal(require('fancy-log'));

		});

		it('should write to a (writable) stream', function(done) {

			let written = false;
			const writable = new stream.Writable({objectMode: true});
			const testValue = 'Formatted Output';
			const write = util.resolveWritable(writable);

			writable._write = function writeChunk(chunk, encoding, cb) {
				should.exist(chunk);
				chunk.should.equal(testValue);
				written = true;
				cb();
			};

			writable
			.on('error', done)
			.on('finish', () => {
				written.should.equal(true);
				done();
			});
			write(testValue);
			writable.end();

		});

	});

	describe('writeResults', () => {

		const testConfig = {},
			testResult = {
				config: testConfig
			},
			testResults = [testResult];

		it('should pass the value returned from the formatter to the writer', () => {

			const testValue = {};

			function testFormatter(results, config) {
				should.exist(results);
				results.should.equal(testResults);
				should.exist(config);
				config.should.equal(testConfig);

				return testValue;
			}

			function testWriter(value) {
				should.exist(value);
				value.should.equal(testValue);
			}

			util.writeResults(testResults, testFormatter, testWriter);

		});

		it('should not write an empty or missing value', () => {

			function testFormatter(results, config) {
				should.exist(results);
				results.should.equal(testResults);
				should.exist(config);
				config.should.equal(testConfig);

				return '';
			}

			function testWriter(value) {
				should.not.exist(value);
			}

			util.writeResults(testResults, testFormatter, testWriter);

		});

		it('should default undefined results to an empty array', () => {

			function testFormatter(results, config) {
				should.exist(results);
				results.should.be.instanceof(Array).and.have.lengthOf(0);
				should.exist(config);

				return results.length + ' results';
			}

			function testWriter(value) {
				should.exist(value);
				value.should.equal('0 results');
			}

			util.writeResults(null, testFormatter, testWriter);

		});

	});

});
