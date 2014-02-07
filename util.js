'use strict';

var esutil  = require('eslint/lib/util'),
	estream = require('event-stream'),
	Config  = require('eslint/lib/config');

/**
 * Optional import, if not found, returns null.
 */
function optional(path) {
	try {
		return require(path);
	} catch (error) {
		return null;
	}
}

/**
 * Variation on event-stream's "wait" method that returns a "reset" stream.
 */
exports.wait = function (cb) {
	var content = '';
	return estream.through(function (data) {
		content += data;
		this.queue(data);
	}, function () {
		process.nextTick(this.resume);
		this.queue(null);
		cb.call(this, content);
	}).pause();
};

/**
 * Create config helper to merge various config sources
 */
exports.readOptions = function (options) {

	if (!options || typeof options === 'string') {
		// load external config data (if a string)
		options = {
			config: options
		};
	}

	var helper = new Config(options);

	if (options.rules || options.globals || options.env) {
		// inline definitions
		helper.useSpecificConfig = esutil.mergeConfigs(
			helper.useSpecificConfig || {},
			{
				rules: options.rules || {},
				globals: options.globals || {},
				env: options.env || {}
			}
		);
	}

	if (options.rulesdir) {
		// rulesdir: Load additional rules from this directory
		require('eslint/lib/rules').load(options.rulesdir);
	}

	return helper;
};

/**
 * Resolve formatter from unknown type (accepts string or function)
 * @exception TypeError thrown if unable to resolve the formatter type
 */
exports.resolveFormatter = function (formatter) {
	if (!formatter) {
		// default formatter
		formatter = 'stylish';
	}

	if (typeof formatter === 'string') {
		// load formatter (module, relative to cwd, eslint formatter)
		formatter =	optional(formatter)
				||	optional(require('path').resolve(process.cwd(), formatter))
				||	optional('eslint/lib/formatters/' + formatter);

		if (typeof formatter === 'string') {
			// certain formatter modules return a path to the formatter
			formatter = optional(formatter);
		}
	}

	if (typeof formatter !== 'function') {
		throw new TypeError('gulp-eslint: invalid formatter');
	}

	return formatter;
};

/**
 * Resolve writable
 */
exports.resolveWritable = function (writable) {
	if (!writable) {
		writable = require('gulp-util').log;
	} else if (typeof writable.write === 'function') {
		writable = writable.write.bind(writable);
	}
	return writable;
};

/**
 * Write formatter results to writable/output
 */
exports.writeResults = function (results, formatter, writable) {
	var config;
	if (!results) {
		results = [];
	}
	// get the first result config
	results.some(function (result) {
		config = result && result.config;
		return config;
	});
	// formatters typically receive a list of results. We have but one
	var message = formatter(results, config);
	if (writable && message != null && message !== '') {
		writable(message);
	}
};
