'use strict';

var path = require('path'),
	TransformStream = require('stream').Transform,
	gutil = require('gulp-util'),
	objectAssign = require('object-assign'),
	CLIEngine = require('eslint').CLIEngine,
	esUtil = require('eslint/lib/util'),
	IgnoredPaths = require('eslint/lib/ignored-paths'),
	FileFinder = require('eslint/lib/file-finder');

var ignoreFileFinder = new FileFinder('.eslintignore');

/**
 * Convenience method for creating a transform stream in object mode
 */
exports.transform = function(transform, flush) {
	var stream = new TransformStream({
		objectMode: true
	});
	stream._transform = transform;
	if (typeof flush === 'function') {
		stream._flush = flush;
	}
	return stream;
};

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
	filePath = path.relative(
		path.dirname(options.ignorePath || '') || process.cwd(),
		file.path || ''
	);
	return IgnoredPaths.load(options).contains(filePath);
};

/**
 * Mimic the CLIEngine::loadPlugins
 */
exports.loadPlugins = function(pluginNames, linter) {
	// Replicate the cli-engine's internal loadPlugins method;
	// However, use the fancy new addPlugin method to populate the internal loadedPlugins table
	if (pluginNames) {
		pluginNames.forEach(function loadAndAddPlugin(pluginName) {
			var pluginNamespace = esUtil.getNamespace(pluginName),
				pluginNameWithoutPrefix = esUtil.removePluginPrefix(esUtil.removeNameSpace(pluginName)),
				plugin = require(pluginNamespace + esUtil.PLUGIN_NAME_PREFIX + pluginNameWithoutPrefix);
			// Use the fancy new addPlugin method...
			linter.addPlugin(pluginName, plugin);
		});
	}
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
	// use eslint to look up formatter references
	if (typeof formatter !== 'function') {
		// load formatter (module, relative to cwd, eslint formatter)
		formatter =	(new CLIEngine()).getFormatter(formatter) || formatter;
	}

	if (typeof formatter !== 'function') {
		// formatter not found
		throw new TypeError('Invalid Formatter');
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
