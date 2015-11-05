'use strict';

// npm install gulp gulp-eslint

var gulp = require('gulp');
var gulpUtil = require('gulp-util');
var eslint = require('../');


gulp.task('fail-immediately', function() {
	return gulp.src('../test/fixtures/**/*.js')
		.pipe(eslint())
		// format one at time since this stream may fail before it can format them all at the end
		.pipe(eslint.formatEach())
		// failOnError will emit an error (fail) immediately upon the first file that has an error
		.pipe(eslint.failOnError())
		// need to do something before the process exits? Try this:
		.on('error', function(error) {
			gulpUtil.log('Stream Exiting With Error');
		});
});

gulp.task('fail-at-end', function() {
	return gulp.src('../test/fixtures/**/*.js')
		.pipe(eslint())
		// Format all results at once, at the end
		.pipe(eslint.format())
		// failAfterError will emit an error (fail) just before the stream finishes if any file has an error
		.pipe(eslint.failAfterError());
});

gulp.task('default', ['fail-immediately']);
