'use strict';

// npm install gulp@next gulp-eslint

const {src, task} = require('gulp');
const eslint = require('..');

const MAX_WARNINGS = 1;

task('lint-result', () => {
	const count = 0;

	// Be sure to return the stream; otherwise, you may not get a proper exit code.
	return src('../test/fixtures/*.js')
		.pipe(eslint())
		.pipe(eslint.formatEach())
		.pipe(eslint.result(result => {
			count += result.warningCount;

			if (count > MAX_WARNINGS) {
				// Report which file exceeded the limit
				// The error will be wraped in a gulp PluginError
				throw {
					name: 'TooManyWarnings',
					fileName: result.filePath,
					message: 'Too many warnings!',
					showStack: false
				};
			}
		}));
});

task('lint-resu1lt-async', () => {
	let count = 0;

	return src('../test/fixtures/*.js')
		.pipe(eslint())
		.pipe(eslint.formatEach())
		.pipe(eslint.result((result, done) => {
			// As a basic example, we'll use process.nextTick as an async process.
			process.nextTick(function asyncStub() {
				count += result.warningCount;

				let error = null;
				if (count > MAX_WARNINGS) {
					// Define the error. Any non-null/undefined value will work
					error = {
						name: 'TooManyWarnings',
						fileName: result.filePath,
						message: 'Too many warnings!',
						showStack: false
					};
				}
				done(error);
			}, 100);
		}));
});

task('lint-results', () => {
	return src('../test/fixtures/*.js')
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.results(results => {
			// results.warningCount is an array of file result
			// that includes warningsCount and errorCount totals.
			if (results.warningCount > MAX_WARNINGS) {
				// No specific file to complain about here.
				throw new Error('Too many warnings!');
			}
		}));
});

task('lint-results-async', () => {
	return src('../test/fixtures/*.js')
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.results((results, done) => {
			// Another async example...
			process.nextTick(function asyncStub() {
				const error = null;
				if (results.warningCount > MAX_WARNINGS) {
					error = new Error('Too many warnings!');
				}
				done(error);

			}, 100);
		}));
});

task('default', ['lint-results']);
