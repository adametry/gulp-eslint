/* global describe, it, beforeEach */
'use strict';

var fs = require('fs');
var tmp = require('tmp');
var should = require('should');
var eslint = require('../');

require('mocha');

describe('eslint.outputFixes', function() {
	it('should overwrite a file with fixed contents', function(done) {
		var tmpfile = tmp.fileSync();
		var fixableContents = 'undefined == null;\n';
		var fixedContents = 'undefined === null;\n';
		fs.writeFileSync(tmpfile.name, fixableContents);

		eslint.outputFixes()
		.on('error', done)
		.on('data', function(file) {
			should.exist(file);
			should.exist(file.eslint);

			var result = file.eslint;
			result.filePath.should.equal(tmpfile.name);

			var fixed = fs.readFileSync(result.filePath).toString();
			fixed.should.equal(result.output);
			done();
		})
		.end({
			eslint: {
				output: fixedContents,
				filePath: tmpfile.name
			}
		});
	});
	it('should do nothing without fixed contents', function(done) {
		var tmpfile = tmp.fileSync();
		var contents = 'undefined === null;\n';
		fs.writeFileSync(tmpfile.name, contents);
		var mtime = fs.statSync(tmpfile.name).mtime;

		eslint.outputFixes()
		.on('error', done)
		.on('data', function(file) {
			should.exist(file);
			should.exist(file.eslint);

			var result = file.eslint;
			result.filePath.should.equal(tmpfile.name);

			var stat = fs.statSync(result.filePath);
			stat.mtime.getTime().should.equal(mtime.getTime());
			done();
		})
		.end({
			eslint: {
				filePath: tmpfile.name
			}
		});
	});
});
