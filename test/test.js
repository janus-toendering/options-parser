var should = require('should');
//var Scanner = require('../scanner');
//var TokenType = require('../tokentype');
var parser = require('../parser.js');
var tokenizer = require('../tokenizer.js');

describe("OptionsParser", function(){

    describe("#parse", function(){
       it("should parse short flag parameter", function(){
           var argv = ["-a"];
           var result = parser.parse({
               'a': { flag: true }
           }, argv);

           result.opt.should.have.property('a', true);
           result.args.should.be.empty;
       });

        it("should parse long flag parameter", function(){
            var argv = ["--long"];
            var result = parser.parse({
                'long': { flag: true}
            }, argv);

            result.opt.should.have.property('long', true);
            result.args.should.be.empty;
        });

        it("should parse long flag alias ", function(){
            var argv = ["-l"];
            var result = parser.parse({
                'long': { flag: true, short: 'l' }
            }, argv);

            result.opt.should.have.property('long', true);
            result.args.should.be.empty;
        });

        it("should parse short parameter with required value", function(){
            var argv = ["-a", "bba"];
            var result = parser.parse({
                'a': 1
            }, argv);

            result.opt.should.have.property("a", "bba");
            result.args.should.be.empty;
        });

        it("should accept empty argv with optional parameters", function(){
           var argv = [];
           var result = parser.parse({
               'a': { required: false }
           }, argv);

           result.should.not.have.property("a");
            result.args.should.be.empty;
        });

        it("should throw on unexpected short arguments", function(){
            var argv = ["-b"];
            (function(){ parser.parse({}, argv) }).should.throw(/Unknown option/);
        });

        it("should throw on unexpected long arguments", function(){
            var argv = ["--long"];
            (function(){ parser.parse({}, argv) }).should.throw(/Unknown option/);
        });

        it("should parse non-flag short parameter", function(){
            var argv = ["-l", "arg"];
            var result = parser.parse({
                'l': 1
            }, argv);

            result.opt.should.have.property("l", "arg");
            result.args.should.be.empty;
        });

        it("should parse non-flag long parameter", function(){
            var argv = ["--long", "arg"];
            var result = parser.parse({
                'long': 1
            }, argv);

            result.opt.should.have.property("long", "arg");
            result.args.should.be.empty;
        });

        it("should shift left-over arguments to args", function(){
            var argv = ["arg0", "--long", "arg1", "arg2", "arg3"];
            var result = parser.parse({
                'long': 1
            }, argv);

            result.opt.should.have.property("long", "arg1");
            result.args.should.eql(["arg0", "arg2", "arg3"]);
        });

        it("should shift left-over arguments to args #2", function(){
            var argv = ['arg0', '--long', 'arg1', 'arg2', 'arg3'];
            var result = parser.parse({
                'long': { flag: true }
            }, argv);

            result.opt.should.have.property('long');
            result.args.should.have.length(4);
            result.args.should.eql(["arg0", "arg1","arg2", "arg3"]);
        });

        it("should support --long=truthy|falsy for flags", function(){
            var opts = { 'long': { flag: true } };

            var argv = ['--long=1'];
            parser.parse(opts, argv).opt.should.have.property('long', true);

            argv = ['--long=yes'];
            parser.parse(opts, argv).opt.should.have.property('long', true);

            argv = ['--long=true'];
            parser.parse(opts, argv).opt.should.have.property('long', true);

            argv = ['--long=0'];
            parser.parse(opts, argv).opt.should.have.property('long', false);

            argv = ['--long=no'];
            parser.parse(opts, argv).opt.should.have.property('long', false);

            argv = ['--long=false'];
            parser.parse(opts, argv).opt.should.have.property('long', false);
        });

        it("should support a string argument for argv", function(){
            var opts = { param: true, a: { flag: true }, something: { flag: true } };
            var result = parser.parse(opts, '--param=value -a --something input.txt');
            result.opt.should.have.property('param', 'value');
            result.opt.should.have.property('a', true);
            result.opt.should.have.property('something', true);
            result.args.should.eql(['input.txt']);
        });

        it("should parse --key=value params", function(){
            var argv = ['--key=value'];
            parser.parse({"key": 1}, argv).opt.should.have.property("key", "value");
        });

        it("should let later params take precedence", function(){
            var argv = ['-a', '1', '-a', '2'];
            parser.parse({'a': 1}, argv).opt.should.have.property("a", 2);

            var argv = ['--all', '1', '--all', '2'];
            parser.parse({'all': 1}, argv).opt.should.have.property("all", 2);
        });

        it("should parse multi-params correctly", function(){
            var argv = ['-a', '1', '-a', '2'];
            parser.parse({'a': {multi:true}}, argv).opt.should.have.property("a", [1, 2]);

            var argv = ['--all', '1', '--all', '2'];
            parser.parse({'all': {multi:true}}, argv).opt.should.have.property("all", [1, 2]);
        });

        it("should parse '--user=janus --pass 123 janus.txt -r --input=1.txt -i 2.txt' correctly", function(){
            var argv = ["--user=janus", "--pass", "123", "output.txt", "-r", "--input=1.txt", "-i", "2.txt"];

            var result = parser.parse({
                'user': {
                    required: true
                },
                'pass': { required: true },
                'r': { flag: true },
                'input': {
                    short: 'i',
                    multi: true
                }
            }, argv);

            result.opt.should.have.property("user","janus");
            result.opt.should.have.property("pass","123");
            result.opt.should.have.property("r", true);
            result.opt.should.have.property("input", ["1.txt", "2.txt"]);
            result.args.should.be.eql(["output.txt"]);

        });

        it("should use default values", function(){
            var argv = [];
            parser.parse({ "user": { default: "joe" }}, argv).opt.should.have.property("user", "joe");
        });

        it("should complain about missing required parameters", function(){
            var argv = [];
            (function() { parser.parse({'somearg': { required: true }}, argv) }).should.throw();
        });

        it("should not throw when passed an error handler", function(){
            var argv = [];
            (function() { parser.parse({'somearg': { required: true }}, argv, function(){}) }).should.not.throw();

        });

        it("should not throw when passed an error handler as second argument", function(){
            (function() { parser.parse({'somearg': { required: true }}, function(e){}) }).should.not.throw();
        });

    });

});


