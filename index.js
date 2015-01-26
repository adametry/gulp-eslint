'use strict';

var map = require('map-stream'),
	PluginError = require('gulp-util').PluginError,
	eslint = require('eslint').linter,
	CLIEngine = require('eslint').CLIEngine,
	util = require('./util');

/**
 * Append eslint result to each file
 */
function gulpEslint(options) {
	options = util.migrateOptions(options);
	var linter = new CLIEngine(options);

	function verify(filePath, contents) {
		var config = linter.getConfigForFile(filePath);
		var messages = eslint.verify(contents, config, filePath);
		//eslint.reset();
		return {
			filePath: filePath,
			messages: messages || []
		};
	}

	return map(function (file, output) {
		// remove base path from file path before calling isPathIgnored
		if (util.isPathIgnored(file, linter.options) || file.isNull()) {
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
			if (util.isErrorMessage(message)) {
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
 * Fail when the stream ends if any eslint error(s) occurred
 */
gulpEslint.failAfterError = function () {
	var errorCount = 0;

	return map(function (file, output) {
		var messages = file.eslint && file.eslint.messages || [];
		messages.forEach(function (message) {
			if (util.isErrorMessage(message)) {
				errorCount++;
			}
		});
		output(null, file);

	}).once('end', function () {
		// Only format results if files has been lint'd
		if (errorCount > 0) {
			this.emit('error', new PluginError(
				'gulp-eslint',
				{
					name: 'ESLintError',
					message: 'Failed with ' + errorCount + (errorCount === 1 ? ' error' : ' errors')
				}
			));
		}
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
