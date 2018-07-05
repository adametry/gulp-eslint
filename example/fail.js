'use strict';

// npm install gulp@next gulp-eslint

const {src, task} = require('gulp');
const fancyLog = require('fancy-log');
const eslint = require('../');

task('fail-immediately', () => {
	return src('../test/fixtures/**/*.js')
		.pipe(eslint())
		// format one at time since this stream may fail before it can format them all at the end
		.pipe(eslint.formatEach())
		// failOnError will emit an error (fail) immediately upon the first file that has an error
		.pipe(eslint.failOnError())
		// need to do something before the process exits? Try this:
		.on('error', error => {
			fancyLog('Stream Exiting With Error: ' + error.message);
		});
});

task('fail-at-end', () => {
	return src('../test/fixtures/**/*.js')
		.pipe(eslint())
		// Format all results at once, at the end
		.pipe(eslint.format())
		// failAfterError will emit an error (fail) just before the stream finishes if any file has an error
		.pipe(eslint.failAfterError());
});

task('default', ['fail-immediately']);
