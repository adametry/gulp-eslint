'use strict';

// npm install gulp gulp-eslint gulp-if

const gulp = require('gulp');
const gulpIf = require('gulp-if');
const eslint = require('..');

function isFixed(file) {
	// Has ESLint fixed the file contents?
	return file.eslint != null && file.eslint.fixed;
}

gulp.task('lint-n-fix', () => {

	return gulp.src('../test/fixtures/*.js')
		.pipe(eslint({
			fix: true
		}))
		.pipe(eslint.format())
		// if fixed, write the file to dest
		.pipe(gulpIf(isFixed, gulp.dest('../test/fixtures')));
});

gulp.task('flag-n-fix', () => {
	// This is a *very* basic CLI flag check.
	// For a more robust method, check out [yargs](https://www.npmjs.com/package/yargs)
	const hasFixFlag = (process.argv.slice(2).indexOf('--fix') >= 0);

	return gulp.src('../test/fixtures/*.js')
		.pipe(eslint({
			fix: hasFixFlag
		}))
		.pipe(eslint.format())
		// if fixed, write the file to dest
		.pipe(gulpIf(isFixed, gulp.dest('../test/fixtures')));
});

gulp.task('default', ['lint-n-fix']);
