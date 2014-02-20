options-parser
==============

A full-featured no-nonsense command line parser for node with no external dependencies

# Example
```javascript

var options = require('./parser');

var result = options.parse({
  user:  { required: true },
  all:   { short: 'a', flag: true },
  host:  { short: 'h', default: 'localhost' },
  input: { short: 'i', multi: true },
  r:     { flag: true },
  db:    { default: 'test' }
});

console.log(result);
```
Running the above code with
```sh
node example.js --user=joe -a --host www.example.com output.txt -i file1.txt --input file2.txt
```
would produce
```javascript
{ opt: 
   { user: 'joe',
     all: true,
     host: 'www.example.com',
     db: 'test',
     input: [ 'file1.txt', 'file2.txt' ] },
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
  short: [char],     // short alias for this option (must have length = 1),
  
  required: [bool],  // if set to true, this option is required (default: false)
  
  flag: [bool],      // if true, this option takes no values. If false, this 
                     // option expects a value (ie. --host www.example.com)
                     // (default: false)
  
  default: [string], // default value of option if it is not present. 
                     // does not make sense to use with flag or required
  
  multi: [bool]      // If true, this option can be specified multiple times
                     // and the resulting value will be an array (default: false)
                     // If false, later options take precedence over earlier options
}
```  

You can pass an argv array as the second argument (optional). It should not contain the interpreter (node)
and script name. This value defaults to process.argv.slice(2).

It is also possible to pass a string that will then be converted to the 
corresponding argv array before it will be processed. This can be useful for
reading command line parameters from a file.

The error parameter is a callback to use when errors are encountered. If nothing is provided, the default error handling will throw an exception.


