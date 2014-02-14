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

