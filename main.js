var JSLisp = require('./jsLisp.js');
var interpreter = new JSLisp.Interpreter();

const repl = require("repl");
repl.start({
    eval: function (command, context, filename, callback) {
        const result = interpreter.evaluate(command);
        if (result !== undefined) {
            console.log(interpreter.format(result));
        }
        callback(null);
    },
});
