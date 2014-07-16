var util = require('util');
var tokenizer = require('./tokenizer');

Obj = {
    // classic reduce (foldl) function but for objects
    reduce: function(obj, cb, initial, ctx)
    {
        var acc = initial;
        for(var key in obj)
            acc = cb.call(ctx, acc, key, obj[key]);
        return acc;
    }

};


var OptionsParser = function()
{
};

OptionsParser.prototype.err_unknown = "Unknown option %s";

OptionsParser.prototype.err_required = "Option %s missing required argument";

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
 * Default error handler. Throws exception.
 * @param {Object} err
 */
OptionsParser.prototype.defaultErrorHandler = function(err)
{
    if(err.required)
        throw new Error(util.format(this.err_required, err.required));
    if(err.argument)
        throw new Error(util.format(this.err_argument, err.argument));
    if(err.missing)
        throw new Error(util.format(this.err_missing, err.missing.join(', ')));
    /* istanbul ignore else */
    if(err.unknown)
        throw new Error(util.format(this.err_unknown, err.unknown));
};

/**
 * Parses command-line arguments
 * @param {object} opts
 * @param {?Array|String} argv argument array (default: process.argv(2..))
 * @param {?Function} error callback handler for missing options etc (default: throw exception)
 * @returns {{opt: {}, args: Array}}
 */
OptionsParser.prototype.parse_ = function(opts, argv, error)
{
    opts = opts || {};
    // error can be passed as second argument if argv is left out
    error = (argv instanceof Function) ? /** @type {Function} */ (argv) : (error || this.defaultErrorHandler.bind(this));
    
    if(typeof argv == "string" || argv instanceof String)
    {
        argv = tokenizer.create(argv).allTokens();
    } else 
    {
        argv = Array.isArray(argv) ? argv :  process.argv.slice(2);
    }

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
        if(arg.length == 2 && arg[0] == '-' && this.isalnum(arg, 1))
        {
            if(expectsArg) return error({required: last});
            if(!lookupArg(arg[1])) return error({unknown: arg});
            if(!expectsArg) setResult(last, true);
        }

        // long param
        else if(arg.length > 2 && arg[0] == '-' && arg[1] == '-' && this.isalnum(arg, 2))
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

/**
 * Finds help arguments in opts
 * @param {object} opts
 * @return Array
 * @remarks changes the opts in place to imply "flag" on help params
 */
OptionsParser.prototype.processHelpArgs_ = function(opts)
{
    var helpArgs = [];
    for(var argName in opts)
    {
        if(opts[argName].showHelp) 
        {
            helpArgs.push({ name: argName, options: opts[argName].showHelp });
            
            // set flag to true if omitted from help params
            if(!('flag' in opts[argName]))
            {
                opts[argName].flag = true;
            }
       }
    }
    return helpArgs;
};

/**
 * Parses command-line arguments
 * @param {object} opts
 * @param {?Array|String} argv argument array (default: process.argv(2..))
 * @param {?Function} error callback handler for missing options etc (default: throw exception)
 * @returns {{opt: {}, args: Array}}
 */
OptionsParser.prototype.parse = function(opts, argv, error)
{
    var helpArgs = this.processHelpArgs_(opts);
    var result = this.parse_(opts, argv, error);

    helpArgs.some(function(arg){
        if(result.opt[arg.name])
        {
            this.help(opts, arg.options);
            if(typeof arg.options.callback === "function")
                arg.options.callback.call();

            if(!arg.options.noExit)
                process.exit(0);
        }
    }, this);

    return result;
};

/**
 * Create new string with ch repeated count times
 * @param {String} ch character to repeat (should have length = 1)
 * @param {Number} count number of repetitions of ch
 * @return {String}
 */
OptionsParser.prototype.repeatChar_ = function(ch, count)
{
    var s = '';
    for(var i = 0; i < count; i++)
        s += ch;
    return s;
};

/**
 * Pad a string with spaces up to a minimum length 
 * @param {String} s string to pad
 * @param {Number} len minimum length
 * @return {String} s right-padded with spaces up to len
 */
OptionsParser.prototype.padString_ = function(s, len)
{
    return s + this.repeatChar_(' ', len - s.length);
};

/**
 * Break a string into lines of len characters and break on spaces
 * @param {String} s 
 * @param {Number} len
 * @return {Array.<String>}
 * @remarks it might return longers lines if s contains words longer than len
 */
OptionsParser.prototype.fitString_ = function(s, len)
{
    s = s.trim();
    if(s.length <= len) return [s];

    var result = [];
    while(s.length > len)
    {
        var i = len
        for(; s[i] != ' ' && i >= 0; i--) 
            /* empty loop */ ;

        if(i == -1)
        {
            for(i = len + 1; s[i] != ' ' && i < s.length; i++) 
                /* empty loop */ ;
            
            if(i == s.length)
            {
                result.push(s);
                return result;
            }
        }
        result.push(s.substr(0, i));
        s = s.substr(i).trimLeft();
    }
    result.push(s);
    return result;
};

/**
 * Get maximum width of arguments
 * @param {object} opts
 * @return {Number}
 */
OptionsParser.prototype.getArgumentsWidth_ = function(opts)
{
    var maxArgLength = Obj.reduce(opts, function(prev, name, opt){
        var len = name.length + (opt.short ? 4 : 0);
        if(opt.flag !== true)
        {
            var valLen = (opt.varName ? opt.varName.length : 3) + 1;
            if(opt.short) valLen *= 2;
            len += valLen;
        }
        return (prev < len) ? len : prev;
    }, 0);
    return maxArgLength + 2;
};

/**
 * Get default .help options
 * @params {object} options
 * @return {object} 
 */
OptionsParser.prototype.getHelpOptions_ = function(options)
{
    if(typeof options !== 'object') options = {};
    return {
        output: 
            options.output || util.puts,
        paddingLeft: 
            (typeof options.paddingLeft === "number" && options.paddingLeft >= 0) ? options.paddingLeft : 2,
        separator: 
            options.separator || '   ',
        columns: 
            options.columns || process.stdout.columns,
        banner:
            options.banner,
        skipEmpty:
            options.skipEmpty
    };
};

/**
 * Show help for options
 * @param {object} opts
 * @param {object} options
 */
OptionsParser.prototype.help = function(opts, options)
{
    options = this.getHelpOptions_(options);

    var paddingLeft   = this.repeatChar_(' ', options.paddingLeft);
    var maxArgLength  = this.getArgumentsWidth_(opts) + options.paddingLeft;
    var maxTextLength = options.columns - maxArgLength - options.separator.length;

    if(options.banner) options.output(options.banner);

    for(var optName in opts)
    {
        // fit help text to column width 
        var helpText = this.fitString_(opts[optName].help || '', maxTextLength);
        if(helpText == '' && options.skipEmpty) // skip empty help text?
            continue;

        // create options help string
        var varName = (opts[optName].flag !== true) ? " " + (opts[optName].varName || "VAL") : "";
        var name = paddingLeft + (optName.length == 1 ? '-' : '--') + optName + varName;
        if(opts[optName].short) 
            name += ', -' + opts[optName].short + varName;

        // output options and (first line of) help text
        var line = this.padString_(name, maxArgLength) + options.separator + helpText.shift();
        options.output(line);

        // print addional help text lines if it didn't fit in one line
        if(helpText.length)
        {
            var padString = this.repeatChar_(' ', maxArgLength + options.separator.length);
            helpText.forEach(function(line){
                options.output(padString + line);
            }, this);
        }
    }
};

module.exports = new OptionsParser();

