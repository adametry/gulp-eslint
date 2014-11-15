/*global describe, it*/
"use strict";

var fs = require("fs"),
	through = require("through"),
	should = require("should"),
	gutil = require("gulp-util"),
	eslint = require("../"),
	noop = function () {};

require("mocha");

describe("Gulp eslint plugin", function () {

	it("should produce expected message via buffer", function (done) {

		var srcFile = new gutil.File({
				cwd:  "test/",
				base: "test/fixtures",
				path: "test/fixtures/use-strict.js",
				contents: new Buffer("(function () {\n\n\tvoid 0;\n\n}());\n\n")
			});

		var stream = eslint();

		stream.on("error", function(error) {
			should.exist(error);
			done(error);
		});

		stream.on("data", function (file) {

			should.exist(file);
			should.exist(file.contents);
			should.exist(file.eslint);
			file.eslint.should.have.property('filePath', srcFile.path);

			var messages = file.eslint.messages;
			messages.should.be.instanceof(Array).and.have.lengthOf(1);

			var message = file.eslint.messages[0];
			message.should.have.properties('message','line','column')
				.and.have.property('ruleId', 'strict');

			done();
		});

		stream.write(srcFile);
		stream.end();
	});

	it("should produce expected message upon stream completion", function (done) {

		var srcFile = new gutil.File({
				cwd:  "test/",
				base: "test/fixtures",
				path: "test/fixtures/use-strict.js",
				contents: fs.createReadStream("test/fixtures/use-strict.js")
			});

		var stream = eslint();

		stream.on("error", function(error) {
			should.exist(error);
			done(error);
		});

		stream.on("data", function (file) {

			should.exist(file);
			should.exist(file.contents);
			should.exist(file.contents.pipe);

			file.contents.pipe(through(noop, function(err) {
				should.not.exist(err);
				should.exist(file.eslint);

				var messages = file.eslint.messages;
				messages.should.be.instanceof(Array).and.have.lengthOf(1);

				var message = file.eslint.messages[0];
				message.should.have.properties('message','line','column')
					.and.have.property('ruleId', 'strict');

				done();
			}));
		});

		stream.write(srcFile);
		stream.end();
	});

	it("should lint multiple streaming files", function (done) {

		var fileCount = 0,
			files = [
				new gutil.File({
					cwd:  "test/",
					base: "test/fixtures",
					path: "test/fixtures/use-strict.js",
					contents: fs.createReadStream("test/fixtures/use-strict.js")
				}),
				new gutil.File({
					cwd:  "test/",
					base: "test/fixtures",
					path: "test/fixtures/use-strict.js",
					contents: fs.createReadStream("test/fixtures/use-strict.js")
				})
			];

		var stream = eslint();

		stream.on("error", function(error) {
			should.exist(error);
			done(error);

		}).on("data", function (file) {
			should.exist(file);
			should.exist(file.contents);
			should.exist(file.contents.pipe);

			file.contents.pipe(through(noop, function() {
				should.exist(file.eslint);

				var messages = file.eslint.messages;
				messages.should.be.instanceof(Array).and.have.lengthOf(1);

				var message = file.eslint.messages[0];
				message.should.have.properties('message','line','column')
					.and.have.property('ruleId', 'strict');

				fileCount++;
			}));

		}).on('end', function () {
			process.nextTick(function () {
				fileCount.should.equal(files.length);
				done();
			});

		});

		files.forEach(stream.write);
		stream.end();
	});

	it("should ignore files with null content", function (done) {

		var srcFile = new gutil.File({
				cwd:  "test/",
				base: "test/fixtures",
				path: "test/fixtures",
				isDirectory: true
			});

		var stream = eslint();

		stream.on("error", function(error) {
			should.exist(error);
			done(error);
		});

		stream.on("data", function (file) {
			should.exist(file);
			should.not.exist(file.contents);
			should.not.exist(file.eslint);
			done();
		});

		stream.write(srcFile);
		stream.end();
	});

	it("should throw error if file does not exist", function (done) {

		var srcFile = new gutil.File({
				cwd:  "test/",
				base: "test/fixtures",
				path: "test/fixtures/use-strict.js",
				contents: null
			});

		var stream = eslint();

		stream.on("error", function(error) {
			should.exist(error);
			done();
		});

		stream.on("data", function (file) {
			should.not.exist(file);
			done(new Error('File was expected to be null'));
		});

		stream.write(null);
		stream.end();
	});

});
