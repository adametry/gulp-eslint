# Changelog

## 0.1.0

* initial plugin

## 0.1.1

* Update dependency versions
* Loosen version peer dependency on Gulp

## 0.1.2

* Update eslint version to 0.3.0

## 0.1.3

* Change default formatter to 'stylish'
* Add support for .eslintignore file
* Skip non-JS files to play well with multi-filetype streams
* Add "failOnError" method to stop streams when an eslint error has occurred
* Use gulp-util's PluginError
* Ignore shebangs in JS files

## 0.1.4

* Update eslint version to 0.4.0

## 0.1.5

* Do not format when there are no eslint'd files

## 0.1.6

* Update dependencies, include eslint 0.5.0
* Integrate eslint cli-config changes
  * Accept string array of environments to enable
  * Accept string array of globals ('key:boolean' or 'key')

