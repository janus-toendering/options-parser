var Token = require('./tokenizer').Token;
var Tokenizer = require('./tokenizer').Tokenizer;
var TokenType = require('./tokenizer').TokenType;

var Str = require('./helper.js').String;
var Obj = require('./helper.js').Object;

function Parser(opts, argv, errorHandler)
{
    this.config = opts;
    this.argv = argv;
    this.errorHandler = errorHandler;

    this.errors = {
        required: [],
        unknown: [],
        expected_value: [],
        unexpected_value: [],
        invalid: []
    };

    this.result = {
        opt: {},
        args: []
    };

    this.generateAliasMap();
    this.normalizeConfig();
};

/*
 * Map aliases to long option names
 */
Parser.prototype.generateAliasMap = function()
{
    var map = {};
    Obj.forEach(this.config, function(name, config){
        if(config.short) 
            map[config.short] = name;
    }, this);
    this.alias = map;
};

Parser.prototype.normalizeConfig = function()
{
    // stupid undocumented short-hands
    // perhaps we should just remove this?
    this.config = Obj.map(this.config, function(name, config){
        if(config === true)
            return { flag: false };
        if(config === false)
            return { flag: true };

        return config;
    }, this);
};

Parser.prototype.setDefaults = function()
{
    Obj.forEach(this.config, function(name, config){
        if(config.default && !(name in this.result.opt))
            this.result.opt[name] = config.default;
    }, this);
};

Parser.prototype.addResultOption = function(name, value)
{
    var config = this.config[name];
    if(config.multi)
    {
        if(name in this.result.opt) this.result.opt[name].push(value);
        else this.result.opt[name] = [value];
    }
    else
        this.result.opt[name] = value ;
};

Parser.prototype.addResultArg = function(value)
{
    this.result.args.push(value);
};

/**
 * Compatibility error-handler 
 * @param {String} type old error name
 * @param {String} opt option name
 */
Parser.prototype.invokeErrorHandler = function(type, opt)
{
    var err = {};
    err[type] = opt;
    this.errorHandler.call(null, err);
};

/**
 * Handle errors the "old" way to keep API compatibility
 */
Parser.prototype.handleErrors = function()
{
    this.errors.unexpected_value.forEach(this.invokeErrorHandler.bind(this, 'argument'));
    this.errors.expected_value.forEach(this.invokeErrorHandler.bind(this, 'required'));
    this.errors.unknown.forEach(this.invokeErrorHandler.bind(this, 'unknown'));
    this.errors.required.forEach(this.invokeErrorHandler.bind(this, 'missing'));
    this.errors.invalid.forEach(this.invokeErrorHandler.bind(this, 'unknown'));
};

Parser.prototype.getTruthValue = function(value)
{
    if(!value) return true;

    var m = value.match(/^(yes|1|true)|(no|0|false)$/i);
    if(!m) return null; else return !!m[1];
};

Parser.prototype.parse = function()
{
    var token, opt, val, argumentValue, config;

    var tokenizer = new Tokenizer(this.argv);
    while(!tokenizer.isEof())
    {
        token = tokenizer.next();
        val = token.getValue();
        argumentValue = '';

        switch(token.getType())
        {
            case TokenType.VALUE:
                this.addResultArg(val);
                continue;
            case TokenType.SHORT_ARG:
                opt = this.alias[val] || val;
                break;
            case TokenType.LONG_ARG:
                opt = val;
                break;
            case TokenType.LONG_ARG_WITH_VALUE:
                opt = val[0];
                argumentValue = val[1];
                break;
            default:
                this.errors.invalid.push(val);
                continue;
        }

        config = this.config[opt];
        if(config)
        {
            if(config.flag)
            {
                var value = this.getTruthValue(argumentValue);
                if(value === null)
                    this.errors.unexpected_value.push(opt);
                else
                    this.addResultOption(opt, value);
            } 
            else 
            {
                if(argumentValue)
                    this.addResultOption(opt, argumentValue);
                else if(tokenizer.peek().getType() != TokenType.VALUE)
                    this.errors.expected_value.push(val);
                else
                    this.addResultOption(opt, tokenizer.next().getValue());
            }
        }
        else 
        {
            this.errors.unknown.push(opt);
        }
    }

    this.setDefaults();

    // check for required options that were left out
    Obj.forEach(this.config, function(name, config){
        if(config.required && !(name in this.result.opt))
            this.errors.required.push(name);
    }, this);


    this.handleErrors();

    return this.result;
};

module.exports = {
    /**
     * Parses command-line arguments
     * @param {object} opts
     * @param {Array} argv argument array
     * @param {Function} error callback handler for missing options etc (default: throw exception)
     * @returns {{opt: {}, args: Array}}
     */
    parse: function(opts, argv, error)
    {
        var parser = new Parser(opts, argv, error);
        return parser.parse();
    }
};
