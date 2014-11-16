'use strict';

var gulp = require('gulp'),
	gulpUtil = require('gulp-util'),
	eslint = require('../index');

var scriptsGlobs = ['../test/fixtures/**/*.js'];

/**
 * Simple example of using eslint and a formatter
 * Note: eslint does not write to the console itself.
 * Use format or formatEach to print eslint results.
 */
gulp.task('basic', function() {
	return gulp.src(scriptsGlobs)
		.pipe(eslint())
		.pipe(eslint.format());
});

/**
 * Inline eslint configuration
 */
gulp.task('inline-config', function() {
	return gulp.src(scriptsGlobs)
		.pipe(eslint({
			"rules": {
				"no-alert": 0,
				"no-bitwise": 0,
				"camelcase": 1,
				"curly": 1,
				"eqeqeq": 0,
				"no-eq-null": 0,
				"guard-for-in": 1,
				"no-empty": 1,
				"no-use-before-define": 0,
				"no-obj-calls": 2,
				"no-unused-vars": 0,
				"new-cap": 1,
				"no-shadow": 0,
				"strict": 2,
				"no-invalid-regexp": 2,
				"no-comma-dangle": 2,
				"no-undef": 1,
				"no-new": 1,
				"no-extra-semi": 1,
				"no-debugger": 2,
				"no-caller": 1,
				"semi": 1,
				"quotes": 0,
				"no-unreachable":2
			},
			"globals": {
				"$": false
			},
			"env":{
				"node": true
			}
		}))
		.pipe(eslint.format());
});

/**
 * Load configuration file
 */
gulp.task('load-config', function() {
	return gulp.src(scriptsGlobs)
		.pipe(eslint({
			config: 'config.json'
		}))
		.pipe(eslint.format());
});

/**
 * Shorthand way to load a configuration file
 */
gulp.task('load-config-shorthand', function() {
	return gulp.src(scriptsGlobs)
		.pipe(eslint('config.json'))
		.pipe(eslint.format());
});

/**
 * Using various formatters
 */
gulp.task('eslint-formatter', function() {
	return gulp.src(scriptsGlobs)
		.pipe(eslint())
		.pipe(eslint.format('checkstyle'))
		.pipe(eslint.format('jslint-xml'))
		.pipe(eslint.format('junit'))
		.pipe(eslint.format('compact'));
});

/**
 * Using eslint with streaming files
 */
gulp.task('stream', function() {
	return gulp.src(scriptsGlobs, { buffer:false })
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failOnError())
		.on('error', function(error) {
			gulpUtil.log('Stream Exiting With Error');
		});
});

/**
 *
 */
gulp.task('default', [

	'basic',
	'inline-config',
	'load-config',
	'load-config-shorthand',
	'eslint-formatter',
	'stream'

], function() {
	console.log('All tasks completed successfully.');
});
