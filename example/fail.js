'use strict';

// npm install gulp gulp-eslint

const gulp = require('gulp');
const gulpUtil = require('gulp-util');
const eslint = require('../');

gulp.task('fail-immediately', () => {
	return gulp.src('../test/fixtures/**/*.js')
		.pipe(eslint())
		// format one at time since this stream may fail before it can format them all at the end
		.pipe(eslint.formatEach())
		// failOnError will emit an error (fail) immediately upon the first file that has an error
		.pipe(eslint.failOnError())
		// need to do something before the process exits? Try this:
		.on('error', error => {
			gulpUtil.log('Stream Exiting With Error: ' + error.message);
		});
});

gulp.task('fail-at-end', () => {
	return gulp.src('../test/fixtures/**/*.js')
		.pipe(eslint())
		// Format all results at once, at the end
		.pipe(eslint.format())
		// failAfterError will emit an error (fail) just before the stream finishes if any file has an error
		.pipe(eslint.failAfterError());
});

gulp.task('default', ['fail-immediately']);
