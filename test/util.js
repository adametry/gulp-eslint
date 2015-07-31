/* global describe, it, afterEach */
'use strict';

var File = require('vinyl'),
	path = require('path'),
	stream = require('stream'),
	should = require('should'),
	CLIEngine = require('eslint').CLIEngine,
	util = require('../util');

require('mocha');

describe('utility methods', function() {

	describe('transform', function() {

		it('should handle files in a stream', function(done) {

			var passedFile = false,
				streamFile = new File({
					path: 'test/fixtures/invalid.js',
					contents: new Buffer('document = "abuse read-only value";')
				}),
				testStream = util.transform(function(file, enc, cb) {
					should.exist(file);
					should.exist(cb);
					passedFile = (streamFile === file);
					cb();
				})
				.on('error', done)
				.on('finish', function() {
					passedFile.should.equal(true);
					done();
				});

			testStream.end(streamFile);

		});

		it('should flush when stream is ending', function(done) {

			var count = 0,
				finalCount = 0,
				files = [
					new File({
						path: 'test/fixtures/invalid.js',
						contents: new Buffer('document = "abuse read-only value";')
					}),
					new File({
						path: 'test/fixtures/undeclared.js',
						contents: new Buffer('x = 0;')
					})
				],
				testStream = util.transform(function(file, enc, cb) {
					should.exist(file);
					should.exist(cb);
					count += 1;
					cb();
				}, function(cb) {
					should.exist(cb);
					count.should.equal(files.length);
					testStream._writableState.ending.should.equal(true);
					finalCount = count;
					cb();
				})
				.on('error', done)
				.on('finish', function() {
					finalCount.should.equal(files.length);
					done();
				});

			files.forEach(function(file) {
				testStream.write(file);
			});

			testStream.end();

		});

	});

	describe('isPathIgnored', function() {

		it('should return false if "ignore" option is not defined or truthy', function(done) {
			var stubFile = {
				path: ''
			};
			var result = util.isPathIgnored(stubFile, {});
			result.should.equal(false);

			done();
		});

		it('should resolve the ignorePath if not defined', function(done) {
			var stubFile = {
				path: null
			};
			var result = util.isPathIgnored(stubFile, {
				ignore: true
			});
			result.should.equal(false);

			done();
		});

		it('should ignore paths defined in .eslintignore files', function(done) {
			var stubFile = {
				path: path.resolve(__dirname, './fixtures/ignore-this-file.js')
			};
			var result = util.isPathIgnored(stubFile, {
				ignore: true,
				ignorePath: path.resolve(__dirname, './fixtures/.eslintignore')
			});
			result.should.equal(true);

			done();
		});

		it('should resolve to the cwd if the ignorePath is empty', function(done) {
			var stubFile = {
				path: null
			};
			var result = util.isPathIgnored(stubFile, {
				ignore: true,
				ignorePath: ''
			});
			result.should.equal(false);

			done();
		});

	});

	describe('migrateOptions', function() {

		it('should migrate a string config value to "configPath"', function() {

			var options = util.migrateOptions('Config/Path');
			should.exist(options.configFile);
			options.configFile.should.equal('Config/Path');

		});

		it('should migrate a "config" value to "configPath"', function() {

			var options = util.migrateOptions({
				config: 'Config/Path'
			});
			should.exist(options.configFile);
			options.configFile.should.equal('Config/Path');

		});

		it('should convert a global(s) table to a list of set of CLI flags', function() {

			var options = util.migrateOptions({
				globals: {
					a: false,
					b: true
				}
			});
			should.exist(options.globals);
			options.globals.should.be.instanceof(Array).and.have.lengthOf(2);
			options.globals[0].should.equal('a');
			options.globals[1].should.equal('b:true');

		});

		it('should convert a env table to a list of active env keys', function() {

			var options = util.migrateOptions({
				envs: {
					node: false,
					browser: true
				}
			});
			should.exist(options.envs);
			options.envs.should.be.instanceof(Array).and.have.lengthOf(1);
			options.envs[0].should.equal('browser');

		});

		it('should migrate a "rulesdir" string to a "rulesPaths" array', function() {

			var options = util.migrateOptions({
				rulesdir: 'Rules/Dir'
			});
			should.exist(options.rulePaths);
			options.rulePaths.should.be.instanceof(Array).and.have.lengthOf(1);
			options.rulePaths[0].should.equal('Rules/Dir');

		});

		it('should migrate a "rulesdir" value to a "rulesPaths" value', function() {

			var rulePaths = ['Rules/Dir'],
				options = util.migrateOptions({
					rulesdir: rulePaths
				});
			should.exist(options.rulePaths);
			options.rulePaths.should.equal(rulePaths);

		});

		it('should migrate an "eslintrc" value to "useEslintrc"', function() {

			var options = util.migrateOptions({
				eslintrc: true
			});
			should.exist(options.useEslintrc);
			options.useEslintrc.should.equal(true);

		});

	});

	describe('isErrorMessage', function() {

		it('should determine severity a "fatal" message flag', function() {
			var errorMessage = {
				fatal: true,
				severity: 0
			};
			var isError = util.isErrorMessage(errorMessage);
			isError.should.equal(true);

		});

		it('should determine severity from an config array', function() {
			var errorMessage = {
				severity: [2, 1]
			};
			var isError = util.isErrorMessage(errorMessage);
			isError.should.equal(true);

		});

	});

	describe('resolveFormatter', function() {

		it('should default to the "stylish" formatter', function() {

			var formatter = util.resolveFormatter();
			formatter.should.equal(require('eslint/lib/formatters/stylish'));

		});

		it('should resolve a formatter (via eslint\'s CLIEngine)', function() {

			var formatter = util.resolveFormatter('tap');
			formatter.should.equal(require('eslint/lib/formatters/tap'));

		});

		it('should throw an error if a formatter cannot be resolved', function() {

			function resolveMissingFormatter() {
				util.resolveFormatter('missing-formatter');
			}
			resolveMissingFormatter.should.throw(TypeError, {message: 'Invalid Formatter'});

		});

	});

	describe('resolveWritable', function() {

		it('should default to gutil.log', function() {

			var write = util.resolveWritable();
			write.should.equal(require('gulp-util').log);

		});

		it('should write to a (writable) stream', function(done) {

			var written = false,
				writable = new stream.Writable({objectMode: true}),
				testValue = 'Formatted Output',
				write = util.resolveWritable(writable);

			writable._write = function writeChunk(chunk, encoding, cb) {
				should.exist(chunk);
				chunk.should.equal(testValue);
				written = true;
				cb();
			};

			writable
			.on('error', done)
			.on('finish', function() {
				written.should.equal(true);
				done();
			});
			write(testValue);
			writable.end();

		});

	});

	describe('writeResults', function() {

		var testConfig = {},
			testResult = {
				config: testConfig
			},
			testResults = [testResult];

		it('should pass the value returned from the formatter to the writer', function() {

			var testValue = {};

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

		it('should not write an empty or missing value', function() {

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

		it('should default undefined results to an empty array', function() {

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
