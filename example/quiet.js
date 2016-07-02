'use strict';

// npm install gulp gulp-eslint

const gulp = require('gulp');
const eslint = require('..');

gulp.task('quiet-lint', () => {
	return gulp.src('../test/fixtures/*.js')
		.pipe(eslint({
			// only report errors
			quiet: true
		}))
		.pipe(eslint.format());
});



function isWarning(message) {
	return message.severity === 1;
}

gulp.task('lint-warnings', () => {
	return gulp.src('../test/fixtures/*.js')
		.pipe(eslint({
			quiet: isWarning
		}))
		.pipe(eslint.format());
});

gulp.task('default', ['quiet-lint','lint-warnings']);
