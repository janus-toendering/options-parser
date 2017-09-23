var helper = require('./helper');
var stringTokenizer = require('./string_tokenizer');

var Str = helper.String;

var TokenType = {
	EOF: 0,
	VALUE: 1,
	SHORT_ARG: 2,
	LONG_ARG: 3,
	LONG_ARG_WITH_VALUE: 4,
	INVALID: 99
};

function Token(type, value)
{
	this.type_ = type;
	this.value_ = value;
};

Token.prototype.type_;
Token.prototype.value_;
Token.prototype.source_;

Token.prototype.getType = function()
{
	return this.type_;
};

Token.prototype.getValue = function()
{
	return this.value_;
};

function Tokenizer(input)
{
	if(helper.isString(input))
		input = stringTokenizer.create(input).allTokens();

	this.input_ = input;
};

Tokenizer.prototype.index_ = 0;

Tokenizer.prototype.endOfArguments_ = false;

Tokenizer.prototype.peek = function()
{
	if(this.index_ >= this.input_.length)
	{
		return new Token(TokenType.EOF);
	}

	var arg = this.input_[this.index_];

	if(arg.length == 0)
	{
		this.index_++;
		return this.peek();
	}

	if(this.endOfArguments_)
	{
		return new Token(TokenType.VALUE, arg);
	}

	if(arg == '--') 
	{
		this.endOfArguments_ = true;
		this.index_++;
		return this.peek();
	}

	if(arg[0] != '-')
		return new Token(TokenType.VALUE, arg);

	if(arg.length == 2 && Str.isAlphaNumericAt(arg, 1))
		return new Token(TokenType.SHORT_ARG, arg[1]);

	if(arg.length > 3 && arg[1] == '-' && Str.isAlphaNumericAt(arg, 2))
	{
		var parts = arg.substr(2).split('=');
		if(parts.length > 1)
			return new Token(TokenType.LONG_ARG_WITH_VALUE, [parts[0], parts.slice(1).join('=')]);

		return new Token(TokenType.LONG_ARG, parts[0]);
	}
		
	return new Token(TokenType.INVALID, arg);
};

Tokenizer.prototype.next = function()
{
	var token = this.peek();
	this.index_++;
	return token;
};

Tokenizer.prototype.isEof = function()
{
	return this.peek().getType() == TokenType.EOF;
};

module.exports.Token = Token;
module.exports.Tokenizer = Tokenizer;
module.exports.TokenType = TokenType;
