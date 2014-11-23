$(function () {
    var input = $('#input');
    var output = $('#output');
    $('#execute').click(function (e) {
        e.preventDefault();
        output.text(input.text());
    });
});
