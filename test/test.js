var should = require('should');
//var Scanner = require('../scanner');
//var TokenType = require('../tokentype');
var parser = require('../parser.js');

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

});

