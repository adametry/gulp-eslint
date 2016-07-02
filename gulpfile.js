'use strict';

const gulp = require('gulp');
const eslint = require('.');

gulp.task('test', function() {
	return gulp.src(['**/*.js', '!node_modules/**', '!coverage/**', '!test/fixtures/**'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('default', ['test']);
