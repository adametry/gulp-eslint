'use strict';

const gulp = require('gulp');
const eslint = require('.');

function test() {
	return gulp.src(['**/*.js', '!node_modules/**', '!coverage/**', '!test/fixtures/**'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
}

module.exports = {
	test,
	default: gulp.parallel(test)
};