describe("Tokenizer", function(){
    describe("allTokens", function(){
        it("should split words on whitespace boundries", function(){
            var input = 'trying is  the   first step to failure --homer simpson';
            var expected = ['trying', 'is', 'the', 'first', 'step', 'to', 'failure', '--homer', 'simpson'];
            var result = tokenizer.create(input).allTokens();
            result.should.eql(expected);
        });

        it("should handle the empty string", function(){
            var input = '""';
            var expected = [''];
            var result = tokenizer.create(input).allTokens();
            result.should.eql(expected);

            input = "''";
            expected = [''];
            result = tokenizer.create(input).allTokens();
            result.should.eql(expected);
        });

        it("should handle simple double quotes", function(){
            var input = '"trying is" "" the   first st"ep" to failure --homer simpson';
            var expected = ['trying is', '', 'the', 'first', 'step', 'to', 'failure', '--homer', 'simpson'];
            var result = tokenizer.create(input).allTokens();
            result.should.eql(expected);
        });

        it("should handle simple single quotes", function(){
            var input = '\'trying is\' \'\' the   first st\'ep\' to failure --homer simpson';
            var expected = ['trying is', '', 'the', 'first', 'step', 'to', 'failure', '--homer', 'simpson'];
            var result = tokenizer.create(input).allTokens();
            result.should.eql(expected);
        });

        it("should handle quotes in words", function(){
            var input1 = 'words" are" meaningless';
            var input2 = 'words\' are\' meaningless';
            
            var expected = ['words are', 'meaningless'];
            
            var result1 = tokenizer.create(input1).allTokens();
            var result2 = tokenizer.create(input2).allTokens();
            
            result1.should.eql(expected);
            result1.should.eql(result2);
        });

        it("should handle escapes outside of quotes", function(){
            var input1 = "\\\\";
            var input2 = "\\a";
            var input3 = "\\\" another word";

            var result1 = tokenizer.create(input1).allTokens();
            var result2 = tokenizer.create(input2).allTokens();
            var result3 = tokenizer.create(input3).allTokens();

            result1.should.eql(["\\"]);
            result2.should.eql(["a"]);
            result3.should.eql(['"', "another", "word"]);
        });

        it("should handle escapes in double quotes", function(){
            var input = '"a \\" is called a quote"';
            var expected = ['a " is called a quote'];
            var result = tokenizer.create(input).allTokens();
            result.should.eql(expected);
        });

        it("should handle escapes in single quotes", function(){
            var input = "'a \\ in single quotes'";
            var expected = ['a \\ in single quotes'];
            var result = tokenizer.create(input).allTokens();
            result.should.eql(expected);
        });

        it("should handle space escapes", function(){
            var input1 = 'word \\ word';
            var input2 = 'word \\  word';

            var result1 = tokenizer.create(input1).allTokens();
            var result2 = tokenizer.create(input2).allTokens();

            result1.should.eql(['word', ' word']);
            result2.should.eql(['word', ' ', 'word']);
        });

        it("should handle empty input", function(){
            var input = '';
            var result = tokenizer.create(input).allTokens();
            result.should.be.empty;
        });

    });
});

