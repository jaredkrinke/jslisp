var JSLisp = require('./jsLisp.js');
var interpreter = new JSLisp.Interpreter();
var input = process.stdin;
input.setEncoding('utf8');

input.on('data', function (text) {
    var result = interpreter.evaluate(text.slice(0, text.length - 2));
    if (result !== undefined) {
        console.log(interpreter.format(result));
    }
});
