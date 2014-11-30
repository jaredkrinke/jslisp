(function (exports) {
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

        // Lists
        cons: function (a, b) { return { head: a, tail: b }; },
        car: function (pair) { return pair.head; },
        cdr: function (pair) { return pair.tail; },
    };

    // Special forms
    // TODO: Do special forms really need a separate lookup table?
    specialForms = {};

    specialForms.quote = function (environments, datum) {
        return datum;
    };

    var createFunction = function (name, closingEnvironments, formalParameters, body) {
        return {
            name: name,
            closingEnvironments: closingEnvironments,
            formalParameters: formalParameters,
            body: body
        };
    };

    specialForms.lambda = function (environments, formalParameters) {
        return createFunction(null, environments, formalParameters, Array.prototype.slice.call(arguments, 2));
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
            var name = identifiers[0];
            // TODO: Should there be a closing environment?
            environments[0][name] = createFunction(name, null, identifiers.slice(1), Array.prototype.slice.call(arguments, 2));
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
        if (Array.isArray(expression)) {
            // Combination
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

                    if (f.name) {
                        localEnvironment[f.name] = f;
                    }

                    for (var i = 0, count = formalParameters.length; i < count; i++) {
                        localEnvironment[formalParameters[i]] = operands[i];
                    }

                    // Evaluate each expression in the local environment and return the last value
                    // TODO: Tail recursion?
                    var localEnvironments = [localEnvironment].concat(f.closingEnvironments || environments);
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
            // TODO: How to distinguish literals? Also handle strings
            var result = parseFloat(expression);
            if (isNaN(result)) {
                result = lookup(environments, expression);

                if (result === undefined) {
                    throw 'No variable named: ' + expression;
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

    // Exports
    exports.Interpreter = Interpreter;
})(typeof (exports) === 'undefined' ? (JSLisp = {}) : exports);
