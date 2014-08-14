var fs = require('fs');
var util = require('util');

exports.int = function(msg)
{
	msg = msg || "Expected value to be an integer";
	return function(value, replace)
	{
		return /^-?[0-9]+$/.test(value) || msg;
	}
}

exports.regexp = function(msg, regexp)
{
	if(!util.isRegExp(regexp))
		regexp = new RegExp(regexp);
	
	msg = msg || "Invalid value";
	return function(value, replace)
	{
		return regexp.test(value) || msg;
	}
}
exports.regex = exports.regexp;

// todo - check for legal filename/path
exports.file = {};

exports.file.open = function(msg, options)
{
	msg = msg || "Could not open file or invalid filename";
	options = options || { flags: 'r+' };
	return function(value, replace)
	{
		try {
			replace({
				name: value,
				fd: fs.openSync(value, options.flags || 'r+', options.mode)
			});
			return true;
		} catch(e){
			return msg;
		}
	}
}

exports.file.open.read = function(msg, options)
{
	options = options || {};
	options.flags = 'r';
	return exports.file.open(msg, options);
}

exports.file.open.write = function(msg, options)
{
	options = options || {};
	options.flags = 'w';
	return exports.file.open(msg, options);
}

