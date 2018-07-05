'use strict';

// npm install gulp@next gulp-eslint gulp-if

const {dest, src, task} = require('gulp');
const gulpIf = require('gulp-if');
const eslint = require('..');

function isFixed(file) {
	return file.eslint != null && file.eslint.fixed;
}

task('lint-n-fix', () => {
	return src('../test/fixtures/*.js')
		.pipe(eslint({fix: true}))
		.pipe(eslint.format())
		// if fixed, write the file to dest
		.pipe(gulpIf(isFixed, dest('../test/fixtures')));
});

task('flag-n-fix', () => {
	const hasFixFlag = process.argv.slice(2).includes('--fix');

	return src('../test/fixtures/*.js')
		.pipe(eslint({fix: hasFixFlag}))
		.pipe(eslint.format())
		// if fixed, write the file to dest
		.pipe(gulpIf(isFixed, dest('../test/fixtures')));
});

task('default', ['lint-n-fix']);
