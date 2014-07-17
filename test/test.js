var should = require('should');
var parser = require('../options-parser.js');
var tokenizer = require('../tokenizer.js');
var util = require('util');

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

        it("should not parse options after '--'' marker", function(){
            var argv = ['-a', 'input.txt', '--', '--file-with-dashes.txt', '-b'];
            var result = parser.parse({'a': { flag: true }, 'b': { flag: true }}, argv);
            
            result.opt.should.have.property('a', true);
            result.opt.should.not.have.property('b', true);
            result.args.should.eql(['input.txt', '--file-with-dashes.txt', '-b']);
        });

        it("should complain about short options with -- prefix", function(){
            var argv = ['input.txt', '--a'];
            (function(){parser.parse({'a': { flag: true}}, argv); }).should.throw();
        });

        it("should default to not accepting any options", function(){
            var argv = ['input.txt', 'file2.txt'];
            var result = parser.parse(false, argv);
            result.args.should.eql(argv);
        });

        it("should complain about missing option value when passed a short option instead", function(){
            var argv = ['-a', '-b'];
            var opt = {a: { required: true }, b: { flag: true }};
            parser.parse.bind(parser, opt, argv).should.throw();
        });

        it("should complain about missing option value when passed a long option instead", function(){
            var argv = ['-a', '--long'];
            var opt = {a: { required: true }, long: true};
            parser.parse.bind(parser, opt, argv).should.throw();
        });

        it("should complain about passing an option value to a flag option", function(){
            var argv = ['--long=value'];
            parser.parse.bind(parser, { long: { flag: true }}, argv).should.throw();
        });

        it("should complain about missing option value for last parameter", function(){
            var argv = ['--long'];
            parser.parse.bind(parser, { long: true }, argv).should.throw();
        });

        var ignoreOutput = function(){};
        
        it("should automatically invoke #help with showHelp set", function(){
            var argv = '--help';
            var helpInvoked = false;
            parser.parse({
                help: {
                    showHelp: { 
                        noExit: true, 
                        callback: function(){ helpInvoked = true; },
                        output: ignoreOutput
                    },
                    flag: true
                }
            }, argv);

            helpInvoked.should.be.true;
        });

        it("should imply flag when showHelp is set", function(){
            var argv = '--help';
            var helpInvoked = false;
            (function(){
                parser.parse({
                    help: {
                        showHelp: { 
                            noExit: true, 
                            callback: function(){ helpInvoked = true; },
                            output: ignoreOutput
                        }
                    }
                }, argv)
            }).should.not.throw();

            helpInvoked.should.be.true;

        });

        it("should imply flag only when unset when showHelp is set", function(){
            var argv = '--help';
            (function(){
                parser.parse({
                    help: {
                        showHelp: { 
                            noExit: true, 
                            output: ignoreOutput
                        },
                        flag: false
                    }
                }, argv)
            }).should.throw();
        });

        it("should exit as default when showHelp is triggered", function(){
            var _exit = process.exit;
            var called = 'temp';
            process.exit = function(code) { called = code; }

            parser.parse({
                help: {
                    showHelp: { 
                        output: ignoreOutput
                    }
                }
            }, '--help');

            called.should.be.equal(0);

            process.exit = _exit;
        });

        it("should not auto-invoke help when help param is not passed", function(){
            (function(){
                parser.parse({
                    help: {
                        showHelp: { 
                            output: ignoreOutput, 
                            noExit: true, 
                            callback: function(){
                                throw new Error();
                            } 
                        }
                    }
                }, 'something.txt');
            }).should.not.throw();
        });

        it("should invoke help if showHelp is true", function(){
            var _exit = process.exit;
            var _puts = util.puts;
            var called = false;
            process.exit = function(code) { called = true; }
            util.puts = ignoreOutput;

            parser.parse({
                help: {
                    showHelp: true
                }
            }, '--help');

            util.puts = _puts;
            process.exit = _exit;

            called.should.be.true;

        });
    });

    describe("#repeatChar_", function(){
        it("should return the empty string", function(){

            [0, -1].forEach(function(count){
                var str = parser.repeatChar_(' ', count);
                str.should.be.type('string');
                str.should.have.length(0);
            });

        });

        it("should return non-empty string", function(){
            parser.repeatChar_('a', 3).should.be.equal('aaa');
            parser.repeatChar_(' ', 5).should.be.equal('     ');
        });

    });

    describe("#padString_", function()
    {
        it("should pad string to minimum length", function(){
            parser.padString_('str', 5).should.be.equal('str  ');
            parser.padString_('string', 5).should.be.equal('string');
        })
    });

    describe("#fitString_", function(){
        var str = 'one two three four five';

        it("should not break shorter lines", function(){
            parser.fitString_(str, str.length).should.have.length(1);
            parser.fitString_(str, str.length + 10).should.have.length(1);
        });

        it("should break long lines on word boundries", function(){
            parser.fitString_(str, 20).should.be.eql(['one two three four', 'five']);
            parser.fitString_(str, 15).should.be.eql(['one two three', 'four five']);
            parser.fitString_('12345 67890', 5).should.be.eql(['12345','67890']);
        });

        it("should only break on word boundries", function(){
            parser.fitString_('abcdefghijklmnopqrstuvxyz', 5).should.have.length(1);
            parser.fitString_(' abcdefghijklmnopqrstuvxyz', 5).should.have.length(1);
            parser.fitString_('abcdefghijklmnopqrstuvxyz abcdefghijklmnopqrstuvxyz', 5).should.have.length(2);
        });
    });

    describe("#help", function(){
        
        function redirectOutput(arr){
            var push = arr.push.bind(arr);
            return function(){
                for(var i = 0; i < arguments.length; i++)
                    push(arguments[i]);
            };
        }

        // we could do these tests slightly better 
        var opts = {
            'list': {
                flag: true,
                help: 'toggle list format',
                _result: ['  --list                  toggle list format']
            },
            'sync': {
                short: 's',
                flag: true,
                help: 'if specified, synchronize all files from remote server to local directory before doing any other operation',
                _result: ['  --sync, -s              if specified, synchronize all files from remote server',
                          '                          to local directory before doing any other operation']
            },
            'as': { 
                flag: true, 
                _result: ['  --as                    ']
            }, 
            'p': { 
                flag: true,
                _result: ['  -p                      ']
            },
            'longarg': { 
                help: 'some long argument',
                short: 'l',
                _result: ['  --longarg VAL, -l VAL   some long argument'] 
            },
            'with-value': {
                help: 'use value for input',
                _result: ['  --with-value VAL        use value for input']
            }
        };

        it("should show all params by default", function(){
            var arr = [];
            var options = {
                columns: 80,
                output: redirectOutput(arr)
            }

            parser.help(opts, options);

            arr.should.have.length(7);

            for(var key in opts)
                opts[key]._result.forEach(function(line){
                    arr.should.containEql(line);
                });
        });

        it("should use options.paddingLeft if specified", function(){
            var arr = [];
            var options = {
                columns: 80,
                paddingLeft: 1,
                output: redirectOutput(arr)
            }

            parser.help(opts, options);

            arr.should.have.length(7);

            for(var key in opts)
                opts[key]._result.forEach(function(line){
                    arr.should.containEql(line.substring(1));
                });
        });

        it("should show banner when specified", function(){
            var arr = [];
            var options = {
                columns: 80,
                output: redirectOutput(arr),
                banner: 'This is a banner'
            };

            parser.help(opts, options);
            arr.length.should.be.greaterThan(0);
            arr[0].should.be.eql(options.banner);
        });

        it("should skip options with no help text if options.skipEmpty is specified", function(){
            var arr = [];
            var options = {
                columns: 80,
                output: redirectOutput(arr),
                skipEmpty: true
            };

            parser.help(opts, options);
            arr.should.have.length(5);
            for(var key in opts)
            {
                if(opts[key].help)
                    opts[key]._result.forEach(function(line){
                        arr.should.containEql(line);
                    });
            }
        });

        it("should use .varName value instead of VAL if specified", function(){
            var arr = [];
            var options = {
                output: redirectOutput(arr),
                columns: 200
            };

            parser.help({
                'file': {
                    short: 'f',
                    varName: 'FILE',
                    help: 'filename to process'
                }
            }, options);

            arr.should.have.length(1);
            arr[0].should.eql('  --file FILE, -f FILE   filename to process');
        });

        it("should replace %REQ_OPTS% in banner with required options", function(){
            var arr = [];
            var options = {
                output: redirectOutput(arr),
                columns: 80,
                banner: 'node test.js %REQ_OPTS% [options] filename'
            };

            parser.help({
                'force': {
                    short: 'f',
                    required: true,
                    flag: true
                },
                'user': {
                    required: true,
                    varName: 'USERNAME'
                },
                'opt': {
                    required: true
                }
            }, options);

            arr[0].should.eql('node test.js -f --user USERNAME --opt VAL [options] filename');
        });

        it("should remove %REQ_OPTS% in banner if no required options exist", function(){
            var arr = [];
            var options = {
                output: redirectOutput(arr),
                columns: 80,
                banner: 'node test.js %REQ_OPTS% [options] filename'
            };

            parser.help({
                'force': {
                    short: 'f',
                    flag: true
                }
            }, options);

            arr[0].should.eql('node test.js [options] filename');
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

