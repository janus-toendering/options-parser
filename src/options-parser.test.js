var util = require('util');
var os = require('os');
var path = require('path');
var fs = require('fs');
var parser = require('./options-parser.js');
var helper = require('./helper.js')

describe("#parse", () => {
    test("should parse short flag parameter", () => {
        var argv = ["-a"];
        var result = parser.parse({
            'a': { flag: true }
        }, argv);

        expect(result.opt).toHaveProperty('a', true);
        expect(result.args).toHaveLength(0);
    });

     test("should parse long flag parameter", () => {
         var argv = ["--long"];
         var result = parser.parse({
             'long': { flag: true}
         }, argv);

         expect(result.opt).toHaveProperty('long', true);
         expect(result.args).toHaveLength(0);
     });

     test("should parse long flag alias ", () => {
         var argv = ["-l"];
         var result = parser.parse({
             'long': { flag: true, short: 'l' }
         }, argv);

         expect(result.opt).toHaveProperty('long', true);
         expect(result.args).toHaveLength(0);
     });

     test("should parse short parameter with required value", () => {
         var argv = ["-a", "bba"];
         var result = parser.parse({
             'a': 1
         }, argv);

         expect(result.opt).toHaveProperty("a", "bba");
         expect(result.args).toHaveLength(0);
     });

     test("should accept empty argv with optional parameters", () => {
        var argv = [];
        var result = parser.parse({
            'a': { required: false }
        }, argv);

        expect(result).not.toHaveProperty("a");
         expect(result.args).toHaveLength(0);
     });

     test("should throw on unknown short argument", () => {
         var argv = ["-b"];
         expect(function(){ parser.parse({}, argv) }).toThrowError(/Unknown option/);
     });

     test("should throw on unexpected long arguments", () => {
         var argv = ["--long"];
         expect(function(){ parser.parse({}, argv) }).toThrowError(/Unknown option/);
     });

     test("should parse non-flag short parameter", () => {
         var argv = ["-l", "arg"];
         var result = parser.parse({
             'l': 1
         }, argv);

         expect(result.opt).toHaveProperty("l", "arg");
         expect(result.args).toHaveLength(0);
     });

     test("should parse non-flag long parameter", () => {
         var argv = ["--long", "arg"];
         var result = parser.parse({
             'long': 1
         }, argv);

         expect(result.opt).toHaveProperty("long", "arg");
         expect(result.args).toHaveLength(0);
     });

     test("should shift left-over arguments to args", () => {
         var argv = ["arg0", "--long", "arg1", "arg2", "arg3"];
         var result = parser.parse({
             'long': 1
         }, argv);

         expect(result.opt).toHaveProperty("long", "arg1");
         expect(result.args).toEqual(["arg0", "arg2", "arg3"]);
     });

     test("should shift left-over arguments to args #2", () => {
         var argv = ['arg0', '--long', 'arg1', 'arg2', 'arg3'];
         var result = parser.parse({
             'long': { flag: true }
         }, argv);

         expect(result.opt).toHaveProperty('long');
         expect(result.args).toHaveLength(4);
         expect(result.args).toEqual(["arg0", "arg1","arg2", "arg3"]);
     });

     test("should support --long=truthy|falsy for flags", () => {
         var opts = { 'long': { flag: true } };

         var argv = ['--long=1'];
         expect(parser.parse(opts, argv).opt).toHaveProperty('long', true);

         argv = ['--long=yes'];
         expect(parser.parse(opts, argv).opt).toHaveProperty('long', true);

         argv = ['--long=true'];
         expect(parser.parse(opts, argv).opt).toHaveProperty('long', true);

         argv = ['--long=0'];
         expect(parser.parse(opts, argv).opt).toHaveProperty('long', false);

         argv = ['--long=no'];
         expect(parser.parse(opts, argv).opt).toHaveProperty('long', false);

         argv = ['--long=false'];
         expect(parser.parse(opts, argv).opt).toHaveProperty('long', false);
     });

     test("should support a string argument for argv", () => {
         var opts = { param: true, a: { flag: true }, something: { flag: true } };
         var result = parser.parse(opts, '--param=value -a --something input.txt');
         expect(result.opt).toHaveProperty('param', 'value');
         expect(result.opt).toHaveProperty('a', true);
         expect(result.opt).toHaveProperty('something', true);
         expect(result.args).toEqual(['input.txt']);
     });

     test("should parse --key=value params", () => {
         var argv = ['--key=value'];
         expect(parser.parse({"key": 1}, argv).opt).toHaveProperty("key", "value");
     });

     test("should let later params take precedence", () => {
         var argv = ['-a', '1', '-a', '2'];
         expect(parser.parse({'a': 1}, argv).opt).toHaveProperty("a", "2");

         var argv = ['--all', '1', '--all', '2'];
         expect(parser.parse({'all': 1}, argv).opt).toHaveProperty("all", "2");
     });

     test("should parse multi-params correctly", () => {
         var argv = ['-a', '1', '-a', '2'];
         expect(parser.parse({'a': {multi:true}}, argv).opt).toHaveProperty("a", ["1", "2"]);

         var argv = ['--all', '1', '--all', '2'];
         expect(parser.parse({'all': {multi:true}}, argv).opt).toHaveProperty("all", ["1", "2"]);
     });

     test(
         "should parse '--user=janus --pass 123 janus.txt -r --input=1.txt -i 2.txt' correctly",
         () => {
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

             expect(result.opt).toHaveProperty("user", "janus");
             expect(result.opt).toHaveProperty("pass", "123");
             expect(result.opt).toHaveProperty("r", true);
             expect(result.opt).toHaveProperty("input", ["1.txt", "2.txt"]);
             expect(result.args).toEqual(["output.txt"]);

         }
     );

     test("should use default values", () => {
         var argv = [];
         expect(parser.parse({ "user": { default: "joe" }}, argv).opt).toHaveProperty("user", "joe");
     });

     test("should complain about missing required parameters", () => {
         var argv = [];
         expect(function() { parser.parse({'somearg': { required: true }}, argv) }).toThrowError();
     });

     test("should not throw when passed an error handler", () => {
         var argv = [];
         expect(
             function() { parser.parse({'somearg': { required: true }}, argv, function(){}) }
         ).not.toThrowError();

     });

     test(
         "should not throw when passed an error handler as second argument",
         () => {
             expect(
                 function() { parser.parse({'somearg': { required: true }}, function(e){}) }
             ).not.toThrowError();
         }
     );

     test("should not parse options after '--'' marker", () => {
         var argv = ['-a', 'input.txt', '--', '--file-with-dashes.txt', '-b'];
         var result = parser.parse({'a': { flag: true }, 'b': { flag: true }}, argv);
         
         expect(result.opt).toHaveProperty('a', true);
         expect(result.opt).not.toHaveProperty('b', true);
         expect(result.args).toEqual(['input.txt', '--file-with-dashes.txt', '-b']);
     });

     test("should complain about short options with -- prefix", () => {
         var argv = ['input.txt', '--a'];
         expect(function(){parser.parse({'a': { flag: true}}, argv); }).toThrowError();
     });

     test("should default to not accepting any options", () => {
         var argv = ['input.txt', 'file2.txt'];
         var result = parser.parse(false, argv);
         expect(result.args).toEqual(argv);
     });

     test(
         "should complain about missing option value when passed a short option instead",
         () => {
             var argv = ['-a', '-b'];
             var opt = {a: { required: true }, b: { flag: true }};
             expect(parser.parse.bind(parser, opt, argv)).toThrowError();
         }
     );

     test(
         "should complain about missing option value when passed a long option instead",
         () => {
             var argv = ['-a', '--long'];
             var opt = {a: { required: true }, long: true};
             expect(parser.parse.bind(parser, opt, argv)).toThrowError();
         }
     );

     test(
         "should complain about passing an option value to a flag option",
         () => {
             var argv = ['--long=value'];
             expect(parser.parse.bind(parser, { long: { flag: true }}, argv)).toThrowError();
         }
     );

     test(
         "should complain about missing option value for last parameter",
         () => {
             var argv = ['--long'];
             expect(parser.parse.bind(parser, { long: true }, argv)).toThrowError();
         }
     );

     var ignoreOutput = function(){};
     
     test("should automatically invoke #help with showHelp set", () => {
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

         expect(helpInvoked).toBe(true);
     });

     test("should imply flag when showHelp is set", () => {
         var argv = '--help';
         var helpInvoked = false;
         expect(function(){
             parser.parse({
                 help: {
                     showHelp: { 
                         noExit: true, 
                         callback: function(){ helpInvoked = true; },
                         output: ignoreOutput
                     }
                 }
             }, argv)
         }).not.toThrowError();

         expect(helpInvoked).toBe(true);

     });

     test("should imply flag only when unset when showHelp is set", () => {
         var argv = '--help';
         expect(function(){
             parser.parse({
                 help: {
                     showHelp: { 
                         noExit: true, 
                         output: ignoreOutput
                     },
                     flag: false
                 }
             }, argv)
         }).toThrowError();
     });

     test("should exit as default when showHelp is triggered", () => {
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

         expect(called).toBe(0);

         process.exit = _exit;
     });

     test("should not auto-invoke help when help param is not passed", () => {
         expect(function(){
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
         }).not.toThrowError();
     });

     test("should invoke help if showHelp is true", () => {
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

         expect(called).toBe(true);

     });

     test("should ignore empty arguments", () => {
         var result = parser.parse({ i: false }, ['-i', '']);
         expect(result.opt).toEqual({i: true});
     });

     test("should handle default arguments for multi-params", () => {
         var opt = {i: { multi: true, default: ['janus']}};
         
         expect(parser.parse(opt, '')).toHaveProperty('opt', { i: ['janus']});
         expect(parser.parse(opt, '-i a')).toHaveProperty('opt', { i: ['a']});
         expect(parser.parse(opt, '-i a -i b')).toHaveProperty('opt', { i: ['a', 'b']});
     });
 });

 describe("#repeat", () => {
     test("should return the empty string", () => {

         [0, -1].forEach(function(count){
             var str = helper.String.repeat(' ', count);
             expect(typeof str === "string").toBe(true);
             expect(str).toHaveLength(0);
         });

     });

     test("should return non-empty string", () => {
         expect(helper.String.repeat('a', 3)).toBe('aaa');
         expect(helper.String.repeat(' ', 5)).toBe('     ');
     });

 });

 describe("#pad", () => {
     test("should pad string to minimum length", () => {
         expect(helper.String.pad('str', 5)).toBe('str  ');
         expect(helper.String.pad('string', 5)).toBe('string');
     })
 });

 describe("#fitWidth", () => {
     var str = 'one two three four five';

     test("should not break shorter lines", () => {
         expect(helper.String.fitWidth(str, str.length)).toHaveLength(1);
         expect(helper.String.fitWidth(str, str.length + 10)).toHaveLength(1);
     });

     test("should break long lines on word boundries", () => {
         expect(helper.String.fitWidth(str, 20)).toEqual(['one two three four', 'five']);
         expect(helper.String.fitWidth(str, 15)).toEqual(['one two three', 'four five']);
         expect(helper.String.fitWidth('12345 67890', 5)).toEqual(['12345','67890']);
     });

     test("should only break on word boundries", () => {
         expect(helper.String.fitWidth('abcdefghijklmnopqrstuvxyz', 5)).toHaveLength(1);
         expect(helper.String.fitWidth(' abcdefghijklmnopqrstuvxyz', 5)).toHaveLength(1);
         expect(
             helper.String.fitWidth('abcdefghijklmnopqrstuvxyz abcdefghijklmnopqrstuvxyz', 5)
         ).toHaveLength(2);
     });
 });

 describe("#help", () => {
     
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

     test("should show all params by default", () => {
         var arr = [];
         var options = {
             columns: 80,
             output: redirectOutput(arr)
         }

         parser.help(opts, options);

         expect(arr).toHaveLength(7);

         for(var key in opts)
             opts[key]._result.forEach(function(line){
                 expect(arr).toContainEqual(line);
             });
     });

     test("should use options.paddingLeft if specified", () => {
         var arr = [];
         var options = {
             columns: 80,
             paddingLeft: 1,
             output: redirectOutput(arr)
         }

         parser.help(opts, options);

         expect(arr).toHaveLength(7);

         for(var key in opts)
             opts[key]._result.forEach(function(line){
                 expect(arr).toContainEqual(line.substring(1));
             });
     });

     test("should show banner when specified", () => {
         var arr = [];
         var options = {
             columns: 80,
             output: redirectOutput(arr),
             banner: 'This is a banner'
         };

         parser.help(opts, options);
         expect(arr.length).toBeGreaterThan(0);
         expect(arr[0]).toEqual(options.banner);
     });

     test(
         "should skip options with no help text if options.skipEmpty is specified",
         () => {
             var arr = [];
             var options = {
                 columns: 80,
                 output: redirectOutput(arr),
                 skipEmpty: true
             };

             parser.help(opts, options);
             expect(arr).toHaveLength(5);
             for(var key in opts)
             {
                 if(opts[key].help)
                     opts[key]._result.forEach(function(line){
                         expect(arr).toContainEqual(line);
                     });
             }
         }
     );

     test("should use .varName value instead of VAL if specified", () => {
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

         expect(arr).toHaveLength(1);
         expect(arr[0]).toBe('  --file FILE, -f FILE   filename to process');
     });

     test("should replace %REQ_OPTS% in banner with required options", () => {
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

         expect(arr[0]).toBe('node test.js -f --user USERNAME --opt VAL [options] filename');
     });

     test(
         "should remove %REQ_OPTS% in banner if no required options exist",
         () => {
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

             expect(arr[0]).toBe('node test.js [options] filename');
         }
     );

 });

 describe("validateTypes_", () => {

     test("should validate type=int options", () => {
         var opts = {
             "int": {
                 short: "i",
                 type: parser.type.int("NOT AN INT")
             }
         };

         expect(function(){ 
             parser.parse(opts, "-i 100");
         }).not.toThrowError();

         expect(function(){
             parser.parse(opts, "--int=-100");
         }).not.toThrowError();

         expect(function(){
             parser.parse(opts, "-i string");
         }).toThrowError("NOT AN INT");
         
     });

     test("should validate type=regex options", () => {
         var opts = {
             "regex": {
                 short: "r",
                 type: parser.type.regexp("three letters", /[a-z]{3}/)
             }
         };

         expect(function(){
             parser.parse(opts, "-r abc");
         }).not.toThrowError();

         expect(function(){
             parser.parse(opts, "-r 123");
         }).toThrowError("three letters");

         expect(function(){
             parser.parse(opts, "-r ab");
         }).toThrowError("three letters");

         expect(function(){
             parser.parse(opts, "-r ABC");
         }).toThrowError("three letters");

         expect(function(){
             parser.parse(opts, "-r 12azu23");
         }).not.toThrowError();

     });

     test("should allow string instead if regex for type=regex options", () => {
         var opts = {
             "regex": {
                 short: "r",
                 type: parser.type.regexp("three letters", "[a-z]{3}")
             }
         };

                     expect(function(){
             parser.parse(opts, "-r abc");
         }).not.toThrowError();

         expect(function(){
             parser.parse(opts, "-r 123");
         }).toThrowError("three letters");

         expect(function(){
             parser.parse(opts, "-r ab");
         }).toThrowError("three letters");

         expect(function(){
             parser.parse(opts, "-r ABC");
         }).toThrowError("three letters");

         expect(function(){
             parser.parse(opts, "-r 12azu23");
         }).not.toThrowError();
     });

     function tmpfile(filename)
     {
         var counter = 0;
         file = path.join(os.tmpdir(), filename);

         while(fs.existsSync(file))
         {
             file = path.join(os.tmpdir(), filename + counter++);
         }
         return file;
     }

     test("should open file if type=file.open.read for reading", () => {
         var msg = "File not found or could not be opened for reading";
         var opts = {
             "file": {
                 short: "f",
                 type: parser.type.file.open.read(msg)
             }
         };

         var result ;
         expect(function(){
             result = parser.parse(opts, ["-f", __filename]);

         }).not.toThrowError();

         expect(result.opt).toHaveProperty("file");
         expect(result.opt.file).toHaveProperty("fd");
         expect(result.opt.file).toHaveProperty("name", __filename);

         // close opened file
         fs.closeSync(result.opt.file.fd);

         expect(function(){
             parser.parse(opts, ["-f", tmpfile("toendering.does-not-exist")]);
         }).toThrowError(msg);
     });

     test("should open file for writing if type=file.open.write", () => {
         // this is open to a race condition, but that is probably
         // only likely to happen if you run the test multiple times
         // simultaneously

         var opts = {
             "file": {
                 short: "f",
                 type: parser.type.file.open.write("could not open file for writing")
             }
         }

         var result;
         var file = tmpfile("toendering.options-parser.tmp");
         expect(function(){
             result = parser.parse(opts, ["-f", file]);
         }).not.toThrowError();
         
         expect(result.opt).toHaveProperty("file");
         expect(result.opt.file).toHaveProperty("name", file);
         expect(result.opt.file).toHaveProperty("fd");

         expect(function(){
             fs.writeSync(result.opt.file.fd, Buffer.from("test"), 0, 4, null);
         }).not.toThrowError();
         
         try {
             fs.closeSync(result.opt.file.fd);
             fs.unlinkSync(result.opt.file.name);
         } catch(e){};
     });

     test("should open file for reading/writing if type=file.open", () => {
         // this is open to a race condition, but that is probably
         // only likely to happen if you run the test multiple times
         // simultaneously

         var opts = {
             "file": {
                 short: "f",
                 type: parser.type.file.open("could not open file for writing")
             }
         }

         var result;
         var file = tmpfile("toendering.options-parser.tmp");
         expect(function(){
             fs.writeFileSync(file, "test");
             result = parser.parse(opts, ["-f", file]);
         }).not.toThrowError();
         expect(result.opt).toHaveProperty("file");
         expect(result.opt.file).toHaveProperty("name", file);
         expect(result.opt.file).toHaveProperty("fd");
         
         fs.writeSync(result.opt.file.fd, Buffer.from("test"), 0, 4, 4);
         
         var buffer = Buffer.alloc(8);
         fs.readSync(result.opt.file.fd, buffer, 0, 8, 0);
         expect(buffer.toString()).toBe("testtest");

         try {
             fs.closeSync(result.opt.file.fd);
             fs.unlinkSync(result.opt.file.name);
         } catch(e){};

     });

     test(
         "should handle type validation replacement for 'multi' options",
         () => {
             var opts = {
                 "name": {
                     short: "n",
                     multi: true,
                     type: function(value, replace) {
                         replace(value.charCodeAt(0));
                     }
                 }
             };

             var result = parser.parse(opts, "-n ab -n ba -n zzo");
             expect(result.opt.name).toEqual([97, 98, 122]);
         }
     );

 });