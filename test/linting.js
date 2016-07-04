/* global describe, it*/
'use strict';

const path = require('path');
const stream = require('stream');
const eslint = require('..');
const File = require('vinyl');
const from2string = require('from2-string');
const should = require('should');
const BufferStreams = require('bufferstreams');

require('mocha');

describe('gulp-eslint plugin', () => {
	it('should configure an alternate parser', done => {
		eslint({
			parser: 'babel-eslint',
			useEslintrc: false,
			rules: {'prefer-template': 'error'}
		})
		.on('error', done)
		.on('data', file => {
			should.exist(file);
			should.exist(file.contents);
			should.exist(file.eslint);
			file.eslint.should.have.property('filePath', path.resolve('test/fixtures/stage0-class-property.js'));

			file.eslint.messages
			.should.be.instanceof(Array)
			.and.have.lengthOf(1);

			file.eslint.messages[0]
			.should.have.properties('message', 'line', 'column')
			.and.have.property('ruleId', 'prefer-template');

			done();
		})
		.end(new File({
			path: 'test/fixtures/stage0-class-property.js',
			contents: new Buffer('class MyClass {prop = a + "b" + c;}')
		}));
	});

	it('should support sharable config', done => {
		eslint(path.resolve(__dirname, 'fixtures/eslintrc-sharable-config.js'))
		.on('error', done)
		.on('data', file => {
			should.exist(file);
			should.exist(file.contents);
			should.exist(file.eslint);

			file.eslint.messages
			.should.be.instanceof(Array)
			.and.have.lengthOf(1);

			file.eslint.messages[0]
			.should.have.properties('message', 'line', 'column')
			.and.have.property('ruleId', 'eol-last');

			done();
		})
		.end(new File({
			path: 'test/fixtures/no-newline.js',
			contents: new Buffer('console.log(\'Hi\');')
		}));
	});

	it('should produce expected message via buffer', done => {
		eslint({useEslintrc: false, rules: {strict: [2, 'global']}})
		.on('error', done)
		.on('data', file => {
			should.exist(file);
			should.exist(file.contents);
			should.exist(file.eslint);
			file.eslint.should.have.property('filePath', path.resolve('test/fixtures/use-strict.js'));

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

	it('should produce expected message upon stream completion', done => {
		eslint({useEslintrc: false, rules: {strict: [2, 'global']}})
		.on('error', done)
		.on('data', file => {
			should.exist(file);
			should.ok(file.isStream());

			file.contents
			.on('error', done)
			.on('data', () => {
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
			contents: from2string('(function () { void 0; })();')
		}));
	});

	it('should lint multiple streaming files', done => {
		let fileCount = 0;

		const lintStream = eslint({useEslintrc: false, rules: {strict: [2, 'global']}})
		.on('error', done)
		.on('data', file => {
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
		.on('finish', () => {
			fileCount.should.equal(2);
			done();
		});

		lintStream.write(new File({
			path: 'test/fixtures/use-strict.js',
			contents: from2string('(function () { void 0; })();')
		}));
		lintStream.write(new File({
			path: 'test/fixtures/use-strict.js',
			contents: from2string('(function () { void 0; })();')
		}));

		lintStream.end();
	});

	it('should ignore files with null content', done => {
		eslint({useEslintrc: false, rules: {'strict': 2}})
		.on('error', done)
		.on('data', file => {
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

	describe('"warnFileIgnored" option', () => {

		it('when true, should warn when a file is ignored by .eslintignore', done => {
			eslint({useEslintrc: false, warnFileIgnored: true})
			.on('error', done)
			.on('data', file => {
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

		it('when true, should warn when a "node_modules" file is ignored', done => {
			eslint({useEslintrc: false, warnFileIgnored: true})
			.on('error', done)
			.on('data', file => {
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

		it('when not true, should silently ignore files', done => {
			eslint({useEslintrc: false, warnFileIgnored: false})
			.on('error', done)
			.on('data', file => {
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

	describe('"quiet" option', () => {

		it('when true, should remove warnings', done => {
			eslint({quiet: true, useEslintrc: false, rules: {'no-undef': 1, 'strict': 2}})
			.on('data', file => {
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

		it('when a function, should filter messages', done => {
			function warningsOnly(message) {
				return message.severity === 1;
			}
			eslint({quiet: warningsOnly, useEslintrc: false, rules: {'no-undef': 1, 'strict': 2}})
			.on('data', file => {
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

	describe('"fix" option', () => {

		it('when true, should update buffered contents', done => {
			eslint({fix: true, useEslintrc: false, rules: {'no-trailing-spaces': 2}})
			.on('error', done)
			.on('data', (file) => {
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

		it('when true, should update stream contents', done => {
			eslint({fix: true, useEslintrc: false, rules: {'no-trailing-spaces': 2}})
			.on('error', done)
			.on('data', (file) => {
				should.exist(file);
				should.exist(file.eslint);
				file.eslint.messages.should.be.instanceof(Array).and.have.lengthOf(0);
				file.eslint.errorCount.should.equal(0);
				file.eslint.warningCount.should.equal(0);
				file.eslint.output.should.equal('var x = 0;;');
				file.contents = file.contents.pipe(new BufferStreams((err, buf, cb) => {
					cb(err, buf);
					buf.toString().should.equal('var x = 0;;');
					done();
				}));

			})
			.end(new File({
				path: 'test/fixtures/fixable.js',
				contents: from2string('var x = 0;;  ')
			}));
		});

	});

});
