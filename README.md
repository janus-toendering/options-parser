options-parser
==============

A full-featured no-nonsense command line parser for node with no external dependencies

# Installation
```sh
$ npm install --save options-parser
```

# Example
```javascript

var options = require('options-parser');

var result = options.parse({
  user:  { required: true },
  all:   { short: 'a', flag: true },
  host:  { short: 'h', default: 'localhost' },
  input: { short: 'i', multi: true },
  r:     { flag: true },
  db:    { default: 'test' },
  out:   { short: 'o', type: options.type.file.open.write() }
});

console.log(result);
```
Running the above code with
```sh
node example.js --user=joe -a --host www.example.com output.txt -i file1.txt --input file2.txt -o out.txt
```
would produce
```javascript
{ opt: 
   { user: 'joe',
     all: true,
     host: 'www.example.com',
     db: 'test',
     input: [ 'file1.txt', 'file2.txt' ],
     out: { name: 'out.txt', fd: 9 } },
  args: [ 'output.txt' ] }
```

# Reference

```javascript
options.parse(opts);
options.parse(opts, argv);
options.parse(opts, error);
options.parse(opts, argv, error);
```

The first argument to .parse(...) is always the options object defining what to look for. Every key in the options object denotes the name of the option. The value is another object that can contain one of the following options

```javascript
{ 
  short: [char],            // short alias for this option (must have length = 1),
  
  required: [bool],         // if set to true, this option is required (default: false)
  
  flag: [bool],             // if true, this option takes no values. If false, this 
                            // option expects a value (ie. --host www.example.com)
                            // (default: false)
  
  default: [string],        // default value of option if it is not present. 
                            // does not make sense to use with flag or required
  
  multi: [bool]             // If true, this option can be specified multiple times
                            // and the resulting value will be an array (default: false)
                            // If false, later options take precedence over earlier options
  
  help: [string],           // help text used when outputting help screen (see below),
  
  showHelp: [bool|object],  // automatically show help screen when this option is present 
                            // (implies flag: true if unset)
  
  varName: [string],        // name to use for value placeholder in help screen (see below)

  type: [Function}          // Type validation. See more details below.
}
```  

You can pass an argv array as the second argument (optional). It should not contain the interpreter (node)
and script name. This value defaults to process.argv.slice(2).

It is also possible to pass a string that will then be converted to the 
corresponding argv array before it will be processed. This can be useful for
reading command line parameters from a file.

The error parameter is a callback to use when errors are encountered. If nothing is provided, the default error handling will throw an exception.

## Help screen

options-parser can automatically generate a suitable help screen for displaying
the available options and help text for the user.

```javascript
options.help(opts, options);
```

opts is the same object you would pass to options.parse(...). options is an optional object literal with the following structure 

```javascript
{
  columns: [number],          // format text to fit the specified number of columns
                              // if columns is not specified, it defaults to the current
                              // screen with
  
  output: [function],         // use [function] instead of util.puts for output 
                              // (must have same signature)
  
  skipEmpty: [bool],          // leave out options that do not have a help text
  
  paddingLeft: [number],      // left padding of output (default: 2)
  
  separator: [string],        // separator string to use between option names 
                              // and help text (default: '   ')
  
  banner: [string],           // specify a banner to display as the first line of help output
  
  // the following are only available when passed to showHelp property of an opts object
  
  noExit: [bool],             // do not exit after displaying help screen invoked from 
                              // a showHelp option (default: false)
                              
  callback: [function]        // funciton to be called after help screen has been displayed
  
}
```

You can pass a options object literal to the showHelp property in the opts object literal. This will be passed directly to the .help(...) method when the options is encountered.

# Example 2

```javascript
// help-example.js
var options = require('options-parser');
options.parse({
  file: {
    short: 'f',
    varName: 'FILE',
    help: 'file to process'
  },
  q: {
    help: 'do not print any output',
    flag: true
  },
  help: {
    short: 'h',
    help: 'this help screen',
    showHelp: { 
      banner: 'options-parser example: [options]'
    }
  }
});
```
```bash
$ node help-example.js --help
options-parser example: [options]
  --file FILE, -f FILE   file to process
  -q                     do not print any output
  --help, -h             this help screen
```

## Type Validation

To ease validation of argument values you can pass a function
to the "type" member of the options configuration object. The
function takes two arguments: the value to validate and a 
replacement function that takes one argument. If the validation
succeeds return true, otherwise return an error message string.

The replacement function can be used to replace the value being
validated with a new value. Say you want to see if the value
is a valid date. You can then use the replacement function to
replace the string value of the input with a Date object 
representing the parsed date.

There are a few built-in type validation functions:
```javascript
var options = require('options-parser');

// require parameter value to be an integer
options.type.int(errorMessage);

// require parameter value to be a valid file and open it for reading and writing
options.type.file.open(errorMessage, options);

// require parameter value to be a valid file and open it for reading
options.type.file.open.read(errorMessage, options);

// require parameter value to be a valid file and open it for writing
options.type.file.open.write(errorMessage, options);
```

The errorMessage string is optional. If no error message is passed a default
error message will be used.

The options object can have two fields: `flags` and `mode` which reflect
the `flags` and `mode` parameters of the 
[fs.open api] (http://nodejs.org/api/fs.html#fs_fs_open_path_flags_mode_callback)
function.

The `file.open.xxx` functions all replace the value with an object with two
fields: `name` and `fd`. `name` is the name of the file as specified by the user and
`fd` is the file descriptor of the opened file. See the first example near the top of the page
