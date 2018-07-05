'use strict';

// npm install gulp@next gulp-eslint

const {src, task} = require('gulp');
const eslint = require('..');

task('eslint-formatter', () => {
	// lint each file, and format all files at once (mul)
	return src('../test/fixtures/**/*.js')
		.pipe(eslint())
		// use eslint's default formatter by default
		.pipe(eslint.format())
		// Name a built-in formatter or path load.
		// https://eslint.org/docs/user-guide/command-line-interface#-f---format
		.pipe(eslint.format('compact'));
});

task('custom-formatter', () => {
	function embolden(text) {
		return `\u001b[1m${text}\u001b[22m `;
	}

	function pluralish(count, text) {
		return `${count} ${text}${count === 1 ? '' : 's'}`;
	}

	return src('../test/fixtures/**/*.js')
		.pipe(eslint())
		.pipe(eslint.format(results => {

			// return formatted text to display
			return embolden('[Custom ESLint Summary]')
				+ pluralish(results.length, 'File') + ', '
				+ pluralish(results.errorCount, 'Error') + ', and '
				+ pluralish(results.warningCount, 'Warning');
		}));
});

task('default', ['eslint-formatter','custom-formatter']);
