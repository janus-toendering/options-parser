var util = require('util');
var tokenizer = require('./string_tokenizer');
var parser = require('./parser');
var helper = require('./helper.js');

var Str = helper.String;
var Obj = helper.Object;

var OptionsParser = function()
{
};

OptionsParser.prototype.err_unknown = "Unknown option %s";

OptionsParser.prototype.err_required = "Option %s missing required argument";

OptionsParser.prototype.err_argument = "Options %s does not take an argument";

OptionsParser.prototype.err_missing = "Options %s are required";

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
    if(err.validation)
        throw new Error(err.validation);
    /* istanbul ignore else */
    if(err.unknown)
        throw new Error(util.format(this.err_unknown, err.unknown));
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
    opts = opts || {};

    // error can be passed as second argument if argv is left out
    error = (argv instanceof Function) ? /** @type {Function} */ (argv) : (error || this.defaultErrorHandler.bind(this));

    if(argv === null || argv === undefined || argv instanceof Function)
        argv = process.argv.slice(2);

    var helpArgs = this.processHelpArgs_(opts);
    var result = parser.parse(opts, argv, error);

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

    this.validateTypes_(opts, result, error);

    return result;
};

/**
 * @param {Function} typeFn
 * @param {string} value
 * @param {Function} replaceFn
 * @param {Function} errorFn
 */
OptionsParser.prototype.validateType_ = function(typeFn, value, replaceFn, errorFn)
{
    var errorMsg = typeFn.call(typeFn, value, replaceFn);
    if(helper.isString(errorMsg))
    {
        errorFn({validation: errorMsg });
    }
};

/**
 * @param {object} opts
 * @param {object} result
 * @param {Function} err
 */
OptionsParser.prototype.validateTypes_ = function(opts, result, err)
{
    Obj.forEach(opts, function(name, config){
        if(!(typeof config === "object")) 
            return;
        
        if((name in result.opt) && (typeof config.type === "function"))
        {
            var value = result.opt[name];
            if(Array.isArray(value))
            {
                value.forEach(function(val, index){
                    this.validateType_(config.type, val, function(newValue){
                        result.opt[name][index] = newValue;
                    }, err);
                }, this);
            }
            else
            {
                this.validateType_(config.type, value, function(newValue){
                    result.opt[name] = newValue;
                }, err);
            }
        }
    }, this);
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
 * Get banner with variables in options.banner replaced
 * @param {object} opts
 * @param {object} options
 * @return {false|string}
 */
OptionsParser.prototype.getHelpBanner_ = function(opts, options)
{
    var banner = options.banner;

    var variables = {
        REQ_OPTS: function(){
            return Obj.reduce(opts, function(prev, key, val){
                if(!val.required)
                    return prev;

                var result = val.short ? '-' + val.short : '--' + key;
                if(!val.flag)
                    result += " " + (val.varName || "VAL");

                if(prev != "") 
                    return prev + " " + result;
                
                return result;
            }, "");
        }
    };

    for(var key in variables)
    {
        var v = ' %' + key + '%';
        if(banner.indexOf(v) !== -1)
        {
            var val = variables[key]();
            if(val != "") val = " " + val;
            banner = banner.replace(v, val);
        }
    }

    return banner;
};

/**
 * Show help for options
 * @param {object} opts
 * @param {object} options
 */
OptionsParser.prototype.help = function(opts, options)
{
    options = this.getHelpOptions_(options);

    var paddingLeft   = Str.repeat(' ', options.paddingLeft);
    var maxArgLength  = this.getArgumentsWidth_(opts) + options.paddingLeft;
    var maxTextLength = options.columns - maxArgLength - options.separator.length;

    if(options.banner) options.output(this.getHelpBanner_(opts, options));

    for(var optName in opts)
    {
        var opt = opts[optName];
        if(!opt.help && options.skipEmpty) // skip empty help text?
            continue;

        // fit help text to column width 
        var helpText = Str.fitWidth(opt.help || '', maxTextLength);

        // create options help string
        var varName = (opt.flag !== true) ? " " + (opt.varName || "VAL") : "";
        var name = paddingLeft + (optName.length == 1 ? '-' : '--') + optName + varName;
        if(opt.short) 
            name += ', -' + opt.short + varName;

        // output options and (first line of) help text
        var line = Str.pad(name, maxArgLength) + options.separator + helpText.shift();
        options.output(line);

        // print addional help text lines if it didn't fit in one line
        if(helpText.length)
        {
            var padString = Str.repeat(' ', maxArgLength + options.separator.length);
            helpText.forEach(function(line){
                options.output(padString + line);
            }, this);
        }
    }
};

module.exports = new OptionsParser();
module.exports.type = require('./types.js');

