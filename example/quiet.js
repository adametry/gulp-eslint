'use strict';

// npm install gulp gulp-eslint

var gulp = require('gulp');
var eslint = require('../');

gulp.task('quiet-lint', function() {
	return gulp.src('../test/fixtures/*.js')
		.pipe(eslint({
			// only report errors
			quiet: true
		}))
		.pipe(eslint.result(function(result) {

		}))
		.pipe(eslint.format());
});



function isWarning(message) {
	return message.severity === 1;
}

gulp.task('lint-warnings', function() {
	return gulp.src('../test/fixtures/*.js')
		.pipe(eslint({
			quiet: isWarning
		}))
		.pipe(eslint.format());
});

gulp.task('default', ['quiet-lint','lint-warnings']);

