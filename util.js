'use strict';

var TransformStream = require('stream').Transform,
	gutil = require('gulp-util'),
	objectAssign = require('object-assign'),
	CLIEngine = require('eslint').CLIEngine;

/**
 * Convenience method for creating a transform stream in object mode
 *
 * @param {Function} transform - An async function that is called for each stream chunk
 * @param {Function} [flush] - An async function that is called before closing the stream
 * @returns {stream} A transform stream
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
 * Mimic the CLIEngine's createIgnoreResult function,
 * only without the eslint CLI reference.
 *
 * @param {Object} file - file with a "path" property
 * @returns {Object} An eslint report with an ignore warning
 */
exports.createIgnoreResult = function(file) {
	return {
		filePath: file.path,
		messages: [{
			fatal: false,
			severity: 1,
			message: file.path.indexOf('node_modules/') < 0 ?
				'File ignored because of .eslintignore file' :
				'File ignored because it has a node_modules/** path'
		}],
		errorCount: 0,
		warningCount: 1
	};
};

/**
 * Create config helper to merge various config sources
 *
 * @param {Object} options - options to migrate
 * @returns {Object} migrated options
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

	if (options.extends) {
		// nest options as baseConfig, since it's basically an .eslintrc config file
		options.baseConfig = objectAssign(options.baseConfig || {}, options, {baseConfig: null});
	}

	return options;
};

/**
 * Resolve writable
 *
 * @param {Object} message - an eslint message
 * @returns {Boolean} whether the message is an error message
 */
function isErrorMessage(message) {
	var level = message.fatal ? 2 : message.severity;
	if (Array.isArray(level)) {
		level = level[0];
	}
	return (level > 1);
}
exports.isErrorMessage = isErrorMessage;

function reduceErrorCount(count, message) {
	return count + isErrorMessage(message);
}
function reduceWarningCount(count, message) {
	return count + (message.severity === 1);
}
exports.getQuietResult = function(result, filter) {
	if (typeof filter !== 'function') {
		filter = isErrorMessage;
	}
	var messages = result.messages.filter(filter);
	return {
		filePath: result.filePath,
		messages: messages,
		errorCount: messages.reduce(reduceErrorCount, 0),
		warningCount: messages.reduce(reduceWarningCount, 0)
	};
};

/**
 * Resolve formatter from unknown type (accepts string or function)
 *
 * @throws TypeError thrown if unable to resolve the formatter type
 * @param {(String|Function)} [formatter=stylish] - A name to resolve as a formatter. If a function is provided, the same function is returned.
 * @returns {Function} An eslint formatter
 */
exports.resolveFormatter = function(formatter) {
	// use eslint to look up formatter references
	if (typeof formatter !== 'function') {
		// load formatter (module, relative to cwd, eslint formatter)
		formatter =	CLIEngine.getFormatter(formatter) || formatter;
	}

	if (typeof formatter !== 'function') {
		// formatter not found
		throw new TypeError('Invalid Formatter');
	}

	return formatter;
};

/**
 * Resolve writable
 *
 * @param {(Function|stream)} [writable=gulp-util.log] - A stream or function to resolve as a format writer
 * @returns {Function} A function that writes formatted messages
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
 *
 * @param {Object[]} results - A list of eslint results
 * @param {Function} formatter - A function used to format eslint results
 * @param {Function} writable - A function used to write formatted eslint results
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
