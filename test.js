var JSLisp = require('./jsLisp.js');
var assert = require('assert');
var test = function (sectionName, testCases) {
    var interpreter = new JSLisp.Interpreter();

    console.log('Running: ' + sectionName);

    for (var i = 0, count = testCases.length; i < count; i++) {
        var testCase = testCases[i];
        var input = testCase[0];
        var expectedOutput = testCase[1];
        var actualOutput = interpreter.evaluate(input);
        assert.deepEqual(actualOutput, expectedOutput, 'Input:\n' + input + '\n\nExpected:\n' + expectedOutput + '\n\nActual:\n' + actualOutput + '\n');
    }
};

test('1.1.1', [
    ['486', 486],
    ['(+ 137 349)', 486],
    ['(- 1000 334)', 666],
    ['(* 5 99)', 495],
    ['(/ 10 5)', 2],
    ['(+ 2.7 10)', 12.7],
    ['(+ 21 35 12 7)', 75],
    ['(* 25 4 12)', 1200],
    ['(+ (* 3 5) (- 10 6))', 19],
    ['(+ (* 3 (+ (* 2 4) (+ 3 5))) (+ (- 10 7) 6))', 57],
]);

test('1.1.2', [
    ['(define size 2)', undefined],
    ['size', 2],
    ['(* 5 size)', 10],
    ['(define pi 3.14159)', undefined],
    ['(define radius 10)', undefined],
    ['(* pi (* radius radius))', 314.159],
    ['(define circumference (* 2 pi radius))', undefined],
    ['circumference', 62.8318],
]);

//test('', [
//    ['', ],
//]);
