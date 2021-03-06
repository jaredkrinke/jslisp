﻿var JSLisp = require('./jsLisp.js');
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

var createList = function () {
    var list = null;
    for (var i = arguments.length - 1; i >= 0; i--) {
        list = { head: arguments[i], tail: list };
    }
    return list;
};

var start = new Date();
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

test('1.2.4', [
    ['(define (square x) (* x x))'],
    ['(define (expt b n) (if (= n 0) 1 (* b (expt b (- n 1)))))'],
    ['(define (expt b n) (expt-iter b n 1))'],
    ['(define (expt-iter b counter product) (if (= counter 0) product (expt-iter b (- counter 1) (* b product))))'],
    ['(expt 3 4)', 81],
    ['(define (fast-expt b n) (cond ((= n 0) 1) ((even? n) (square (fast-expt b (/ n 2)))) (else (* b (fast-expt b (- n 1))))))'],
    ['(define (even? n) (= (remainder n 2) 0))'],
    ['(fast-expt 3 4)', 81],
]);

test('1.2.5', [
    ['(define (gcd a b) (if (= b 0) a (gcd b (remainder a b))))'],
    ['(gcd 27 18)', 9],
]);

test('1.2.6', [
    ['(define (square x) (* x x))'],
    ['(define (even? n) (= (remainder n 2) 0))'],
    ['(define (smallest-divisor n) (find-divisor n 2))'],
    ['(define (find-divisor n test-divisor) (cond ((> (square test-divisor) n) n) ((divides? test-divisor n) test-divisor) (else (find-divisor n (+ test-divisor 1)))))'],
    ['(define (divides? a b) (= (remainder b a) 0))'],
    ['(define (prime? n) (= n (smallest-divisor n)))'],
    ['(prime? 28)', false],
    ['(prime? 29)', true],
    ['(define (expmod base exp m) (cond ((= exp 0) 1) ((even? exp) (remainder (square (expmod base (/ exp 2) m)) m)) (else (remainder (* base (expmod base (- exp 1) m)) m))))'],
    ['(define (fermat-test n) (define (try-it a) (= (expmod a n n) a)) (try-it (+ 1 (random (- n 1)))))'],
    ['(define (fast-prime? n times) (cond ((= times 0) true) ((fermat-test n) (fast-prime? n (- times 1))) (else false)))'],
    ['(fast-prime? 28 10)', false],
    ['(fast-prime? 29 10)', true],
]);

// Note: Skipped 1.3

test('2.1.1', [
    ['(define x (cons 1 2))'],
    ['(car x)', 1],
    ['(cdr x)', 2],
    ['(define x (cons 1 2))'],
    ['(define y (cons 3 4))'],
    ['(define z (cons x y))'],
    ['(car (car z))', 1],
    ['(car (cdr z))', 3],
    ['(define (add-rat x y) (make-rat (+ (* (numer x) (denom y)) (* (numer y) (denom x))) (* (denom x) (denom y))))'],
    ['(define (sub-rat x y) (make-rat (- (* (numer x) (denom y)) (* (numer y) (denom x))) (* (denom x) (denom y))))'],
    ['(define (mul-rat x y) (make-rat (* (numer x) (numer y)) (* (denom x) (denom y))))'],
    ['(define (div-rat x y) (make-rat (* (numer x) (denom y)) (* (denom x) (numer y))))'],
    ['(define (equal-rat? x y) (= (* (numer x) (denom y)) (* (numer y) (denom x))))'],
    ['(define (make-rat n d) (cons n d))'],
    ['(define (numer x) (car x))'],
    ['(define (denom x) (cdr x))'],
    ['(define one-half (make-rat 1 2))'],
    ['(numer one-half)', 1],
    ['(denom one-half)', 2],
    ['(define one-third (make-rat 1 3))'],
    ['(numer (add-rat one-half one-third))', 5],
    ['(denom (mul-rat one-half one-third))', 6],
    ['(numer (add-rat one-third one-third))', 6],
    ['(define (gcd a b) (if (= b 0) a (gcd b (remainder a b))))'],
    ['(define (make-rat n d) (let ((g (gcd n d))) (cons (/ n g) (/ d g))))'],
    ['(denom (add-rat one-third one-third))', 3],
]);

test('2.1.3', [
    ['(define (cons x y) (define (dispatch m) (cond ((= m 0) x) ((= m 1) y) (else (error "Argument not 0 or 1 -- CONS" m)))) dispatch)'],
    ['(define (car z) (z 0))'],
    ['(define (cdr z) (z 1))'],
    ['(define x (cons 1 2))'],
    ['(car x)', 1],
    ['(cdr x)', 2],
    ['(define x (cons 1 2))'],
    ['(define y (cons 3 4))'],
    ['(define z (cons x y))'],
    ['(car (car z))', 1],
    ['(car (cdr z))', 3],
]);

