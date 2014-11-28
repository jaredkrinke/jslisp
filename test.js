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
    ['(define size 2)'],
    ['size', 2],
    ['(* 5 size)', 10],
    ['(define pi 3.14159)'],
    ['(define radius 10)'],
    ['(* pi (* radius radius))', 314.159],
    ['(define circumference (* 2 pi radius))'],
    ['circumference', 62.8318],
]);

test('1.1.3', [
    ['(* (+ 2 (* 4 6)) (+ 3 5 7))', 390],
]);

test('1.1.4', [
    ['(define (square x) (* x x))'],
    ['(square 21)', 441],
    ['(square (+ 2 5))', 49],
    ['(square (square 3))', 81],
    ['(define (sum-of-squares x y) (+ (square x) (square y)))'],
    ['(sum-of-squares 3 4)', 25],
    ['(define (f a) (sum-of-squares (+ a 1) (* a 2)))'],
    ['(f 5)', 136],
]);

test('1.1.6', [
    ['(define (abs x) (cond ((> x 0) x) ((= x 0) 0) ((< x 0) (- x))))'],
    ['(define (abs x) (cond ((< x 0) (- x)) (else x)))'],
    ['(define (abs x) (if (< x 0) (- x) x))'],
    ['(and (> x 5) (< x 10))', false],
    ['(define (>= x y) (or (> x y) (= x y)))'],
    ['(define (>= x y) (not (< x y)))'],
]);

test('1.1.7', [
    ['(define (abs x) (if (< x 0) (- x) x))'],
    ['(define (square x) (* x x))'],
    ['(define (sqrt-iter guess x) (if (good-enough? guess x) guess (sqrt-iter (improve guess x) x)))'],
    ['(define (improve guess x) (average guess (/ x guess)))'],
    ['(define (average x y) (/ (+ x y) 2))'],
    ['(define (good-enough? guess x) (< (abs (- (square guess) x)) 0.001))'],
    ['(define (sqrt x) (sqrt-iter 1.0 x))'],
    ['(sqrt 9)', 3.00009155413138],
    ['(sqrt (+ 100 37))', 11.704699917758145],
    ['(sqrt (+ (sqrt 2) (sqrt 3)))', 1.7739279023207892],
    ['(square (sqrt 1000))', 1000.000369924366],
]);

test('1.1.8', [
    ['(define (abs x) (if (< x 0) (- x) x))'],
    ['(define (square x) (* x x))'],
    ['(define (average x y) (/ (+ x y) 2))'],
    ['(define (sqrt x) (define (good-enough? guess x) (< (abs (- (square guess) x)) 0.001)) (define (improve guess x) (average guess (/ x guess))) (define (sqrt-iter guess x) (if (good-enough? guess x) guess (sqrt-iter (improve guess x) x))) (sqrt-iter 1.0 x))'],
    ['(define (sqrt x) (define (good-enough? guess) (< (abs (- (square guess) x)) 0.001)) (define (improve guess) (average guess (/ x guess))) (define (sqrt-iter guess) (if (good-enough? guess) guess (sqrt-iter (improve guess)))) (sqrt-iter 1.0))'],
    ['(sqrt 9)', 3.00009155413138],
]);

test('1.2.1', [
    ['(define (factorial n) (if (= n 1) 1 (* n (factorial (- n 1)))))'],
    ['(factorial 6)', 720],
    ['(define (factorial n) (fact-iter 1 1 n))'],
    ['(define (fact-iter product counter max-count) (if (> counter max-count) product (fact-iter (* counter product) (+ counter 1) max-count)))'],
    ['(factorial 6)', 720],
]);

test('1.2.2', [
    ['(define (fib n) (cond ((= n 0) 0) ((= n 1) 1) (else (+ (fib (- n 1)) (fib (- n 2))))))'],
    ['(fib 5)', 5],
    ['(define (fib n) (fib-iter 1 0 n))'],
    ['(define (fib-iter a b count) (if (= count 0) b (fib-iter (+ a b) a (- count 1))))'],
    ['(fib 5)', 5],
    ['(define (count-change amount) (cc amount 5))'],
    ['(define (cc amount kinds-of-coins) (cond ((= amount 0) 1) ((or (< amount 0) (= kinds-of-coins 0)) 0) (else (+ (cc amount (- kinds-of-coins 1)) (cc (- amount (first-denomination kinds-of-coins)) kinds-of-coins)))))'],
    ['(define (first-denomination kinds-of-coins) (cond ((= kinds-of-coins 1) 1) ((= kinds-of-coins 2) 5) ((= kinds-of-coins 3) 10) ((= kinds-of-coins 4) 25) ((= kinds-of-coins 5) 50)))'],
    ['(count-change 100)', 292],
]);

//test('', [
//    ['', ],
//]);
