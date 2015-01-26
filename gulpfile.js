'use strict';

var gulp = require('gulp'),
	eslint = require('./');

gulp.task('throw-on-error', function() {
	return gulp.src(['**/*.js', '!node_modules/**'])
		.pipe(eslint())
		.pipe(eslint.formatEach())
		.pipe(eslint.failOnError());
});

gulp.task('throw-after-error', function() {
	return gulp.src(['**/*.js', '!node_modules/**'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('default', function() {
	return gulp.src(['**/*.js', '!node_modules/**', '!test/fixtures/**'])
		.pipe(eslint())
		.pipe(eslint.format());
});
