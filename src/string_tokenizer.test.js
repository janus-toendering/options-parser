var tokenizer = require('./string_tokenizer.js');
    
describe("allTokens", () => {
    test("should split words on whitespace boundries", () => {
        var input = 'trying is  the   first step to failure --homer simpson';
        var expected = ['trying', 'is', 'the', 'first', 'step', 'to', 'failure', '--homer', 'simpson'];
        var result = tokenizer.create(input).allTokens();
        expect(result).toEqual(expected);
    });

    test("should handle the empty string", () => {
        var input = '""';
        var expected = [''];
        var result = tokenizer.create(input).allTokens();
        expect(result).toEqual(expected);

        input = "''";
        expected = [''];
        result = tokenizer.create(input).allTokens();
        expect(result).toEqual(expected);
    });

    test("should handle simple double quotes", () => {
        var input = '"trying is" "" the   first st"ep" to failure --homer simpson';
        var expected = ['trying is', '', 'the', 'first', 'step', 'to', 'failure', '--homer', 'simpson'];
        var result = tokenizer.create(input).allTokens();
        expect(result).toEqual(expected);
    });

    test("should handle simple single quotes", () => {
        var input = '\'trying is\' \'\' the   first st\'ep\' to failure --homer simpson';
        var expected = ['trying is', '', 'the', 'first', 'step', 'to', 'failure', '--homer', 'simpson'];
        var result = tokenizer.create(input).allTokens();
        expect(result).toEqual(expected);
    });

    test("should handle quotes in words", () => {
        var input1 = 'words" are" meaningless';
        var input2 = 'words\' are\' meaningless';
        
        var expected = ['words are', 'meaningless'];
        
        var result1 = tokenizer.create(input1).allTokens();
        var result2 = tokenizer.create(input2).allTokens();
        
        expect(result1).toEqual(expected);
        expect(result1).toEqual(result2);
    });

    test("should handle escapes outside of quotes", () => {
        var input1 = "\\\\";
        var input2 = "\\a";
        var input3 = "\\\" another word";

        var result1 = tokenizer.create(input1).allTokens();
        var result2 = tokenizer.create(input2).allTokens();
        var result3 = tokenizer.create(input3).allTokens();

        expect(result1).toEqual(["\\"]);
        expect(result2).toEqual(["a"]);
        expect(result3).toEqual(['"', "another", "word"]);
    });

    test("should handle escapes in double quotes", () => {
        var input = '"a \\" is called a quote"';
        var expected = ['a " is called a quote'];
        var result = tokenizer.create(input).allTokens();
        expect(result).toEqual(expected);
    });

    test("should handle escapes in single quotes", () => {
        var input = "'a \\ in single quotes'";
        var expected = ['a \\ in single quotes'];
        var result = tokenizer.create(input).allTokens();
        expect(result).toEqual(expected);
    });

    test("should handle space escapes", () => {
        var input1 = 'word \\ word';
        var input2 = 'word \\  word';

        var result1 = tokenizer.create(input1).allTokens();
        var result2 = tokenizer.create(input2).allTokens();

        expect(result1).toEqual(['word', ' word']);
        expect(result2).toEqual(['word', ' ', 'word']);
    });

    test("should handle empty input", () => {
        var input = '';
        var result = tokenizer.create(input).allTokens();
        expect(Object.keys(result)).toHaveLength(0);
    });
});
