/*global describe, it*/
'use strict';

var fs = require('fs');
var eslint = require('../');
var stream = require('stream');
var File = require('vinyl');
var should = require('should');
var through = require('through2');

require('mocha');

describe('Gulp eslint plugin', function() {

	it('should produce expected message via buffer', function(done) {
		eslint({
			configFile: 'test/fixtures/.eslintrc-babel',
			globals: {
				'$': true
			}
		})
		.on('error', done)
		.on('data', function(file) {
			should.exist(file);
			should.exist(file.contents);
			should.exist(file.eslint);
			file.eslint.should.have.property('filePath', 'test/fixtures/use-strict.js');

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
			contents: new Buffer('(() => { $.fn.foo = (a) => `${a}b`; }());')
		}));
	});

	it('should produce expected message upon stream completion', function(done) {
		eslint()
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

		var lintStream = eslint()
		.on('error', done)
		.on('data', function(file) {
			should.exist(file);
			should.ok(file.isStream());

			file.contents.pipe(through(function() {
				should.exist(file.eslint);

				file.eslint.messages.should.be.instanceof(Array).and.have.lengthOf(1);
				file.eslint.messages[0]
				.should.have.properties('message', 'line', 'column')
				.and.have.property('ruleId', 'strict');

				fileCount++;
			}));
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
		eslint()
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
});
