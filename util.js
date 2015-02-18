'use strict';

var path = require('path'),
	gutil = require('gulp-util'),
	objectAssign = require('object-assign'),
	optional = require('optional'),
	CLIEngine = require('eslint').CLIEngine,
	IgnoredPaths = require('eslint/lib/ignored-paths'),
	FileFinder = require('eslint/lib/file-finder');

var ignoreFileFinder = new FileFinder('.eslintignore');

/**
 * Mimic the CLIEngine.isPathIgnored,
 * but resolve .eslintignore based on file's directory rather than process.cwd()
 */
exports.isPathIgnored = function(file, options) {
	var filePath;
	if (!options.ignore) {
		return false;
	}
	if (typeof options.ignorePath !== 'string') {
		options = {
			ignore: true,
			ignorePath: ignoreFileFinder.findInDirectoryOrParents(path.dirname(file.path || ''))
		};
	}
	// set file path relative to the .eslintignore directory or cwd
	filePath = path.relative(path.dirname(options.ignorePath || '') || process.cwd(), file.path);
	return IgnoredPaths.load(options).contains(filePath);
};

/**
 * Mimic the CLIEngine::loadPlugins
 */
exports.loadPlugins = function(pluginNames) {
	// WARNING: HACK AHEAD!
	// We can either process text/file, or create a new CLIEngine instance
	// to make use of the internal plugin cache.
	//	Creating a new CLIEngine is probably the cheapest approach.
	return pluginNames && new CLIEngine({plugins: pluginNames}) && void 0;
};

/**
 * Create config helper to merge various config sources
 */
exports.migrateOptions = function migrateOptions(options) {
	if (typeof options === 'string') {
		// basic config path overload: gulpEslint('path/to/config.json')
		options = {
			configFile: options
		};
	} else {
		options = objectAssign({}, options);
	}

	options.globals = options.globals || options.global;
	if (options.globals != null && !Array.isArray(options.globals)) {
		options.globals = Object.keys(options.globals).map(function cliGlobal(key) {
			return options.globals[key] ? key + ':true' : key;
		});
	}

	options.envs = options.envs || options.env;
	if (options.envs != null && !Array.isArray(options.envs)) {
		options.envs = Object.keys(options.envs).filter(function cliEnv(key) {
			return options.envs[key];
		});
	}

	if (options.config != null) {
		// The "config" option has been deprecated. Use "configFile".
		options.configFile = options.config;
	}

	if (options.rulesdir != null) {
		// The "rulesdir" option has been deprecated. Use "rulePaths".
		if (typeof options.rulesdir === 'string') {
			options.rulePaths = [options.rulesdir];
		} else {
			options.rulePaths = options.rulesdir;
		}
	}

	if (options.eslintrc != null) {
		// The "eslintrc" option has been deprecated. Use "useEslintrc".
		options.useEslintrc = options.eslintrc;
	}

	return options;
};

/**
 * Resolve writable
 */
exports.isErrorMessage = function(message) {
	var level = message.fatal ? 2 : message.severity;
	if (Array.isArray(level)) {
		level = level[0];
	}
	return (level > 1);
};

/**
 * Resolve formatter from unknown type (accepts string or function)
 * @exception TypeError thrown if unable to resolve the formatter type
 */
exports.resolveFormatter = function(formatter) {
	if (!formatter) {
		// default formatter
		formatter = 'stylish';
	}

	if (typeof formatter === 'string') {
		// load formatter (module, relative to cwd, eslint formatter)
		formatter =	(new CLIEngine()).getFormatter(formatter);

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
exports.resolveWritable = function(writable) {
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
exports.writeResults = function(results, formatter, writable) {
	var config;
	if (!results) {
		results = [];
	}
	// get the first result config
	results.some(function(result) {
		config = result && result.config;
		return config;
	});

	var message = formatter(results, config || {});
	if (writable && message != null && message !== '') {
		writable(message);
	}
};
