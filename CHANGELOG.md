# Changelog

## 6.0.0

* Bump `eslint` dependency to ^6.0.0 <https://eslint.org/blog/2019/06/eslint-v6.0.0-released>
* Drop support for Node 6 and 7

## 5.0.0

* Bump `eslint` dependency to ^5.0.0 <https://eslint.org/blog/2018/06/eslint-v5.0.0-released>
* Use destructuring assignment to simplify the code

## 4.0.2

* Update `plugin-error` to ^1.0.0

## 4.0.1

* Make `fix` option work even if `quiet` option is also enabled
* Remove deprecated [`gulp-util`](https://github.com/gulpjs/gulp-util) dependency and use individual modules instead

## 4.0.0

* Drop support for linting [`Stream`](https://nodejs.org/api/stream.html#stream_stream) [contents](https://github.com/gulpjs/vinyl#optionscontents)
  * Because almost all, at least widely used tools to handle JavaScript files don't support `Streams`. They only support either `String` or `Buffer`.
* Use [`Buffer.from(<string>)`](https://nodejs.org/api/buffer.html#buffer_class_method_buffer_from_string_encoding) instead of the deprecated [`new Buffer(<string>)`](https://nodejs.org/dist/latest-v8.x/docs/api/buffer.html#buffer_new_buffer_string_encoding)
  * Note that `Buffer.from` is only available on Node.js >= [4.5.0](https://nodejs.org/en/blog/release/v4.5.0/).
* Bump [`eslint`](https://github.com/eslint/eslint) dependency to [`^4.0.0`](https://eslint.org/blog/2017/06/eslint-v4.0.0-released)
* Emit a [`PluginError`](https://github.com/gulpjs/gulp-util#new-pluginerrorpluginname-message-options) when it fails to load an [ESLint plugin](https://eslint.org/docs/user-guide/configuring#configuring-plugins)

## 3.0.1

* Remove unnecessary `object-assign` dependency

## 3.0.0

* Bump eslint dependency to ^3.0.0 <https://eslint.org/blog/2016/07/eslint-v3.0.0-released>
* Use ES2015 syntax
* Remove these deprecated option aliases:
  * `global`
  * `env`
  * `config`
  * `rulesdir`
  * `eslintrc`
* Drop support for non-array `globals` option

## 2.1.0

* Remove now obsolete error handling for formatter loading
  * It's gracefully done in ESLint >=v2.10.0. <https://github.com/eslint/eslint/pull/5978>

## 2.0.0

* Update to ESLint 2.0.0, along with other dependency updates
* Replace JSCS with ESLint equivalent rules

## 1.1.1

* Fix config migration of "extends" and "ecmaFeatures" options

## 1.1.0

* Bump eslint dependency to ^1.4.0, when "fix" option was added
* Apply eslint-fixed source to gulp file contents
* Add "quiet" option to filter eslint messages
* Update .eslintignore resolution to match eslint
* Add file ignore warnings behind "warnFileIgnored" option
* Migrate "ecmaFeatures" and "extends" option to "baseConfig" option
* Add "result" and "results" methods and tests
* Refactor "failOnError", "failAfterError", "format", and "formatEach" to use "result" or "results" methods

## 1.0.0

* Bump eslint dependency to ^1.0.0
* Update dev-dependencies and js-doc formats

## 0.15.0

* Update dependencies
* Bump eslint dependency to ^0.24.0

## 0.14.0

* Bump eslint dependency to ^0.23.0
* Remove no-longer-needed code
* Fix project eslintrc syntax

## 0.13.2

* Remove dependency on through2 to address highWatermark overflow issue (#36)

## 0.13.1

* Update dependencies

## 0.13.0

* Bump eslint dependency to ^0.22.1

## 0.12.0

* Bump eslint dependency to 0.21.x

## 0.11.1

* tidying-up dependencies

## 0.11.0

* Improve code coverage
* Remove support for deprecated/legacy formatters

## 0.10.0

* Bump eslint dependency to 0.20.x

## 0.9.0

* Bump eslint dependency to 0.19.x

## 0.8.0

* Bump eslint dependency to 0.18.x

## 0.7.0

* Bump eslint dependency to 0.17.x

## 0.6.0

* Bump eslint dependency to 0.16.x

## 0.5.0

* Bump eslint dependency to 0.15.x

## 0.4.3

* Fix "rulePaths" typo

## 0.4.2

* Bump bufferstreams dependency to 1.x
* Fix wrong option handling (@Jakobo)

## 0.4.1

* Code refactoring

## 0.4.0

* Bump eslint dependency to 0.14.x
* Use Stream2 instead of older Stream

## 0.3.0

* Import filesystem-local config plugins
* Fix doc typo

## 0.2.2

* Upgraded eslint to 0.13.0
* Fix filesystem-local .eslintrc loading
* Fix filesystem-local .eslintignore loading
* Add failAfterError to fail at the end of the stream instead of the first error (works well with 'format' method)

## 0.2.1 (unreleased)

* Upgraded eslint to 0.11.0

## 0.2.0

* WAY overdue upgrade to eslint (^0.9.2)
* Use eslint's CLIEngine module to do most of the configuration work (yay!)
* Semi-Breaking Change: Remove gulpEslint.linter. Linting will occur with compatible, installed version of eslint.

## 0.1.8

* Use "dependencies" instead of "peerDependencies"
* Update .eslintrc to account for new eol-last rule in eslint 0.7.1
* Check for message.severity when evaluating messages in failOnError

## 0.1.7

* Open eslint dependency to future versions
* Cut out several unnecessary dependencies
* Declare eslint as a peer dependency to support variation in version
* Fix support for nodejs 0.11

## 0.1.6

* Update dependencies, include eslint 0.5.0
* Integrate eslint cli-config changes
  * Accept string array of environments to enable
  * Accept string array of globals ('key:boolean' or 'key')

## 0.1.5

* Do not format when there are no eslint'd files

## 0.1.4

* Update eslint version to 0.4.0

## 0.1.3

* Change default formatter to 'stylish'
* Add support for .eslintignore file
* Skip non-JS files to play well with multi-filetype streams
* Add "failOnError" method to stop streams when an eslint error has occurred
* Use gulp-util's PluginError
* Ignore shebangs in JS files

## 0.1.2

* Update eslint version to 0.3.0

## 0.1.1

* Update dependency versions
* Loosen version peer dependency on Gulp

## 0.1.0

* initial plugin
