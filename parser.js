function isalnum (str, i)
{
    var code = str.charCodeAt(i);
    //        "0" <= code <= "9"           "A" <= code <= "Z"         "a" <= code <= "z"
    return ((code > 47 && code < 58) || (code > 64 && code < 91) || code > 96 && code < 123);
};


/**
 * Parses command-line arguments
 * @param {object} opts
 * @param {Array} argv argument array
 * @param {Function} error callback handler for missing options etc (default: throw exception)
 * @returns {{opt: {}, args: Array}}
 */
function parse (opts, argv, error)
{
    // error can be passed as second argument if argv is left out
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
    for(var i = 0; i < argv.length; i++) {
        var arg = argv[i];

        // short param
        if(arg.length == 2 && arg[0] == '-' && isalnum(arg, 1))
        {
            if(expectsArg) return error({required: last});
            if(!lookupArg(arg[1])) return error({unknown: arg});
            if(!expectsArg) setResult(last, true);
        }

        // long param
        else if(arg.length > 2 && arg[0] == '-' && arg[1] == '-' && isalnum(arg, 2))
        {
            if(expectsArg) return error({required: last});
            var parts = arg.substr(2).split('=');
            arg = parts.shift();
            if(arg.length < 2)
                return error({unknown: '--' + arg});
            if(!lookupArg(arg))
                return error({unknown: '--' + arg});

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
                        return error({argument: arg});
                }
                else
                    setResult(arg, true);
            }
        }

        else if (arg == '--')
        {
            args = args.concat(argv.slice(i+1));
            break;
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
    }

    if(expectsArg)
    {
        return error({required: last});
    }

    // look for missing parameters that have been marked as required
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
        return error({missing: requiredParams});
    }

    return {
        opt: result,
        args: args
    };
};


module.exports = {
    parse: parse
};

