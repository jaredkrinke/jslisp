$(function () {
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

    var parse = function (input, depth, state) {
        if (state === undefined) {
            state = { index: 0 };
        }

        var node = [];
        for (; state.index < input.length;) {
            var token = input[state.index];
            state.index++;

            if (token === '(') {
                node.push(parse(input, depth + 1, state));
            } else if (token === ')') {
                if (depth <= 0) {
                    throw 'Syntax error';
                } else {
                    break;
                }
            } else {
                node.push(token);
            }
        }

        return node;
    };

    var process = function (input) {
        var output = '';
        try {
            var tree = parse(tokenize(input));
            output = JSON.stringify(tree);
        } catch (error) {
            return error;
        }

        return output;
    };

    var input = $('#input');
    var output = $('#output');
    $('#execute').click(function (e) {
        e.preventDefault();
        output.text(process(input.text()));
    });
});
