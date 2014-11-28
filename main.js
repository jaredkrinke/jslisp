var jsLisp = require('./jsLisp.js');
var input = process.stdin;
input.setEncoding('utf8');

input.on('data', function (text) {
    var result = jsLisp.evaluate(text.slice(0, text.length - 2));
    if (result !== undefined) {
        console.log(result);
    }
});
