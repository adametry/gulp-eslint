/*global describe, it, beforeEach */
'use strict';

var File = require('vinyl'),
	should = require('should'),
	eslint = require('../');

require('mocha');

describe('gulp-eslint failOnError', function() {
	it('should fail if an error is found', function(done) {
		var lintStream = eslint({
			envs: ['window'],
			rules: {
				'no-undef': 2
			}
		});

		lintStream.pipe(eslint.failOnError().on('error', function(err) {
			should.exists(err);
			done();
		}));

		lintStream.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('document = "abuse read-only value";')
		}));
	});

	it('should pass if only warnings are found', function(done) {
		eslint({rules: {'no-undef': 1}})
		.pipe(
			eslint.failOnError()
			.on('error', done)
			.on('finish', done)
		)
		.end(new File({
			path: 'test/fixtures/invalid.js',
			contents: new Buffer('x = 0;')
		}));
	});

});
