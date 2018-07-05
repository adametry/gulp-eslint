'use strict';

// npm install gulp@next gulp-eslint gulp-cached

const {src, task, watch} = require('gulp');
const {resolve} = require('path');
const eslint = require('..');
const cache = require('gulp-cached');

task('lint-watch', () => {
	// Lint only files that change after this watch starts
	const lintAndPrint = eslint();
	// format results with each file, since this stream won't end.
	lintAndPrint.pipe(eslint.formatEach());

	return watch('../test/fixtures/*.js', event => {
		if (event.type !== 'deleted') {
			src(event.path)
				.pipe(lintAndPrint, {end: false});
		}
	});
});

task('cached-lint', () => {
	// Read all js files within test/fixtures
	return src('../test/fixtures/*.js')
		.pipe(cache('eslint'))
		// Only uncached and changed files past this point
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.result(result => {
			if (result.warningCount > 0 || result.errorCount > 0) {
				// If a file has errors/warnings remove uncache it
				delete cache.caches.eslint[resolve(result.filePath)];
			}
		}));
});

// Run the "cached-lint" task initially...
task('cached-lint-watch', ['cached-lint'], () => {
	// ...and whenever a watched file changes
	return watch('../test/fixtures/*.js', ['cached-lint'], event => {
		if (event.type === 'deleted' && cache.caches.eslint) {
			// remove deleted files from cache
			delete cache.caches.eslint[event.path];
		}
	});
});

task('default', ['cached-lint-watch']);
