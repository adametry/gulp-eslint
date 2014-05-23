'use strict';

var path = require('path'),
	util  = require('util'),
	gutil = require('gulp-util'),
	esutil  = require('eslint/lib/util'),
	through = require('through'),
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
	return through(function (data) {
		content += data;
		this.queue(data);
	}, function () {
		cb(content);
		this.emit('end');
	});
};

/**
 * Check if file should be excluded from eslint processing
 */
exports.checkForExclusion = function (file, config) {
	// Ignore null and non-js files
	var exclude;

	if (file.isDirectory()) {
		exclude = true;
		config.cacheExclusions(file.path);

	} else {
		exclude = file.isNull()
			|| path.extname(file.path).toLowerCase() !== '.js';
	}

	if (!exclude && typeof config.checkForExclusion === 'function') {
		// Support for .eslintignore (https://github.com/eslint/eslint/commit/cdcba8941b51176e6f998eb07fca1cb93dabe391)
		exclude = config.checkForExclusion(file.path);
	}

	return exclude;
};

/**
 * Create config helper to merge various config sources
 */
exports.readOptions = function (options) {
	var configOptions = {};
	/*
	Config.options = {
		reset:false,
		format:'formatter-reference',
		eslintrc:boolean,
		env:['key'],
		global:[
			'key:true',
			'key'//:false - implied
		],
		config:{}
	}
	*/

	if (options == null) {
		options = {};
	} else if (typeof options === 'string') {
		configOptions.config = options;
	}

	// accommodate cli format
	if (util.isArray(options.env)) {
		configOptions.env = options.env;
		options.env = null;
	}

	// accommodate cli format: [ 'key:true', 'key' ]
	if (util.isArray(options.globals)) {
		configOptions.globals = options.globals;
		options.globals = null;
	}

	// create helper with overrides
	var helper = new Config(configOptions);

	// overwrite config.global
	if (options.globals) {
		helper.globals = options.globals;
	}

	if (options.rules || options.env) {
		// inline definitions
		helper.useSpecificConfig = esutil.mergeConfigs(
			helper.useSpecificConfig || {},
			{
				rules: options.rules || {},
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
		if (arguments[0] == null) {
			// eslint@<0.3.0 default
			return exports.resolveFormatter('compact');
		} else {
			throw new TypeError('Invalid Formatter');
		}
	}

	return formatter;
};

/**
 * Resolve writable
 */
exports.resolveWritable = function (writable) {
	if (!writable) {
		writable = gutil.log;
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

	var message = formatter(results, config || {});
	if (writable && message != null && message !== '') {
		writable(message);
	}
};
