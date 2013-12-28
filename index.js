'use strict';

var estream = require('event-stream'),
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
		return {
			config: config,
			filePath: filePath,
			messages: eslint.verify(contents, config, false)
		};
	}

	return estream.map(function (file, output) {

		if (file.isStream()) {
			// eslint is synchronous, so wait for the complete contents
			// replace content stream with new readable content stream
			file.contents = file.contents.pipe(util.wait(function (contents) {
				file.eslint = verify(file.path, contents);
				output(null, file);
			}));

		} else {

			if (file.isBuffer()) {
				file.eslint = verify(file.path, String(file.contents));
			}
			output(null, file);

		}
	});

}

/**
 * Wait until all files have been linted and format all results at once.
 */
gulpEslint.format = function (formatter, writable) {
	var results = [];
	formatter = util.resolveFormatter(formatter);
	writable = util.resolveWritable(writable);

	return estream.map(function (file, output) {
		if (file.eslint) {
			results.push(file.eslint);
		}
		output(null, file);

	}).once('end', function () {
		util.writeResults(results, formatter, writable);
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

	return estream.map(function (file, output) {
		var error = null;
		if (file.eslint) {
			try {
				util.writeResults([file.eslint], formatter, writable);
			} catch (err) {
				error = err;
			}
		}
		output(error, file);
	});
};

// pass linter through to simplify customization
gulpEslint.linter = eslint;

module.exports = gulpEslint;
