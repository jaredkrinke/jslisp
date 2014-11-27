var stream = require('stream');

var tokenize = function (input) {
    var output = [];
    var inToken = false;
    var tokenStart = 0;
    for (var i = 0, count = input.length; i < count; i++) {
        if (inToken) {
            switch (input[i]) {
                case '(':
                case ')':
                    output.push(input.slice(tokenStart, i));
                    output.push(input[i]);
                    inToken = false;
                    break;

                case ' ':
                case '\n':
                    output.push(input.slice(tokenStart, i));
                    inToken = false;
                    break;
            }
        } else {
            switch (input[i]) {
                case '(':
                case ')':
                    output.push(input[i]);
                    break;

                case ' ':
                case '\n':
                    break;

                default:
                    inToken = true;
                    tokenStart = i;
                    break;
            }
        }
    }

    if (inToken) {
        output.push(input.slice(tokenStart));
    }

    return output;
};

var parseRecursive = function (input, depth, state) {
    var node = [];
    for (; state.index < input.length;) {
        var token = input[state.index];
        state.index++;

        if (token === '(') {
            node.push(parseRecursive(input, depth + 1, state));
        } else if (token === ')') {
            if (depth <= 0) {
                throw 'Extra ")"';
            } else {
                return node;
            }
        } else {
            node.push(token);
        }
    }

    if (depth > 0) {
        throw 'Missing ")"';
    }

    return node;
};

var parse = function (input) {
    return parseRecursive(input, 0, { index: 0 })[0];
};

var defaultEnvironment = {};

// Arithmetic
defaultEnvironment['+'] = function () {
    var result = 0;
    for (var i = 0, count = arguments.length; i < count; i++) {
        result += parseFloat(arguments[i]);
    }
    return result;
};

defaultEnvironment['-'] = function (a, b) {
    if (b !== undefined) {
        return parseFloat(a) - parseFloat(b);
    }

    return -parseFloat(a);
};

defaultEnvironment['*'] = function () {
    var result = 1;
    for (var i = 0, count = arguments.length; i < count; i++) {
        result *= parseFloat(arguments[i]);
    }
    return result;
};

defaultEnvironment['/'] = function (a, b) { return parseFloat(a) / parseFloat(b); };

var evaluateInternal = function (environment, expression) {
    var result;
    if (Array.isArray(expression)) {
        // Combination (function application)
        var operator = expression[0];
        var f = environment[operator];

        // TODO: Special forms
        if (!f) {
            throw 'No function named: ' + operator;
        }

        // Evaluate subexpressions
        var operands = [];
        for (var i = 1, count = expression.length; i < count; i++) {
            operands[i - 1] = evaluateInternal(environment, expression[i]);
        }

        result = f.apply(null, operands);
    } else {
        // Literal
        result = expression;
    }
    return result;
};

var evaluate = function (input) {
    var output = '';
    try {
        var tree = parse(tokenize(input));
        output = JSON.stringify(evaluateInternal(defaultEnvironment, tree));
        //output = JSON.stringify(tree);
    } catch (error) {
        return error;
    }

    return output;
};

var input = process.stdin;
input.setEncoding('utf8');

input.on('data', function (text) {
    console.log(evaluate(text.slice(0, text.length - 2)));
});

