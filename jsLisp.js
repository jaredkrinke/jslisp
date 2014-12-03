﻿(function (exports) {
    var tokenizerState = {
        initial: 0,
        inToken: 1,
        inString: 2,
    };

    var tokenize = function (input) {
        var output = [];
        var state = tokenizerState.initial;
        var tokenStart = 0;
        for (var i = 0, count = input.length; i < count; i++) {
            switch (state) {
                case tokenizerState.initial:
                    {
                        switch (input[i]) {
                            case '(':
                            case ')':
                            case '\'':
                                output.push(input[i]);
                                break;

                            case ' ':
                            case '\n':
                                break;

                            case '"':
                                state = tokenizerState.inString;
                                tokenStart = i;
                                break;

                            default:
                                state = tokenizerState.inToken;
                                tokenStart = i;
                                break;
                        }
                    }
                    break;

                case tokenizerState.inToken:
                    {
                        switch (input[i]) {
                            case '(':
                            case ')':
                            case '\'':
                                output.push(input.slice(tokenStart, i));
                                output.push(input[i]);
                                state = tokenizerState.initial;
                                break;

                            case ' ':
                            case '\n':
                                output.push(input.slice(tokenStart, i));
                                state = tokenizerState.initial;
                                break;
                        }
                    }
                    break;

                case tokenizerState.inString:
                    {
                        switch (input[i]) {
                            case '"':
                                // Handle escape characters
                                var text = '';
                                for (var j = tokenStart; j <= i; j++) {
                                    var character = input[j];
                                    if (character !== '\\') {
                                        text += character;
                                    }
                                }

                                output.push(text);
                                state = tokenizerState.initial;
                                break;

                            case '\\':
                                i++;
                                break;
                        }
                    }
                    break;
            }
        }

        switch (state) {
            case tokenizerState.inToken:
                output.push(input.slice(tokenStart));
                break;
        
            case tokenizerState.inString:
                throw 'Expected "';
                break;
        }

        return output;
    };

    var createPair = function (head, tail) {
        return { head: head, tail: tail };
    };

    var isPair = function (o) {
        return o.head !== undefined;
    };

    var createList = function () {
        var list = null;
        for (var i = arguments.length - 1; i >= 0; i--) {
            list = createPair(arguments[i], list);
        }
        return list;
    };

    // TODO: Better term since improper lists count?
    var isList = function (o) {
        return o === null || isPair(o);
    };

    var listToArray = function (list) {
        var array = [];
        for (; list !== null; list = list.tail) {
            array.push(list.head);
        }
        return array;
    };

    var parseRecursive = function (input, depth, state) {
        if (state.index < input.length) {
            var token = input[state.index++];
            var node = token;
            if (token.length === 1) {
                switch (token[0]) {
                    case '(':
                        node = parseRecursive(input, depth + 1, state);
                        break;

                    case ')':
                        if (depth <= 0) {
                            throw 'Extra ")"';
                        }
                        return null;

                    case '\'':
                        node = createPair('quote', parseRecursive(input, state));
                        break;
                }
            }

            return createPair(node, parseRecursive(input, depth, state));
        } else if (depth > 0) {
            throw 'Missing ")"';
        }

        return null;
    };

    var parse = function (input) {
        return parseRecursive(input, 0, { index: 0 }).head;
    };

    var identifierPattern = /[^0-9,#();"'`|[\]{}][^,#();"'`|[\]{}]*/i;
    var parseIdentifier = function (text) {
        return (!isPair(text) && identifierPattern.test(text)) ? text : null;
    };

    var defaultEnvironment = {
        // Arithmetic
        '+': function () {
            var result = 0;
            for (var i = 0, count = arguments.length; i < count; i++) {
                result += parseFloat(arguments[i]);
            }
            return result;
        },

        '-': function (a, b) {
            if (b !== undefined) {
                return parseFloat(a) - parseFloat(b);
            }

            return -parseFloat(a);
        },

        '*': function () {
            var result = 1;
            for (var i = 0, count = arguments.length; i < count; i++) {
                result *= parseFloat(arguments[i]);
            }
            return result;
        },

        '/': function (a, b) { return parseFloat(a) / parseFloat(b); },
        remainder: function (a, b) { return parseFloat(a) % parseFloat(b); },
        random: function (n) { return Math.floor(Math.random() * n); },

        '>': function (a, b) { return parseFloat(a) > parseFloat(b); },
        '>=': function (a, b) { return parseFloat(a) >= parseFloat(b); },
        '=': function (a, b) { return parseFloat(a) === parseFloat(b); },
        '<=': function (a, b) { return parseFloat(a) <= parseFloat(b); },
        '<': function (a, b) { return parseFloat(a) < parseFloat(b); },

        // Symbols
        'eq?': function (a, b) { return a === b; },
        'true': true,
        'false': false,

        // Lists
        cons: function (a, b) { return { head: a, tail: b }; },
        car: function (pair) { return pair.head; },
        cdr: function (pair) { return pair.tail; },
        nil: null,
        'null?': function (x) { return x === null; },
        'pair?': function (x) { return isPair(x); },
        list: function () {
            return createList.call(null, arguments);
        },
        // Note: Continued below

        // Output
        display: function (x) { process.stdout.write(x.toString()); },
        newline: function (x) { process.stdout.write('\n'); },

        // Error handling
        error: function (x) { throw x; },
    };

    // cadr, caddr, etc. (up to a depth of 4)
    for (var depth = 2; depth <= 4; depth++) {
        // Create functions for each possible sequence of this depth
        for (var i = 0, count = (1 << depth); i < count; i++) {
            // Walk through each bit and create the label (1 means head, 0 means tail)
            var label = '';
            for (var j = 0; j < depth; j++) {
                label += ((i >> j) & 1) ? 'a' : 'd';
            }

            // E.g. caddr is implemented as car(cddr(...))
            defaultEnvironment['c' + label + 'r'] = (function (firstOperation, secondOperation) {
                return function (pair) { return firstOperation(secondOperation(pair)); };
            })(defaultEnvironment['c' + label.slice(0, 1) + 'r'], defaultEnvironment['c' + label.slice(1) + 'r']);
        }
    }

    // Special forms
    // TODO: Do special forms really need a separate lookup table?
    specialForms = {};

    specialForms.quote = function (environments, datum) {
        return datum;
    };

    var createFunction = function (closingEnvironments, formalParameters, body) {
        return {
            closingEnvironments: closingEnvironments,
            formalParameters: formalParameters,
            body: body
        };
    };

    specialForms.lambda = function (environments, formalParameters) {
        var identifierSet = {};
        var identifiers = [];
        for (var i = 0, count = formalParameters.length; i < count; i++) {
            var identifier = parseIdentifier(formalParameters[i]);
            if (!identifier) {
                throw 'define: Invalid identifier: ' + formalParameters[i];
            }
        
            if (identifier in identifierSet) {
                throw 'define: Duplicate formal parameter: ' + identifier;
            }
        
            identifiers[i] = identifier;
            identifierSet[identifier] = true;
        }

        return createFunction(environments, identifiers, Array.prototype.slice.call(arguments, 2));
    };

    specialForms.define = function (environments, nameExpression, valueExpression) {
        if (isList(nameExpression)) {
            // Function: (define (name arg1 arg2 ...) exp1 exp2 ...)
            // Translate to: (define name (lambda (arg1 arg2 ...) exp1 exp2 ...))
            // TODO: Again, more graceful
            nameExpression = listToArray(nameExpression);
            if (nameExpression.length < 1) {
                throw 'define: No identifier supplied'
            }

            return specialForms.define(environments, nameExpression[0], createList.call([
                'lambda',
                nameExpression.slice(1)
            ].concat(Array.prototype.slice.call(arguments, 2))));
        } else {
            // Variable: name
            var identifier = parseIdentifier(nameExpression);
            if (!identifier) {
                throw 'define: Invalid identifier: ' + nameExpression;
            }

            environments[0][identifier] = evaluateInternal(environments, valueExpression);
        }
    };

    var createLet = function (sequential) {
        return function (environments, bindings) {
            // Evaluate all the expressions and bind the values
            var localEnvironment = {};
            var localEnvironments = [localEnvironment].concat(environments);
            for (var i = 0, count = bindings.length; i < count; i++) {
                var binding = bindings[i];
                var identifier = parseIdentifier(binding[0]);
                var initializeExpression = binding[1];
                if (initializeExpression) {
                    localEnvironment[identifier] = evaluateInternal(sequential ? localEnvironments : environments, initializeExpression);
                } else {
                    localEnvironment[identifier] = null;
                }
            }
    
            // Execute the body
            var result;
            for (var i = 2, count = arguments.length; i < count; i++) {
                result = evaluateInternal(localEnvironments, arguments[i]);
            }
    
            return result;
        };
    };

    specialForms.let = createLet(false);
    specialForms['let*'] = createLet(true);
    // TODO: letrec?

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

    var isFunctionValue = function (o) {
        return o.formalParameters && o.body;
    }

    var evaluateInternal = function (environments, expression) {
        var result;
        if (isList(expression)) {
            // Combination
            // TODO: Something more graceful than this...
            expression = listToArray(expression);
            var operator = expression[0];

            var specialForm;
            if (!Array.isArray(operator) && (specialForm = specialForms[operator])) {
                // Special form
                return specialForm.apply(null, [environments].concat(expression.slice(1)));
            } else {
                if (expression.length < 1) {
                    throw 'Invalid combination: ()';
                }

                var f = evaluateInternal(environments, expression[0]);

                // Evaluate subexpressions
                var operands = [];
                for (var i = 1, count = expression.length; i < count; i++) {
                    operands[i - 1] = evaluateInternal(environments, expression[i]);
                }

                if (typeof (f) === 'function') {
                    // Built-in function
                    result = f.apply(null, operands);
                } else if (isFunctionValue(f)) {
                    // Custom function
                    var formalParameters = f.formalParameters;
                    var localEnvironment = {};
                    for (var i = 0, count = formalParameters.length; i < count; i++) {
                        localEnvironment[formalParameters[i]] = operands[i];
                    }

                    // Evaluate each expression in the local environment and return the last value
                    // TODO: Tail recursion?
                    var localEnvironments = [localEnvironment].concat(f.closingEnvironments);
                    var body = f.body;
                    for (var i = 0, count = body.length; i < count; i++) {
                        result = evaluateInternal(localEnvironments, body[i]);
                    }
                } else {
                    throw 'Non-function used as an operator: ' + f;
                }
            }
        } else {
            // Literal
            var result = parseFloat(expression);
            if (isNaN(result)) {
                if (typeof(expression) === 'string' && expression.length >= 1 && expression[0] === '"') {
                    result = expression.slice(1, expression.length - 1);
                } else {
                    result = lookup(environments, expression);

                    if (result === undefined) {
                        throw 'No variable named: ' + expression;
                    }
                }
            }
        }
        return result;
    };

    var evaluate = function (environment, input) {
        var tree = parse(tokenize(input));
        var localEnvironment = environment || {};
        return evaluateInternal([localEnvironment, defaultEnvironment], tree);
    };

    var format = function (value) {
        var output;
        if (value === null) {
            output = '()';
        } else if (value.head) {
            var first = true;
            output = '(';
            for (; value !== null; value = value.tail) {
                if (first) {
                    first = false;
                } else {
                    output += ' ';
                }

                if (value.head === undefined) {
                    return 'Improper list';
                }
                
                output += format(value.head);
            }
            output += ')';
        } else {
            output = value.toString();
        }
        return output;
    };

    var Interpreter = function () {
        this.localEnvironment = {};
    }

    Interpreter.prototype.evaluate = function (input) {
        var output;
        try {
            output = evaluate(this.localEnvironment, input);
        } catch (error) {
            return error;
        }

        return output;
    };

    Interpreter.prototype.format = format;

    // Exports
    exports.Interpreter = Interpreter;

    // TODO: Remove
    exports.tokenize = tokenize;
    exports.parse = parse;
})(typeof (exports) === 'undefined' ? (JSLisp = {}) : exports);

// TODO: Remove
var input = '(define (square x) (* x x))';
var tokenized, parsed, evaluated, formatted;
var interpreter = new exports.Interpreter();
console.log(tokenized = exports.tokenize(input));
console.log(parsed = exports.parse(tokenized));
console.log(interpreter.format(parsed));
console.log(evaluated = interpreter.evaluate(input));
if (evaluated !== undefined) {
    console.log(formatted = interpreter.format(evaluated));
}

