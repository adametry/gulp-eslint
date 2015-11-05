'use strict';

// npm install gulp gulp-eslint gulp-if gulp-cached

var gulp = require('gulp');
var eslint = require('../');
var cache = require('gulp-cached');
var ifFile = require('gulp-if');
var Transform = require('stream').Transform;


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



function isLinty(file) {
	// check if a file has been fixed or has warnings/errors
	return file.eslint != null
		&&(file.eslint.warningCount > 0
		|| file.eslint.errorCount > 0
		|| file.eslint.fixed);
}

function uncache(name) {
	// create a stream that removes files from gulp-cached
	var stream = new Transform({
		objectMode: true
	});
	stream._transform = function(file, enc, done) {
		if (cache.caches[name]) {
			delete cache.caches[name][file.path];
		}
		done(null, file);
	};
	return stream;
}

gulp.task('cached-lint', function() {
	// Read all js files within ./src
	return gulp.src('../test/fixtures/*.js')
		.pipe(cache('lint-cache'))
		// Only uncached and changed files past this point
		.pipe(eslint())
		.pipe(eslint.format())
		// If a file has errors/warnings ("linty") uncache it
		.pipe(ifFile(isLinty, uncache('lint-cache')));
});

// Run the "cached-lint" task initially...
gulp.task('cached-lint-watch', ['cached-lint'], function() {
	// ...and whenever a watched file changes
	return gulp.watch('../test/fixtures/*.js', ['cached-lint'], function(event) {
		if (event.type === 'deleted' && cache.caches['lint-cache']) {
			delete cache.caches['lint-cache'][event.path];
		}
	});
});

gulp.task('default', ['cached-lint-watch']);