test('2.2.1', [
    ['(define (abs x) (if (< x 0) (- x) x))'],
    ['(cons 1 (cons 2 (cons 3 (cons 4 nil))))', createList(1, 2, 3, 4)],
    ['(list 1 2 3 4)', createList(1, 2, 3, 4)],
    ['(define one-through-four (list 1 2 3 4))'],
    ['one-through-four', createList(1, 2, 3, 4)],
    ['(car one-through-four)', 1],
    ['(cdr one-through-four)', createList(2, 3, 4)],
    ['(car (cdr one-through-four))', 2],
    ['(cons 5 one-through-four)', createList(5, 1, 2, 3, 4)],
    ['(define (list-ref items n) (if (= n 0) (car items) (list-ref (cdr items) (- n 1))))'],
    ['(define squares (list 1 4 9 16 25))'],
    ['(list-ref squares 3)', 16],
    ['(define (length items) (if (null? items) 0 (+ 1 (length (cdr items)))))'],
    ['(define odds (list 1 3 5 7))'],
    ['(length odds)', 4],
    ['(define (length items) (define (length-iter a count) (if (null? a) count (length-iter (cdr a) (+ 1 count)))) (length-iter items 0))'],
    ['(length odds)', 4],
    ['(define (append list1 list2) (if (null? list1) list2 (cons (car list1) (append (cdr list1) list2))))'],
    ['(append squares odds)', createList(1, 4, 9, 16, 25, 1, 3, 5, 7)],
    ['(append odds squares)', createList(1, 3, 5, 7, 1, 4, 9, 16, 25)],
    ['(define (scale-list items factor) (if (null? items) nil (cons (* (car items) factor) (scale-list (cdr items) factor))))'],
    ['(scale-list (list 1 2 3 4 5) 10)', createList(10, 20, 30, 40, 50)],
    ['(define (map proc items) (if (null? items) nil (cons (proc (car items)) (map proc (cdr items)))))'],
    ['(map abs (list -10 2.5 -11.6 17))', createList(10, 2.5, 11.6, 17)],
    ['(map (lambda (x) (* x x)) (list 1 2 3 4))', createList(1, 4, 9, 16)],
    ['(define (scale-list items factor) (map (lambda (x) (* x factor)) items))'],
    ['(scale-list (list 1 2 3 4 5) 10)', createList(10, 20, 30, 40, 50)],
]);

test('2.2.2', [
    ['(cons (list 1 2) (list 3 4))', createList(createList(1, 2), 3, 4)],
    ['(define x (cons (list 1 2) (list 3 4)))'],
    ['(define (length items) (if (null? items) 0 (+ 1 (length (cdr items)))))'],
    ['(length x)', 3],
    ['(define (count-leaves x) (cond ((null? x) 0)  ((not (pair? x)) 1) (else (+ (count-leaves (car x)) (count-leaves (cdr x))))))'],
    ['(count-leaves x)', 4],
    ['(list x x)', createList(createList(createList(1, 2), 3, 4), createList(createList(1, 2), 3, 4))],
    ['(length (list x x))', 2],
    ['(count-leaves (list x x))', 8],
    ['(define (scale-tree tree factor) (cond ((null? tree) nil) ((not (pair? tree)) (* tree factor)) (else (cons (scale-tree (car tree) factor) (scale-tree (cdr tree) factor)))))'],
    ['(scale-tree (list 1 (list 2 (list 3 4) 5) (list 6 7)) 10)', createList(10, createList(20, createList(30, 40), 50), createList(60, 70))],
    ['(define (map proc items) (if (null? items) nil (cons (proc (car items)) (map proc (cdr items)))))'],
    ['(define (scale-tree tree factor) (map (lambda (sub-tree) (if (pair? sub-tree) (scale-tree sub-tree factor) (* sub-tree factor))) tree))'],
    ['(scale-tree (list 1 (list 2 (list 3 4) 5) (list 6 7)) 10)', createList(10, createList(20, createList(30, 40), 50), createList(60, 70))],
]);

test('2.2.3', [
    ['(define (odd? x) (= 0 (remainder x 2)))'],
    ['(define (square x) (* x x))'],
    ['(define (sum-odd-squares tree) (cond ((null? tree) 0)  ((not (pair? tree)) (if (odd? tree) (square tree) 0)) (else (+ (sum-odd-squares (car tree)) (sum-odd-squares (cdr tree))))))'],
    ['(define (even-fibs n) (define (next k) (if (> k n) nil (let ((f (fib k))) (if (even? f) (cons f (next (+ k 1))) (next (+ k 1)))))) (next 0))'],
    // TODO
]);

test('Mutation', [
    ['(define x 1)'],
    ['(define get-x (lambda () x))'],
    ['x', 1],
    ['(get-x)', 1],
    ['(set! x 2)'],
    ['x', 2],
    ['(get-x)', 2],
    ['(begin 1 2 3)', 3],
    ['(begin (set! x 3) x)', 3],
]);

//test('', [
//    ['', ],
//]);

var end = new Date();
console.log('Execution time: ' + ((end - start) / 1000) + 's');

