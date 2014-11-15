'use strict';

var map = require('map-stream'),
	PluginError = require('gulp-util').PluginError,
	EsLint = require('eslint').CLIEngine,
	util = require('./util');

/**
 * Append eslint result to each file
 */
function gulpEslint(options) {
	var linter = new EsLint(util.migrateOptions(options));

	function verify(filePath, contents) {
		var result = linter.executeOnText(contents).results[0];
		return {
			filePath: filePath,
			messages: result && result.messages || []
		};
	}

	return map(function (file, output) {

		if (linter.isPathIgnored(file.path) || file.isNull()) {
			output(null, file);

		} else if (file.isStream()) {
			// eslint is synchronous, so wait for the complete contents
			// replace content stream with new readable content stream
			file.contents = file.contents.pipe(util.wait(function (contents) {
				file.eslint = verify(file.path, contents);
				output(null, file);
			}));

		} else {
			file.eslint = verify(file.path, file.contents.toString('utf8'));
			output(null, file);

		}
	});

}

/**
 * Fail when an eslint error is found in eslint results.
 */
gulpEslint.failOnError = function () {

	return map(function (file, output) {
		var messages = file.eslint && file.eslint.messages || [],
			error = null;

		messages.some(function (message) {
			var level = message.fatal ? 2 : message.severity;
			if (Array.isArray(level)) {
				level = level[0];
			}

			if (level > 1) {
				error = new PluginError(
					'gulp-eslint',
					{
						name: 'ESLintError',
						fileName: file.path,
						message: message.message,
						lineNumber: message.line
					}
				);
				return true;
			}
		});

		return output(error, file);
	});
};

/**
 * Wait until all files have been linted and format all results at once.
 */
gulpEslint.format = function (formatter, writable) {
	var results = [];
	formatter = util.resolveFormatter(formatter);
	writable = util.resolveWritable(writable);

	return map(function (file, output) {
		if (file.eslint) {
			results.push(file.eslint);
		}
		output(null, file);

	}).once('end', function () {
		// Only format results if files has been lint'd
		if (results.length) {
			util.writeResults(results, formatter, writable);
		}
		// reset buffered results
		results = [];
	});
};

/**
 * Format the results of each file individually.
 */
gulpEslint.formatEach = function (formatter, writable) {
	formatter = util.resolveFormatter(formatter);
	writable = util.resolveWritable(writable);

	return map(function (file, output) {
		var error = null;
		if (file.eslint) {
			try {
				util.writeResults([file.eslint], formatter, writable);
			} catch (err) {
				error = new PluginError('gulp-eslint', err);
			}
		}
		output(error, file);
	});
};

module.exports = gulpEslint;
