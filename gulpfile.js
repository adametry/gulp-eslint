'use strict';

var gulp = require('gulp'),
	eslint = require('./');

gulp.task('default', function() {
	return gulp.src(['*.js'])
		.pipe(eslint())
		.pipe(eslint.format());
});
