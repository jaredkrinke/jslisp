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

var identifierPattern = /[^0-9,#();"'`|[\]{}][^,#();"'`|[\]{}]*/i;
var parseIdentifier = function (text) {
    return (!Array.isArray(text) && identifierPattern.test(text)) ? text : null;
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

defaultEnvironment['>'] = function (a, b) { return parseFloat(a) > parseFloat(b); };
defaultEnvironment['>='] = function (a, b) { return parseFloat(a) >= parseFloat(b); };
defaultEnvironment['='] = function (a, b) { return parseFloat(a) === parseFloat(b); };
defaultEnvironment['<='] = function (a, b) { return parseFloat(a) <= parseFloat(b); };
defaultEnvironment['<'] = function (a, b) { return parseFloat(a) < parseFloat(b); };

// Special forms
specialForms = {};

specialForms.quote = function (environments, datum) {
    return datum;
};

specialForms.define = function (environments, nameExpression, valueExpression) {
    if (Array.isArray(nameExpression)) {
        // Function: (name, arg1, arg2, ...)
        if (nameExpression.length < 1) {
            throw 'define: No identifier supplied'
        }

        // Parse identifiers
        var identifierSet = {};
        var identifiers = [];
        for (var i = 0, count = nameExpression.length; i < count; i++) {
            var identifier = parseIdentifier(nameExpression[i]);
            if (!identifier) {
                throw 'define: Invalid identifier: ' + nameExpression[i];
            }

            if (identifier in identifierSet) {
                throw 'define: Duplicate formal parameter: ' + identifier;
            }

            identifiers[i] = identifier;
            identifierSet[identifier] = true;
        }

        // Save the function
        // TODO: Support recursion
        environments[0][identifiers[0]] = {
            formalParameters: identifiers.slice(1),
            body: valueExpression
        };
    } else {
        // Variable: name
        var identifier = parseIdentifier(nameExpression);
        if (!identifier) {
            throw 'define: Invalid identifier: ' + nameExpression;
        }

        environments[0][identifier] = evaluateInternal(environments, valueExpression);
    }
};

specialForms.cond = function (environments) {
    for (var i = 1, count = arguments.length; i < count; i++) {
        var clause = arguments[i];
        var predicate = clause[0];
        var consequentExpression = clause[1];

        if (predicate === 'else' || evaluateInternal(environments, predicate) === true) {
            return evaluateInternal(environments, consequentExpression);
        }
    }
};

specialForms.if = function (environments, predicate, consequent, alternative) {
    if (evaluateInternal(environments, predicate) === true) {
        return evaluateInternal(environments, consequent);
    } else {
        return evaluateInternal(environments, alternative);
    }
};

specialForms.and = function (environments) {
    var result;
    for (var i = 1, count = arguments.length; i < count; i++) {
        result = evaluateInternal(environments, arguments[i]);
        if (result !== true) {
            return false;
        }
    }

    return result;
};

specialForms.or = function (environments) {
    for (var i = 1, count = arguments.length; i < count; i++) {
        var result = evaluateInternal(environments, arguments[i]);
        if (result !== false) {
            return result;
        }
    }

    return false;
};

specialForms.not = function (environments, expression) {
    if (evaluateInternal(environments, expression) === false) {
        return true;
    }
    return false;
};

var lookup = function (environments, identifier) {
    var result;
    for (var i = 0, count = environments.length; result === undefined && i < count; i++) {
        result = environments[i][identifier];
    }
    return result;
};

var evaluateInternal = function (environments, expression) {
    var result;
    if (Array.isArray(expression)) {
        // Combination
        var operator = expression[0];
        var f = lookup(environments, operator);

        var specialForm;
        if (!Array.isArray(operator) && (specialForm = specialForms[operator])) {
            // Special form
            return specialForm.apply(null, [environments].concat(expression.slice(1)));
        } else {
            // Function
            if (!f) {
                throw 'No function named: ' + operator;
            }

            // Evaluate subexpressions
            var operands = [];
            for (var i = 1, count = expression.length; i < count; i++) {
                operands[i - 1] = evaluateInternal(environments, expression[i]);
            }

            if (typeof (f) === 'function') {
                // Built-in function
                result = f.apply(null, operands);
            } else if (f.formalParameters && f.body) {
                // Custom function
                var formalParameters = f.formalParameters;
                var localEnvironment = {};
                for (var i = 0, count = formalParameters.length; i < count; i++) {
                    localEnvironment[formalParameters[i]] = operands[i];
                }

                result = evaluateInternal([localEnvironment].concat(environments), f.body);
            }
        }
    } else {
        // Literal
        // TODO: How to distinguish literals? Also handle strings
        var result = parseFloat(expression);
        if (isNaN(result)) {
            result = lookup(environments, expression);
        }
    }
    return result;
};

var evaluate = function (input) {
    var output = '';
    try {
        var tree = parse(tokenize(input));
        output = evaluateInternal([defaultEnvironment], tree);
        //output = JSON.stringify(tree);
    } catch (error) {
        return error;
    }

    return output;
};

var input = process.stdin;
input.setEncoding('utf8');

input.on('data', function (text) {
    var result = evaluate(text.slice(0, text.length - 2));
    if (result !== undefined) {
        console.log(result);
    }
});

