/* global describe, it*/
'use strict';

var fs = require('fs'),
	path = require('path'),
	eslint = require('../'),
	stream = require('stream'),
	File = require('vinyl'),
	should = require('should'),
	BufferStreams = require('bufferstreams');

require('mocha');

describe('gulp-eslint plugin', function() {

	it('should configure an alternate parser', function(done) {
		eslint({
			parser: 'babel-eslint',
			useEslintrc: false,
			rules: {'arrow-parens': 2}
		})
		.on('error', done)
		.on('data', function(file) {
			should.exist(file);
			should.exist(file.contents);
			should.exist(file.eslint);
			var filePath = path.normalize('test/fixtures/es6.js');
			file.eslint.should.have.property('filePath', filePath);

			file.eslint.messages
			.should.be.instanceof(Array)
			.and.have.lengthOf(1);

			file.eslint.messages[0]
			.should.have.properties('message', 'line', 'column')
			.and.have.property('ruleId', 'arrow-parens');

			done();
		})
		.end(new File({
			path: 'test/fixtures/es6.js',
			contents: new Buffer('(a=>`${a}b`)("a");')
		}));
	});

	it('should produce expected message via buffer', function(done) {
		eslint({useEslintrc: false, rules: {strict: [2, 'global']}})
		.on('error', done)
		.on('data', function(file) {
			should.exist(file);
			should.exist(file.contents);
			should.exist(file.eslint);
			var filePath = path.normalize('test/fixtures/use-strict.js');
			file.eslint.should.have.property('filePath', filePath);

			file.eslint.messages
			.should.be.instanceof(Array)
			.and.have.lengthOf(1);

			file.eslint.messages[0]
			.should.have.properties('message', 'line', 'column')
			.and.have.property('ruleId', 'strict');

			done();
		})
		.end(new File({
			path: 'test/fixtures/use-strict.js',
			contents: new Buffer('var x = 1;')
		}));
	});

	it('should produce expected message upon stream completion', function(done) {
		eslint({useEslintrc: false, rules: {strict: [2, 'global']}})
		.on('error', done)
		.on('data', function(file) {
			should.exist(file);
			should.ok(file.isStream());

			file.contents
			.on('error', done)
			.on('data', function() {
				should.exist(file.eslint);

				file.eslint.messages
				.should.be.instanceof(Array)
				.and.have.lengthOf(1);

				file.eslint.messages[0]
				.should.have.properties('message', 'line', 'column')
				.and.have.property('ruleId', 'strict');

				done();
			});
		})
		.end(new File({
			cwd: 'test/',
			base: 'test/fixtures',
			path: 'test/fixtures/use-strict.js',
			contents: fs.createReadStream('test/fixtures/use-strict.js')
		}));
	});

	it('should lint multiple streaming files', function(done) {
		var fileCount = 0;

		var lintStream = eslint({useEslintrc: false, rules: {strict: [2, 'global']}})
		.on('error', done)
		.on('data', function(file) {
			should.exist(file);
			should.ok(file.isStream());

			should.exist(file.contents);
			should.ok(file.contents.readable);

			should.exist(file.eslint);
			file.eslint.messages.should.be.instanceof(Array).and.have.lengthOf(1);
			file.eslint.messages[0]
			.should.have.properties('message', 'line', 'column')
			.and.have.property('ruleId', 'strict');

			fileCount++;
		});

		lintStream.pipe(new stream.PassThrough({objectMode: true}))
		.on('finish', function() {
			fileCount.should.equal(2);
			done();
		});

		lintStream.write(new File({
			path: 'test/fixtures/use-strict.js',
			contents: fs.createReadStream('test/fixtures/use-strict.js')
		}));
		lintStream.write(new File({
			path: 'test/fixtures/use-strict.js',
			contents: fs.createReadStream('test/fixtures/use-strict.js')
		}));

		lintStream.end();
	});

	it('should ignore files with null content', function(done) {
		eslint({useEslintrc: false, rules: {'strict': 2}})
		.on('error', done)
		.on('data', function(file) {
			should.exist(file);
			should.not.exist(file.contents);
			should.not.exist(file.eslint);
			done();
		})
		.end(new File({
			path: 'test/fixtures',
			isDirectory: true
		}));
	});

	describe('"warnFileIgnored" option', function() {

		it('when true, should warn when a file is ignored by .eslintignore', function(done) {
			eslint({useEslintrc: false, warnFileIgnored: true})
			.on('error', done)
			.on('data', function(file) {
				should.exist(file);
				should.exist(file.eslint);
				file.eslint.messages.should.be.instanceof(Array).and.have.lengthOf(1);
				file.eslint.messages[0]
				.should.have.property('message', 'File ignored because of .eslintignore file');
				file.eslint.errorCount.should.equal(0);
				file.eslint.warningCount.should.equal(1);
				done();
			})
			.end(new File({
				path: 'test/fixtures/ignored.js',
				contents: new Buffer('(function () {ignore = abc;}});')
			}));
		});

		it('when true, should warn when a "node_modules" file is ignored', function(done) {
			eslint({useEslintrc: false, warnFileIgnored: true})
			.on('error', done)
			.on('data', function(file) {
				should.exist(file);
				should.exist(file.eslint);
				file.eslint.messages.should.be.instanceof(Array).and.have.lengthOf(1);
				file.eslint.messages[0].should.have.property('message',
					'File ignored because it has a node_modules/** path');
				file.eslint.errorCount.should.equal(0);
				file.eslint.warningCount.should.equal(1);
				done();
			})
			.end(new File({
				path: 'node_modules/test/index.js',
				contents: new Buffer('(function () {ignore = abc;}});')
			}));
		});

		it('when not true, should silently ignore files', function(done) {
			eslint({useEslintrc: false, warnFileIgnored: false})
			.on('error', done)
			.on('data', function(file) {
				should.exist(file);
				should.not.exist(file.eslint);
				done();
			})
			.end(new File({
				path: 'test/fixtures/ignored.js',
				contents: new Buffer('(function () {ignore = abc;}});')
			}));
		});

	});

	describe('"quiet" option', function() {

		it('when true, should remove warnings', function(done) {
			eslint({quiet: true, useEslintrc: false, rules: {'no-undef': 1, 'strict': 2}})
			.on('data', function(file) {
				should.exist(file);
				should.exist(file.eslint);
				file.eslint.messages.should.be.instanceof(Array).and.have.lengthOf(1);
				file.eslint.errorCount.should.equal(1);
				file.eslint.warningCount.should.equal(0);
				done();
			})
			.end(new File({
				path: 'test/fixtures/invalid.js',
				contents: new Buffer('function z() { x = 0; }')
			}));
		});

		it('when a function, should filter messages', function(done) {
			function warningsOnly(message) {
				return message.severity === 1;
			}
			eslint({quiet: warningsOnly, useEslintrc: false, rules: {'no-undef': 1, 'strict': 2}})
			.on('data', function(file) {
				should.exist(file);
				should.exist(file.eslint);
				file.eslint.messages.should.be.instanceof(Array).and.have.lengthOf(1);
				file.eslint.errorCount.should.equal(0);
				file.eslint.warningCount.should.equal(1);
				done();
			})
			.end(new File({
				path: 'test/fixtures/invalid.js',
				contents: new Buffer('function z() { x = 0; }')
			}));
		});

	});

	describe('"fix" option', function() {

		it('when true, should update buffered contents', function(done) {
			eslint({fix: true, useEslintrc: false, rules: {'no-trailing-spaces': 2}})
			.on('error', done)
			.on('data', function(file) {
				should.exist(file);
				should.exist(file.eslint);
				file.eslint.messages.should.be.instanceof(Array).and.have.lengthOf(0);
				file.eslint.errorCount.should.equal(0);
				file.eslint.warningCount.should.equal(0);
				file.eslint.output.should.equal('var x = 0;');
				file.contents.toString().should.equal('var x = 0;');
				done();
			})
			.end(new File({
				path: 'test/fixtures/fixable.js',
				contents: new Buffer('var x = 0; ')
			}));
		});

		it('when true, should update stream contents', function(done) {
			eslint({fix: true, useEslintrc: false, rules: {'no-trailing-spaces': 2}})
			.on('error', done)
			.on('data', function(file) {
				should.exist(file);
				should.exist(file.eslint);
				file.eslint.messages.should.be.instanceof(Array).and.have.lengthOf(0);
				file.eslint.errorCount.should.equal(0);
				file.eslint.warningCount.should.equal(0);
				file.eslint.output.should.equal('var x = 0;;');
				file.contents = file.contents.pipe(new BufferStreams(function(err, buf, cb) {
					cb(err, buf);
					buf.toString().should.equal('var x = 0;;');
					done();
				}));

			})
			.end(new File({
				path: 'test/fixtures/fixable.js',
				contents: fs.createReadStream('test/fixtures/fixable.js')
			}));
		});

	});

});
