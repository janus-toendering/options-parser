var util = require('util');

var OptionsParser = function()
{
};

OptionsParser.prototype.err_unknown = "Unknown option %s";

OptionsParser.prototype.err_required = "Option %s missing required parameter";

OptionsParser.prototype.err_argument = "Options %s does not take an argument";

OptionsParser.prototype.err_missing = "Options %s are required";

/**
 * Returns true if the character at offset i in str is in [a-z0-9]
 * @param {String} str
 * @param {number} i
 * @returns {boolean}
 */
OptionsParser.prototype.isalnum = function(str, i)
{
    var code = str.charCodeAt(i);
    //        "0" <= code <= "9"           "A" <= code <= "Z"         "a" <= code <= "z"
    return ((code > 47 && code < 58) || (code > 64 && code < 91) || code > 96 && code < 123);
};

/**
 * Parses command-line arguments
 * @param {object} opts
 * @param {?Array} argv argument array (default: process.argv(2..))
 * @returns {{opt: {}, args: Array}}
 */
OptionsParser.prototype.parse = function(opts, argv)
{

    opts = opts || {};
    argv = argv || process.argv.slice(2);
    var result = {};

    var args = [];
    var last = null;
    var expectsArg = false;

    // helper function for handling argument aliases and values
    var lookupArg = function(arg)
    {
        if(arg in opts)
        {
            expectsArg = (opts[arg] === 1) || !opts[arg].flag;
            last = arg;
            return arg;
        }
        else if (arg.length == 1)
        {
            for(var key in opts)
                if(opts[key].short == arg)
                {
                    expectsArg = !(opts[key].flag);
                    last = key;
                    return arg;
                }
        }
        return false;
    }

    // helper function for setting arguments in result
    var setResult = function(arg, value)
    {
        if(opts[arg].multi)
        {
            if(!result[arg]) result[arg] = [value];
            else result[arg].push(value);
        }
        else
            result[arg] = value;
    }

    // loop over all arguments
    argv.forEach(function(arg){
        // short param
        if(arg.length == 2 && arg[0] == '-' && this.isalnum(arg, 1))
        {
            if(expectsArg) (function(arg) { throw new Error(util.format(this.err_required, arg)); })(last);
            if(!lookupArg(arg[1]))
                throw new Error(util.format(this.err_unknown, arg));

            if(!expectsArg) setResult(last, true);
        }

        // long param
        else if(arg.length > 2 && arg[0] == '-' && arg[1] == '-' && this.isalnum(arg, 2))
        {
            if(expectsArg) throw new Error(util.format(this.err_required, last));
            var parts = arg.substr(2).split('=');
            arg = parts.shift();
            if(!lookupArg(arg))
                throw new Error(util.format(this.err_unknown, "--" + arg));

            if(expectsArg) {
                // is parameter of type --param=value ?
                if(parts.length > 0) {
                    setResult(arg, parts.join('='));
                    expectsArg = false;
                }
            } else {
                // is parameter of type --param=value?
                if(parts.length > 0)
                {
                    var a = parts.join('=');
                    if(/^(false|0|no)$/i.test(a))
                        setResult(arg, false);
                    else if(/^(true|1|yes)$/i.test(a))
                        setResult(arg, true);
                    else
                        // is parameter of type --param=value but shouldn't?
                        throw new Error(util.format(this.err_argument, arg));
                }
                else
                    setResult(arg, true);
            }
        }

        // required argument
        else if(expectsArg)
        {
            setResult(last, arg);
            expectsArg = false;
        }

        // arg that isn't an option or value
        else {
            args.push(arg);
        }
    }, this);

    if(expectsArg)
    {
        throw new Error(util.format(this.err_required, last));
    }

    var requiredParams = [];
    for(var arg in opts)
    {
        if(opts[arg].required && !(arg in result))
            requiredParams.push(arg);

        if(opts[arg].default && !(arg in result))
            result[arg] = opts[arg].default;
    }

    if(requiredParams.length > 0)
    {
        throw new Error(util.format(this.err_missing, requiredParams.join(', ')));
    }

    return {
        opt: result,
        args: args
    };
};

OptionsParser.prototype.help = function()
{
    // TODO
};

module.exports = new OptionsParser();
