/* global describe, it, afterEach */
'use strict';

var File = require('vinyl'),
	stream = require('stream'),
	should = require('should'),
	util = require('../util');

require('mocha');

describe('utility methods', function() {

	describe('transform', function() {

		it('should handle files in a stream', function(done) {

			var passedFile = false,
				streamFile = new File({
					path: 'test/fixtures/invalid.js',
					contents: new Buffer('x = 1;')
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
						contents: new Buffer('x = 1;')
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

	describe('createIgnoreResult', function() {

		it('should create a warning that the file is ignored by ".eslintignore"', function() {

			var file = new File({
				path: 'test/fixtures/ignored.js',
				contents: new Buffer('')
			});
			var result = util.createIgnoreResult(file);
			should.exist(result);
			result.filePath.should.equal(file.path);
			result.errorCount.should.equal(0);
			result.warningCount.should.equal(1);
			result.messages.should.be.instanceof(Array).and.have.lengthOf(1);
			result.messages[0].message.should.equal('File ignored because of .eslintignore file');

		});

		it('should create a warning for paths that include "node_modules"', function() {

			var file = new File({
				path: 'node_modules/test/index.js',
				contents: new Buffer('')
			});
			var result = util.createIgnoreResult(file);
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
			should.exist(options);
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
			should.exist(options);
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
			should.exist(options);
			should.exist(options.envs);
			options.envs.should.be.instanceof(Array).and.have.lengthOf(1);
			options.envs[0].should.equal('browser');

		});

		it('should migrate a "rulesdir" string to a "rulesPaths" array', function() {

			var options = util.migrateOptions({
				rulesdir: 'Rules/Dir'
			});
			should.exist(options);
			should.exist(options.rulePaths);
			options.rulePaths.should.be.instanceof(Array).and.have.lengthOf(1);
			options.rulePaths[0].should.equal('Rules/Dir');

		});

		it('should migrate a "rulesdir" value to a "rulesPaths" value', function() {

			var rulePaths = ['Rules/Dir'],
				options = util.migrateOptions({
					rulesdir: rulePaths
				});
			should.exist(options);
			should.exist(options.rulePaths);
			options.rulePaths.should.equal(rulePaths);

		});

		it('should migrate an "eslintrc" value to "useEslintrc"', function() {

			var options = util.migrateOptions({
				eslintrc: true
			});
			should.exist(options);
			should.exist(options.useEslintrc);
			options.useEslintrc.should.equal(true);

		});

		it('should migrate an "extends" value to "baseConfig" (w/o baseConfig)', function() {

			var options = util.migrateOptions({
				extends: 'eslint:recommended'
			});
			should.exist(options);
			should.exist(options.baseConfig);
			options.baseConfig.extends.should.equal('eslint:recommended');

		});

		it('should migrate an "extends" value to "baseConfig" (w/ baseConfig)', function() {

			var options = util.migrateOptions({
				extends: 'eslint:recommended',
				baseConfig: {
					parser: 'babel-eslint'
				}
			});
			should.exist(options);
			should.exist(options.baseConfig);
			options.baseConfig.extends.should.equal('eslint:recommended');
			options.baseConfig.parser.should.equal('babel-eslint');

		});

		it('should migrate an "ecmaFeatures" value to "baseConfig"', function() {

			var options = util.migrateOptions({
				ecmaFeatures: {
					templateStrings: true
				}
			});
			should.exist(options);
			should.exist(options.baseConfig);
			should.exist(options.baseConfig.ecmaFeatures);
			options.baseConfig.ecmaFeatures.templateStrings.should.equal(true);

		});

		it('should migrate "globals" to "baseConfig" in key-value format', function() {

			var options = util.migrateOptions({
				// trigger migration to baseConfig
				ecmaFeatures: {},

				// add global "token" identifier
				globals: {
					token: true
				}
			});

			should.exist(options.baseConfig);
			should.exist(options.baseConfig.globals);
			options.baseConfig.globals.token.should.equal(true);
			should.exist(options.baseConfig.ecmaFeatures);

			should.exist(options.globals);
			options.globals.should.be.instanceof(Array).and.have.lengthOf(1);
			options.globals[0].should.equal('token:true');

		});

		it('should migrate "envs" to "baseConfig" in key-value format', function() {

			var options = util.migrateOptions({
				// trigger migration to baseConfig
				ecmaFeatures: {},

				// use "browser" env
				envs: {
					browser: true
				}
			});

			should.exist(options.baseConfig);
			should.exist(options.baseConfig.envs);
			options.baseConfig.envs.browser.should.equal(true);
			should.exist(options.baseConfig.ecmaFeatures);

			should.exist(options.envs);
			options.envs.should.be.instanceof(Array).and.have.lengthOf(1);
			options.envs[0].should.equal('browser');

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

	describe('filterResult', function() {

		var result = {
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

		it('should filter messages', function() {
			function warningsOnly(message) {
				return message.severity === 1;
			}
			var quietResult = util.filterResult(result, warningsOnly);
			quietResult.filePath.should.equal('test/fixtures/invalid.js');
			quietResult.messages.should.be.instanceof(Array).and.have.lengthOf(1);
			quietResult.errorCount.should.equal(0);
			quietResult.warningCount.should.equal(1);
		});

		it('should remove warning messages', function() {
			var quietResult = util.filterResult(result, true);
			quietResult.filePath.should.equal('test/fixtures/invalid.js');
			quietResult.messages.should.be.instanceof(Array).and.have.lengthOf(1);
			quietResult.errorCount.should.equal(1);
			quietResult.warningCount.should.equal(0);
		});

	});

	describe('resolveFormatter', function() {

		it('should default to the "stylish" formatter', function() {

			var formatter = util.resolveFormatter();
			formatter.should.equal(require('eslint/lib/formatters/stylish'));

		});

		it('should resolve a formatter', function() {

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
