'use strict';

var path = require('path'),
	gutil = require('gulp-util'),
	through = require('through'),
	Config = require('eslint/lib/config');

/**
 * Optional import, if not found, returns null.
 */
function optional(name) {
	try {
		return require(name);
	} catch (error) {
		return null;
	}
}

/**
 * Variation on event-stream's "wait" method that returns a "reset" stream.
 */
exports.wait = function wait(cb) {
	var content = new Buffer([]);
	return through(function bufferData(data) {
		content = Buffer.concat([content, data]);
		this.queue(data);
	}, function releaseData() {
		cb(content.toString());
		this.emit('end');
	});
};

/**
 * Create config helper to merge various config sources
 */
exports.migrateOptions = function migrateOptions(from) {
	var globals, envs;

	if (typeof from === 'string') {
		// basic config path overload: gulpEslint('path/to/config.json')
		from = {
			configFile: from
		};
	}

	var to = {};
	for (var key in from) {
		if (from.hasOwnProperty(key)) {
			to[key] = from[key];
		}
	}

	globals = to.globals || to.global;
	if (globals != null) {
		to.globals = Array.isArray(globals) ?
			globals :
			Object.keys(globals).map(function cliGlobal(key) {
				return globals[key] ? key + ':true' : key;
			});
	}

	envs = to.envs || to.env;
	if (envs) {
		to.envs = Array.isArray(envs) ?
			envs :
			Object.keys(envs).filter(function cliEnv(key) {
				return envs[key];
			});
	}

	if (to.config != null) {
		// The "config" option has been deprecated. Use "configFile".
		to.configFile = to.config;
	}

	if (to.rulesdir != null) {
		// The "rulesdir" option has been deprecated. Use "rulesPaths".
		to.rulesPaths = (typeof to.rulesdir === 'string') ? [to.rulesdir] : to.rulesdir;
	}

	if (to.eslintrc != null) {
		// The "eslintrc" option has been deprecated. Use "useEslintrc".
		to.useEslintrc = to.eslintrc;
	}

	return to;
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
				||	optional(path.resolve(process.cwd(), formatter))
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
