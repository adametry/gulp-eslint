/*global describe, it*/
'use strict';

var fs = require('fs'),
	File = require('vinyl'),
	through = require('through'),
	should = require('should'),
	eslint = require('../');

require('mocha');

describe('Gulp eslint plugin', function() {

	it('should produce expected message via buffer', function(done) {
		eslint()
		.on('error', done)
		.on('data', function(file) {
			should.exist(file);
			should.exist(file.contents);
			should.exist(file.eslint);
			file.eslint.should.have.property('filePath', 'test/fixtures/use-strict.js');

			var messages = file.eslint.messages;
			messages.should.be.instanceof(Array).and.have.lengthOf(1);

			var message = file.eslint.messages[0];
			message.should.have.properties('message', 'line', 'column')
				.and.have.property('ruleId', 'strict');

			done();
		})
		.end(new File({
			path: 'test/fixtures/use-strict.js',
			contents: new Buffer('(function() {\n\n\tvoid 0;\n\n}());\n\n')
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

		var stream = eslint()
		.on('error', done)
		.on('data', function(file) {
			should.exist(file);
			should.ok(file.isStream());

			file.contents.pipe(through(function() {}, function() {
				should.exist(file.eslint);

				file.eslint.messages.should.be.instanceof(Array).and.have.lengthOf(1);
				file.eslint.messages[0]
				.should.have.properties('message', 'line', 'column')
				.and.have.property('ruleId', 'strict');

				fileCount++;
			}));
		})
		.on('end', function() {
			process.nextTick(function() {
				fileCount.should.equal(2);
				done();
			});
		});

		stream.write(new File({
			path: 'test/fixtures/use-strict.js',
			contents: fs.createReadStream('test/fixtures/use-strict.js')
		}));
		stream.write(new File({
			path: 'test/fixtures/use-strict.js',
			contents: fs.createReadStream('test/fixtures/use-strict.js')
		}));
		stream.end();
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
