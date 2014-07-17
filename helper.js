/**
 * Determine if the character at position i is in [a-zA-Z0-9]
 * @param {String} str
 * @param {Number} i
 * @return {Boolean}
 */
function isAlphaNumericAt(str, i)
{
    var code = str.charCodeAt(i);
    //        "0" <= code <= "9"           "A" <= code <= "Z"         "a" <= code <= "z"
    return ((code > 47 && code < 58) || (code > 64 && code < 91) || code > 96 && code < 123);
}

/**
 * Create new string with ch repeated count times
 * @param {String} ch character to repeat (should have length = 1)
 * @param {Number} count number of repetitions of ch
 * @return {String}
 */
function repeat(ch, count)
{
    var s = '';
    for(var i = 0; i < count; i++)
        s += ch;
    return s;
}

/**
 * Pad a string with spaces up to a minimum length 
 * @param {String} s string to pad
 * @param {Number} len minimum length
 * @return {String} s right-padded with spaces up to len
 */
function pad(s, len)
{
    return s + repeat(' ', len - s.length);
}

/**
 * Break a string into lines of len characters and break on spaces
 * @param {String} s 
 * @param {Number} len
 * @return {Array.<String>}
 * @remarks it might return longers lines if s contains words longer than len
 */
function fitWidth(s, len)
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
}

/**
 * Classic reduce (foldl) function but for objects
 * @param {Object} obj
 * @param {Function} cb
 * @param {any} initial
 * @param {Object} ctx
 * @return {any}
 */
// 
function reduce (obj, cb, initial, ctx)
{
    var acc = initial;
    for(var key in obj)
        acc = cb.call(ctx, acc, key, obj[key]);
    return acc;
}

function forEach(obj, cb, ctx)
{
    for(var key in obj)
        cb.call(ctx, key, obj[key]);
}

function isString(str)
{
    return (typeof str == "string" || str instanceof String);
}

module.exports = {

    isString: isString,

	String: {
		repeat: repeat,
		pad: pad,
		fitWidth: fitWidth,
		isAlphaNumericAt: isAlphaNumericAt
	},

	Object: {
		reduce: reduce,
        forEach: forEach
	}

};


