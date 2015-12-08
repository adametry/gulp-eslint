'use strict';

// npm install gulp gulp-eslint gulp-cached

var gulp = require('gulp');
var path = require('path');
var eslint = require('../');
var cache = require('gulp-cached');


gulp.task('lint-watch', function() {
	// Lint only files that change after this watch starts
	var lintAndPrint = eslint();
	// format results with each file, since this stream won't end.
	lintAndPrint.pipe(eslint.formatEach());

	return gulp.watch('../test/fixtures/*.js', function(event) {
		if (event.type !== 'deleted') {
			gulp.src(event.path)
				.pipe(lintAndPrint, {end: false});
		}
	});
});



gulp.task('cached-lint', function() {
	// Read all js files within test/fixtures
	return gulp.src('../test/fixtures/*.js')
		.pipe(cache('eslint'))
		// Only uncached and changed files past this point
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.result(function(result) {
			if (result.warningCount > 0 || result.errorCount > 0) {
				// If a file has errors/warnings remove uncache it
				delete cache.caches.eslint[path.resolve(result.filePath)];
			}
		}));
});

// Run the "cached-lint" task initially...
gulp.task('cached-lint-watch', ['cached-lint'], function() {
	// ...and whenever a watched file changes
	return gulp.watch('../test/fixtures/*.js', ['cached-lint'], function(event) {
		if (event.type === 'deleted' && cache.caches.eslint) {
			// remove deleted files from cache
			delete cache.caches.eslint[event.path];
		}
	});
});

gulp.task('default', ['cached-lint-watch']);
