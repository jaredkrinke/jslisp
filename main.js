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

    var parse = function (input) {
    };

    var process = function (input) {
        var output = '';
        var tokens = tokenize(input);
        for (var i = 0, count = tokens.length; i < count; i++) {
            output += 'Token: ' + tokens[i] + '\n';
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
