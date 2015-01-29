$(function () {
    // Set up the editor
    var input = $('#editorInput');
    var output = $('#editorOutput');
    var execute = $('#editorExecute');

    // Create code editor for the input
    var editor;
    var evaluate = function () {
        var outputText;
        try {
            var inputText = editor.getValue();
            var result = interpreter.evaluate(inputText);
            if (result !== undefined) {
                outputText = interpreter.format(result);
            }
        } catch (e) {
            outputText = e.toString();
        }

        output.val(outputText);
    };

    // Set up basic evaluation and output
    var interpreter = new JSLisp.Interpreter();
    execute.click(function (e) {
        e.preventDefault();
        evaluate();
    });

    editor = CodeMirror.fromTextArea(input.get(0),
        {
            mode: 'scheme',
            extraKeys: {
                'Ctrl-Enter': evaluate
            }
        });

    // Attach editor to code samples
    var editorModal = $('#editorModal');
    var showEditor = (function () {
        var newText = '';
        editorModal.on('shown.bs.modal', function () {
            editor.setValue(newText.trim());
            editor.focus();
            editor.execCommand('goDocEnd');
        });

        return function (text) {
            editorModal.modal('show');
            if (text !== undefined) {
                newText = text;
            }
        };
    })();

    $('body > div.container > pre').click(function (e) {
        showEditor($(this).text());
    });

    $('#editorButton').click(function () {
        showEditor();
    });
});

