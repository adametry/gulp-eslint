'use strict';

var map = require('map-stream'),
	PluginError = require('gulp-util').PluginError,
	eslint = require('eslint').linter,
	util = require('./util');

/**
 * Append eslint result to each file
 */
function gulpEslint(options) {
	var configHelper = util.readOptions(options);

	function verify(filePath, contents) {
		var config = configHelper.getConfig(filePath);

		// eslint.cli result structure (+config)
		// remove shebangs (https://github.com/eslint/eslint/commit/109a57b2ca60bf7c195f935cddda9a90311860f3)
		return {
			config: config,
			filePath: filePath,
			messages: gulpEslint.linter.verify(contents.replace(/^#![^\r\n]+[\r\n]/, ""), config, false)
		};
	}

	return map(function (file, output) {

		if (util.checkForExclusion(file, configHelper)) {
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
			config = file.eslint && file.eslint.config || {},
			error = null;

		messages.some(function (message) {
			var level = message.fatal ? 2 :
					'severity' in message ? message.severity :// >=0.7.1
					config ? config.rules[message.ruleId][0]// <0.7.1
						|| config.rules[message.ruleId] : 0;
			if (Array.isArray(level)) {
				level = level[0];
			}
			if (level > 1) {
				error = new PluginError(
					'gulp-eslint',
					{
						name:'ESLintError',
						fileName:file.path,
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

// pass linter through to simplify customization
gulpEslint.linter = eslint;

module.exports = gulpEslint;
