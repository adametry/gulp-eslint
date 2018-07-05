'use strict';

const {src, task} = require('gulp');
const eslint = require('.');

task('default', () => {
	return src(['**/*.js', '!node_modules/**', '!coverage/**', '!test/fixtures/**'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});
