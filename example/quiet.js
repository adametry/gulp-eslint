'use strict';

// npm install gulp@next gulp-eslint

const {src, task} = require('gulp');
const eslint = require('..');

task('quiet-lint', () => {
	return src('../test/fixtures/*.js')
		.pipe(eslint({quiet: true}))
		.pipe(eslint.format());
});

function isWarning(message) {
	return message.severity === 1;
}

task('lint-warnings', () => {
	return src('../test/fixtures/*.js')
		.pipe(eslint({quiet: isWarning}))
		.pipe(eslint.format());
});

task('default', ['quiet-lint','lint-warnings']);
