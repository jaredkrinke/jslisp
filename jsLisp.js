(function (exports) {
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

    var appendList = function (a, b) {
        if (a === null) {
            return b;
        }

        var node = a;
        while (node.tail) {
            node = node.tail;
        }

        node.tail = b;

        return a;
    };

    // TODO: Better term since improper lists count?
    var isList = function (o) {
        return o === null || isPair(o);
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
                        node = createPair('quote', parseRecursive(input, depth, state));
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
        return parseRecursive(input, 0, { index: 0 });
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
        cons: function (a, b) { return createPair(a, b); },
        car: function (pair) { return pair.head; },
        cdr: function (pair) { return pair.tail; },
        nil: null,
        'null?': function (x) { return x === null; },
        'pair?': function (x) { return isPair(x); },
        list: function () {
            return createList.apply(null, arguments);
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

    specialForms.quote = function (environments, list) {
        return list.head;
    };

    var createFunction = function (closingEnvironments, formalParameters, body) {
        return {
            closingEnvironments: closingEnvironments,
            formalParameters: formalParameters,
            body: body
        };
    };

    specialForms.lambda = function (environments, list) {
        var parameters = list.head;
        var identifierSet = {};
        var identifiers = [];
        for (var i = 0, parameter = parameters; parameter; parameter = parameter.tail) {
            var identifier = parseIdentifier(parameter.head);
            if (!identifier) {
                throw 'Invalid identifier: ' + parameter.head;
            }
        
            if (identifier in identifierSet) {
                throw 'Duplicate formal parameter: ' + identifier;
            }
        
            identifiers[i++] = identifier;
            identifierSet[identifier] = true;
        }

        return createFunction(environments, identifiers, list.tail);
    };

    specialForms.define = function (environments, list) {
        var first = list.head;
        if (isList(first)) {
            // Function: (define (name arg1 arg2 ...) exp1 exp2 ...)
            // Translate to: (define name (lambda (arg1 arg2 ...) exp1 exp2 ...))
            if (first.tail === null) {
                throw 'define: No identifier supplied'
            }

            return specialForms.define(environments, createList(first.head, appendList(createList('lambda', first.tail), list.tail)));
        } else {
            // Variable: name
            var identifier = parseIdentifier(list.head);
            if (!identifier) {
                throw 'define: Invalid identifier: ' + list.head;
            }

            environments[0][identifier] = evaluateInternal(environments, list.tail.head);
        }
    };

    var createLet = function (sequential) {
        return function (environments, list) {
            // Evaluate all the expressions and bind the values
            var localEnvironment = {};
            var localEnvironments = [localEnvironment].concat(environments);
            for (var bindings = list.head; bindings; bindings = bindings.tail) {
                var binding = bindings.head;
                var identifier = parseIdentifier(binding.head);
                if (identifier === null) {
                    throw 'Invalid identifier in let: ' + binding.head;
                }

                var initializeExpression = binding.tail.head;
                if (initializeExpression) {
                    localEnvironment[identifier] = evaluateInternal(sequential ? localEnvironments : environments, initializeExpression);
                } else {
                    localEnvironment[identifier] = null;
                }
            }
    
            // Execute the body
            var result;
            for (list = list.tail; list; list = list.tail) {
                result = evaluateInternal(localEnvironments, list.head);
            }
    
            return result;
        };
    };

    specialForms.let = createLet(false);
    specialForms['let*'] = createLet(true);
    // TODO: letrec?

    specialForms.cond = function (environments, list) {
        var result;
        for (; list; list = list.tail) {
            var clause = list.head;
            var predicate = clause.head;
            var consequent = clause.tail.head;
            if (predicate === 'else' || evaluateInternal(environments, predicate) === true) {
                return evaluateInternal(environments, consequent);
            }
        }
        return result;
    };

    specialForms.if = function (environments, list) {
        var predicate = list.head;
        var consequent = list.tail.head;
        if (evaluateInternal(environments, predicate) === true) {
            return evaluateInternal(environments, consequent);
        } else {
            var alternative = list.tail.tail.head;
            return evaluateInternal(environments, alternative);
        }
    };

    specialForms.and = function (environments, list) {
        var result;
        for (; list; list = list.tail) {
            result = evaluateInternal(environments, list.head);
            if (result !== true) {
                return false;
            }
        }

        return result;
    };

    specialForms.or = function (environments, list) {
        for (; list; list = list.tail) {
            var result = evaluateInternal(environments, list.head);
            if (result !== false) {
                return result;
            }
        }

        return false;
    };

    specialForms.not = function (environments, list) {
        if (evaluateInternal(environments, list.head) === false) {
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
        if (expression === null) {
            return null;
        } else {
            if (isList(expression)) {
                // Combination
                var operator = expression.head;
                if (!operator) {
                    throw 'Invalid combination: ()';
                }

                var specialForm;
                if (!isList(operator) && (specialForm = specialForms[operator])) {
                    // Special form
                    return specialForm(environments, expression.tail);
                } else {
                    var f = evaluateInternal(environments, operator);

                    // Evaluate subexpressions
                    var operands = [];
                    for (var operand = expression.tail; operand; operand = operand.tail) {
                        operands.push(evaluateInternal(environments, operand.head));
                    }

                    if (typeof(f) === 'function') {
                        // Built-in function
                        result = f.apply(null, operands);
                    } else if (isFunctionValue(f)) {
                        // Custom function
                        var formalParameters = f.formalParameters;
                        var localEnvironment = {};
                        for (var i = 0, count1 = formalParameters.length, count2 = operands.length; i < count1 && i < count2; i++) {
                            localEnvironment[formalParameters[i]] = operands[i];
                        }

                        // Evaluate each expression in the local environment and return the last value
                        // TODO: Tail recursion?
                        var localEnvironments = [localEnvironment].concat(f.closingEnvironments);
                        for (var bodyExpression = f.body; bodyExpression; bodyExpression = bodyExpression.tail) {
                            result = evaluateInternal(localEnvironments, bodyExpression.head);
                        }
                    } else {
                        throw 'Non-function used as an operator: ' + f;
                    }
                }
            } else {
                // Literal
                var result = parseFloat(expression);
                if (isNaN(result)) {
                    if (typeof (expression) === 'string' && expression.length >= 1 && expression[0] === '"') {
                        result = expression.slice(1, expression.length - 1);
                    } else {
                        result = lookup(environments, expression);

                        if (result === undefined) {
                            throw 'No variable named: ' + expression;
                        }
                    }
                }
            }
        }

        return result;
    };

    var evaluate = function (environment, input) {
        var tree = parse(tokenize(input));
        var localEnvironment = environment || {};
        var result;
        var environments = [localEnvironment, defaultEnvironment];
        for (; tree !== null; tree = tree.tail) {
            result = evaluateInternal(environments, tree.head);
        }
        return result;
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
        output = evaluate(this.localEnvironment, input);

        return output;
    };

    Interpreter.prototype.format = format;

    // Exports
    exports.Interpreter = Interpreter;
})(typeof (exports) === 'undefined' ? (JSLisp = {}) : exports);

