'use strict';

const Transform = require('stream').Transform;
const gutil = require('gulp-util');
const CLIEngine = require('eslint').CLIEngine;

/**
 * Convenience method for creating a transform stream in object mode
 *
 * @param {Function} transform - An async function that is called for each stream chunk
 * @param {Function} [flush] - An async function that is called before closing the stream
 * @returns {stream} A transform stream
 */
exports.transform = function(transform, flush) {
	if (typeof flush === 'function') {
		return new Transform({
			objectMode: true,
			transform,
			flush
		});
	}

	return new Transform({
		objectMode: true,
		transform
	});
};

/**
 * Mimic the CLIEngine's createIgnoreResult function,
 * only without the ESLint CLI reference.
 *
 * @param {Object} file - file with a "path" property
 * @returns {Object} An ESLint report with an ignore warning
 */
exports.createIgnoreResult = file => {
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
	}

	return options;
};

/**
 * Ensure that callback errors are wrapped in a gulp PluginError
 *
 * @param {Function} callback - callback to wrap
 * @param {Object} [value=] - A value to pass to the callback
 * @returns {Function} A callback to call(back) the callback
 */
exports.handleCallback = (callback, value) => {
	return err => {
		if (err != null && !(err instanceof gutil.PluginError)) {
			err = new gutil.PluginError(err.plugin || 'gulp-eslint', err, {
				showStack: (err.showStack !== false)
			});
		}

		callback(err, value);
	};
};

/**
 * Call sync or async action and handle any thrown or async error
 *
 * @param {Function} action - Result action to call
 * @param {(Object|Array)} result - An ESLint result or result list
 * @param {Function} done - An callback for when the action is complete
 */
exports.tryResultAction = function(action, result, done) {
	try {
		if (action.length > 1) {
			// async action
			action.call(this, result, done);
		} else {
			// sync action
			action.call(this, result);
			done();
		}
	} catch (error) {
		done(error == null ? new Error('Unknown Error') : error);
	}
};

/**
 * Get first message in an ESLint result to meet a condition
 *
 * @param {Object} result - An ESLint result
 * @param {Function} condition - A condition function that is passed a message and returns a boolean
 * @returns {Object} The first message to pass the condition or null
 */
exports.firstResultMessage = (result, condition) => {
	if (!result.messages) {
		return null;
	}

	return result.messages.find(condition);
};

/**
 * Determine if a message is an error
 *
 * @param {Object} message - an ESLint message
 * @returns {Boolean} whether the message is an error message
 */
function isErrorMessage(message) {
	const level = message.fatal ? 2 : message.severity;

	if (Array.isArray(level)) {
		return level[0] > 1;
	}

	return level > 1;
}
exports.isErrorMessage = isErrorMessage;

/**
 * Increment count if message is an error
 *
 * @param {Number} count - count of errors
 * @param {Object} message - an ESLint message
 * @returns {Number} The number of errors, message included
 */
function countErrorMessage(count, message) {
	return count + isErrorMessage(message);
}

/**
 * Increment count if message is a warning
 *
 * @param {Number} count - count of warnings
 * @param {Object} message - an ESLint message
 * @returns {Number} The number of warnings, message included
 */
function countWarningMessage(count, message) {
	return count + (message.severity === 1);
}

/**
 * Filter result messages, update error and warning counts
 *
 * @param {Object} result - an ESLint result
 * @param {Function} [filter=isErrorMessage] - A function that evaluates what messages to keep
 * @returns {Object} A filtered ESLint result
 */
exports.filterResult = (result, filter) => {
	if (typeof filter !== 'function') {
		filter = isErrorMessage;
	}
	const messages = result.messages.filter(filter, result);
	return {
		filePath: result.filePath,
		messages: messages,
		errorCount: messages.reduce(countErrorMessage, 0),
		warningCount: messages.reduce(countWarningMessage, 0)
	};
};

/**
 * Resolve formatter from unknown type (accepts string or function)
 *
 * @throws TypeError thrown if unable to resolve the formatter type
 * @param {(String|Function)} [formatter=stylish] - A name to resolve as a formatter. If a function is provided, the same function is returned.
 * @returns {Function} An ESLint formatter
 */
exports.resolveFormatter = (formatter) => {
	// use ESLint to look up formatter references
	if (typeof formatter !== 'function') {
		// load formatter (module, relative to cwd, ESLint formatter)
		formatter =	CLIEngine.getFormatter(formatter) || formatter;
	}

	return formatter;
};

/**
 * Resolve writable
 *
 * @param {(Function|stream)} [writable=gulp-util.log] - A stream or function to resolve as a format writer
 * @returns {Function} A function that writes formatted messages
 */
exports.resolveWritable = (writable) => {
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
 * @param {Object[]} results - A list of ESLint results
 * @param {Function} formatter - A function used to format ESLint results
 * @param {Function} writable - A function used to write formatted ESLint results
 */
exports.writeResults = (results, formatter, writable) => {
	if (!results) {
		results = [];
	}

	const firstResult = results.find(result => result.config);

	const message = formatter(results, firstResult ? firstResult.config : {});
	if (writable && message != null && message !== '') {
		writable(message);
	}
};
