
function Tokenizer(input)
{
	this.input = input;
	this.len = input.length;
}

Tokenizer.prototype.input = null;

Tokenizer.prototype.len = 0;

Tokenizer.prototype.pos = 0;

Tokenizer.prototype.nextToken = function()
{
	var state = 0;
	var token = null;
	var strch = "";
	var escape = false;
	var saveEscape = false;
	while(this.pos < this.len)
	{
		var ch = this.input[this.pos];
		saveEscape = escape;

		switch(state)
		{
			// eat up whitespace between tokens
			case 0:
				if(ch != ' ' && ch != '\t')
				{
					state = 1;
					token = "";
					continue;
				}
				break;

			case 1:
				// check for start of string
				if(ch == '"' || ch == "'")
				{
					if(escape)
					{
						token += ch;
					} 
					else {
						state = 2;
						strch = ch;
					}
				}
				// end of token?
				else if(!escape && (ch == ' ' || ch == '\t'))
				{
					this.pos++;
					return token;
				}
				else {
					if(!escape && ch == "\\")
					{
						escape = true;
					}
					else
					{
						token += ch;
					}
				}
				break;

			// string handling
			case 2:
				if(ch == strch)
				{
					if(escape && ch == '"')
						token += ch;
					else state = 1;
				}
				else
				{
					if(!escape && ch == "\\" && strch == '"')
						escape = true;
					else token += ch;
				}
				break;
		}

		escape = (saveEscape != escape);
		this.pos++;
	}

	return token;
};

Tokenizer.prototype.allTokens = function()
{
	var tokens = [];
	var token = this.nextToken();
	while(token != null)
	{
		tokens.push(token);
		token = this.nextToken();
	}
	return tokens;
};

module.exports = {
	create: function(str){
		return new Tokenizer(str);
	}
};

