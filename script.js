/* =========================================================
   KRISHNA'S B.TECH CSE SCIENTIFIC CALCULATOR
   HTML + CSS same राख्ने
   केवल script.js replace गर्ने
========================================================= */

const display = document.getElementById("display");

let expression = "";
let answer = "0";
let memory = "0";

let angleMode = "DEG";
let shiftMode = false;
let alphaMode = false;

let history = [];
let historyIndex = -1;


/* =========================================================
   DISPLAY
========================================================= */

function updateDisplay(value = expression) {
    display.textContent =
        value === "" ? "0" : String(value);
}

function error(message = "Math ERROR") {
    display.textContent = message;
}


/* =========================================================
   BASIC NUMBER FORMAT
========================================================= */

function cleanNumber(n) {
    if (!Number.isFinite(n)) {
        return String(n);
    }

    if (Object.is(n, -0)) {
        n = 0;
    }

    return Number(n.toPrecision(14)).toString();
}


/* =========================================================
   SCIENTIFIC NUMBER
   Example:
   1 × 10^1000000
   2.35 × 10^-1000000
========================================================= */

function sci(mantissa, exponent) {

    if (mantissa === 0) {
        return {
            m: 0,
            e: 0
        };
    }

    let sign = mantissa < 0 ? -1 : 1;

    mantissa = Math.abs(mantissa);

    while (mantissa >= 10) {
        mantissa /= 10;
        exponent++;
    }

    while (mantissa < 1) {
        mantissa *= 10;
        exponent--;
    }

    return {
        m: sign * mantissa,
        e: exponent
    };
}


function sciToString(x) {

    if (x.m === 0) {
        return "0";
    }

    return cleanNumber(x.m) + "×10^" + x.e;
}


/* =========================================================
   CONVERT NORMAL NUMBER TO SCI
========================================================= */

function numberToSci(n) {

    if (n === 0) {
        return {
            m: 0,
            e: 0
        };
    }

    if (!Number.isFinite(n)) {
        throw new Error("Invalid");
    }

    let exponent =
        Math.floor(Math.log10(Math.abs(n)));

    let mantissa =
        n / Math.pow(10, exponent);

    return sci(mantissa, exponent);
}


/* =========================================================
   SCI ADD
========================================================= */

function sciAdd(a, b) {

    if (a.m === 0) return b;
    if (b.m === 0) return a;

    let difference = a.e - b.e;

    /*
       If exponent difference is enormous,
       smaller value has no practical effect.
    */

    if (difference > 20) {
        return a;
    }

    if (difference < -20) {
        return b;
    }

    let common = Math.max(a.e, b.e);

    let am =
        a.m * Math.pow(10, a.e - common);

    let bm =
        b.m * Math.pow(10, b.e - common);

    return sci(am + bm, common);
}


/* =========================================================
   SCI SUBTRACT
========================================================= */

function sciSub(a, b) {

    return sciAdd(
        a,
        {
            m: -b.m,
            e: b.e
        }
    );
}


/* =========================================================
   SCI MULTIPLY
========================================================= */

function sciMul(a, b) {

    if (a.m === 0 || b.m === 0) {
        return {
            m: 0,
            e: 0
        };
    }

    return sci(
        a.m * b.m,
        a.e + b.e
    );
}


/* =========================================================
   SCI DIVIDE
========================================================= */

function sciDiv(a, b) {

    if (b.m === 0) {
        throw new Error("Division by zero");
    }

    return sci(
        a.m / b.m,
        a.e - b.e
    );
}


/* =========================================================
   SCI POWER
========================================================= */

function sciPow(base, power) {

    if (base.m === 0 && power < 0) {
        throw new Error("Math");
    }

    if (power === 0) {
        return {
            m: 1,
            e: 0
        };
    }

    /*
       For integer powers this is extremely reliable.
    */

    if (Number.isInteger(power)) {

        let sign = 1;

        if (base.m < 0 && Math.abs(power) % 2 === 1) {
            sign = -1;
        }

        let log10 =
            Math.log10(Math.abs(base.m)) +
            base.e;

        let total =
            log10 * power;

        let exponent =
            Math.floor(total);

        let mantissa =
            Math.pow(
                10,
                total - exponent
            );

        return sci(
            sign * mantissa,
            exponent
        );
    }

    /*
       Normal fractional power
    */

    let normal =
        sciToNumber(base);

    let result =
        Math.pow(normal, power);

    if (!Number.isFinite(result)) {

        let log10 =
            Math.log10(Math.abs(normal)) *
            power;

        let exponent =
            Math.floor(log10);

        let mantissa =
            Math.pow(
                10,
                log10 - exponent
            );

        return sci(
            mantissa,
            exponent
        );
    }

    return numberToSci(result);
}


/* =========================================================
   SCI TO NORMAL NUMBER
========================================================= */

function sciToNumber(x) {

    if (x.m === 0) {
        return 0;
    }

    if (x.e > 308) {
        return x.m > 0 ? Infinity : -Infinity;
    }

    if (x.e < -324) {
        return 0;
    }

    return x.m * Math.pow(10, x.e);
}


/* =========================================================
   STRING → SCI
========================================================= */

function stringToSci(str) {

    str = String(str).trim();

    /*
       1×10^1000
       1e1000
       1E1000
    */

    let match =
        str.match(
            /^([+-]?\d+(?:\.\d+)?)\s*(?:×10\^|[eE])\s*([+-]?\d+)$/
        );

    if (match) {

        let m = Number(match[1]);
        let e = Number(match[2]);

        return sci(m, e);
    }

    /*
       Normal number
    */

    let n = Number(str);

    if (!Number.isFinite(n)) {
        throw new Error("Invalid");
    }

    return numberToSci(n);
}


/* =========================================================
   TOKENIZER
========================================================= */

function tokenize(str) {

    let tokens = [];
    let i = 0;

    while (i < str.length) {

        let c = str[i];

        if (/\s/.test(c)) {
            i++;
            continue;
        }

        /*
           ×10^100
        */

        let scientific =
            str.slice(i).match(
                /^(\d+(?:\.\d+)?)×10\^([+-]?\d+)/
            );

        if (scientific) {

            let m = Number(scientific[1]);
            let e = Number(scientific[2]);

            tokens.push({
                type: "number",
                value: sci(m, e)
            });

            i += scientific[0].length;
            continue;
        }

        /*
           Normal number
        */

        let number =
            str.slice(i).match(
                /^(?:\d+(?:\.\d*)?|\.\d+)/
            );

        if (number) {

            tokens.push({
                type: "number",
                value: numberToSci(
                    Number(number[0])
                )
            });

            i += number[0].length;
            continue;
        }

        if (c === "+") {
            tokens.push({ type: "+", value: "+" });
            i++;
            continue;
        }

        if (c === "-") {
            tokens.push({ type: "-", value: "-" });
            i++;
            continue;
        }

        if (c === "*") {
            tokens.push({ type: "*", value: "*" });
            i++;
            continue;
        }

        if (c === "/") {
            tokens.push({ type: "/", value: "/" });
            i++;
            continue;
        }

        if (c === "^") {
            tokens.push({ type: "^", value: "^" });
            i++;
            continue;
        }

        if (c === "(") {
            tokens.push({ type: "(", value: "(" });
            i++;
            continue;
        }

        if (c === ")") {
            tokens.push({ type: ")", value: ")" });
            i++;
            continue;
        }

        if (c === "π") {

            tokens.push({
                type: "number",
                value: numberToSci(Math.PI)
            });

            i++;
            continue;
        }

        if (c === "e") {

            tokens.push({
                type: "number",
                value: numberToSci(Math.E)
            });

            i++;
            continue;
        }

        throw new Error("Invalid character");
    }

    return tokens;
}


/* =========================================================
   RECURSIVE DESCENT PARSER
========================================================= */

function parseExpression(str) {

    let tokens = tokenize(str);
    let position = 0;


    function peek() {
        return tokens[position];
    }


    function consume(type) {

        let token = tokens[position];

        if (!token || token.type !== type) {
            throw new Error("Syntax");
        }

        position++;

        return token;
    }


    function parseAddSub() {

        let result = parseMulDiv();

        while (
            peek() &&
            (peek().type === "+" ||
             peek().type === "-")
        ) {

            let op = peek().type;
            position++;

            let right =
                parseMulDiv();

            if (op === "+") {
                result =
                    sciAdd(result, right);
            } else {
                result =
                    sciSub(result, right);
            }
        }

        return result;
    }


    function parseMulDiv() {

        let result = parsePower();

        while (
            peek() &&
            (peek().type === "*" ||
             peek().type === "/")
        ) {

            let op = peek().type;
            position++;

            let right =
                parsePower();

            if (op === "*") {
                result =
                    sciMul(result, right);
            } else {
                result =
                    sciDiv(result, right);
            }
        }

        return result;
    }


    function parsePower() {

        let left =
            parseUnary();

        if (
            peek() &&
            peek().type === "^"
        ) {

            position++;

            let right =
                parsePower();

            let exponent =
                sciToNumber(right);

            /*
               Huge integer exponent supported.
            */

            if (
                !Number.isFinite(exponent) ||
                Math.abs(exponent) > 1000000000
            ) {
                throw new Error("Exponent too large");
            }

            left =
                sciPow(
                    left,
                    exponent
                );
        }

        return left;
    }


    function parseUnary() {

        if (
            peek() &&
            peek().type === "+"
        ) {

            position++;

            return parseUnary();
        }

        if (
            peek() &&
            peek().type === "-"
        ) {

            position++;

            let value =
                parseUnary();

            return {
                m: -value.m,
                e: value.e
            };
        }

        return parsePrimary();
    }


    function parsePrimary() {

        if (
            peek() &&
            peek().type === "number"
        ) {

            return consume("number").value;
        }

        if (
            peek() &&
            peek().type === "("
        ) {

            consume("(");

            let result =
                parseAddSub();

            consume(")");

            return result;
        }

        throw new Error("Syntax");
    }


    let result =
        parseAddSub();

    if (position !== tokens.length) {
        throw new Error("Syntax");
    }

    return result;
}


/* =========================================================
   EVALUATE
========================================================= */

function evaluate(str) {

    return parseExpression(
        str
            .replace(/×/g, "*")
            .replace(/÷/g, "/")
    );
}


/* =========================================================
   FORMAT RESULT
========================================================= */

function formatResult(x) {

    if (typeof x === "string") {
        return x;
    }

    if (x.m === 0) {
        return "0";
    }

    /*
       Normal range
    */

    if (
        x.e >= -9 &&
        x.e <= 11
    ) {

        let n =
            sciToNumber(x);

        return cleanNumber(n);
    }

    return sciToString(x);
}


/* =========================================================
   GET CURRENT VALUE
========================================================= */

function currentValue() {

    if (!expression) {
        return {
            m: 0,
            e: 0
        };
    }

    return evaluate(expression);
}


/* =========================================================
   INPUT NUMBERS
========================================================= */

document
.querySelectorAll(".number-key")
.forEach(button => {

    button.addEventListener("click", () => {

        let value =
            button.dataset.value;

        expression += value;

        shiftMode = false;
        alphaMode = false;

        updateIndicators();
        updateDisplay();
    });

});


/* =========================================================
   DECIMAL
========================================================= */

document
.querySelectorAll('[data-value="."]')
.forEach(button => {

    button.addEventListener("click", () => {

        /*
           Find last number
        */

        let parts =
            expression.split(
                /[+\-*/^()]/
            );

        let last =
            parts[parts.length - 1];

        if (!last.includes(".")) {

            expression += ".";

            updateDisplay();
        }
    });

});


/* =========================================================
   OPERATORS
========================================================= */

document
.querySelectorAll(".operator-key")
.forEach(button => {

    button.addEventListener("click", () => {

        let op =
            button.dataset.value;

        if (
            expression === "" &&
            op !== "-"
        ) {
            return;
        }

        let last =
            expression.slice(-1);

        if ("+-*/^".includes(last)) {

            expression =
                expression.slice(0, -1);
        }

        expression += op;

        updateDisplay();
    });

});


/* =========================================================
   BRACKETS
========================================================= */

document
.querySelectorAll('[data-value="("]')
.forEach(button => {

    button.addEventListener("click", () => {

        expression += "(";
        updateDisplay();

    });

});


document
.querySelectorAll('[data-value=")"]')
.forEach(button => {

    button.addEventListener("click", () => {

        expression += ")";
        updateDisplay();

    });

});


/* =========================================================
   DELETE
========================================================= */

document
.querySelector('[data-action="delete"]')
.addEventListener("click", () => {

    expression =
        expression.slice(0, -1);

    updateDisplay();
});


/* =========================================================
   AC
========================================================= */

document
.querySelector('[data-action="clear"]')
.addEventListener("click", () => {

    expression = "";

    shiftMode = false;
    alphaMode = false;

    updateIndicators();
    updateDisplay("0");
});


/* =========================================================
   ANGLE MODE
========================================================= */

function toRad(x) {

    return angleMode === "DEG"
        ? x * Math.PI / 180
        : x;
}

function fromRad(x) {

    return angleMode === "DEG"
        ? x * 180 / Math.PI
        : x;
}


/* =========================================================
   NORMAL SCIENTIFIC FUNCTION
========================================================= */

function applyFunction(name) {

    try {

        let x =
            currentValue();

        let n =
            sciToNumber(x);

        let result;


        switch (name) {

            /* ---------------- SIN ---------------- */

            case "sin":

                if (!Number.isFinite(n))
                    throw new Error();

                result =
                    Math.sin(toRad(n));

                break;


            /* ---------------- COS ---------------- */

            case "cos":

                if (!Number.isFinite(n))
                    throw new Error();

                result =
                    Math.cos(toRad(n));

                break;


            /* ---------------- TAN ---------------- */

            case "tan":

                if (!Number.isFinite(n))
                    throw new Error();

                result =
                    Math.tan(toRad(n));

                break;


            /* ---------------- SIN^-1 ---------------- */

            case "asin":

                result =
                    fromRad(Math.asin(n));

                break;


            /* ---------------- COS^-1 ---------------- */

            case "acos":

                result =
                    fromRad(Math.acos(n));

                break;


            /* ---------------- TAN^-1 ---------------- */

            case "atan":

                result =
                    fromRad(Math.atan(n));

                break;


            /* ---------------- LOG ---------------- */

            case "log":

                if (n <= 0)
                    throw new Error();

                /*
                   Support log(10^1000000)
                   without Infinity.
                */

                if (
                    x.m !== 0 &&
                    Math.abs(x.e) > 308
                ) {

                    result =
                        x.e +
                        Math.log10(
                            Math.abs(x.m)
                        );

                } else {

                    result =
                        Math.log10(n);
                }

                break;


            /* ---------------- LN ---------------- */

            case "ln":

                if (n <= 0)
                    throw new Error();

                if (
                    x.m !== 0 &&
                    Math.abs(x.e) > 308
                ) {

                    result =
                        Math.log(
                            Math.abs(x.m)
                        ) +
                        x.e *
                        Math.log(10);

                } else {

                    result =
                        Math.log(n);
                }

                break;


            /* ---------------- ROOT ---------------- */

            case "sqrt":

                if (x.m < 0)
                    throw new Error();

                /*
                   sqrt(m × 10^e)
                */

                let rootExponent =
                    Math.floor(x.e / 2);

                let remainingExponent =
                    x.e -
                    rootExponent * 2;

                let rootMantissa =
                    Math.sqrt(
                        x.m *
                        Math.pow(
                            10,
                            remainingExponent
                        )
                    );

                expression =
                    formatResult(
                        sci(
                            rootMantissa,
                            rootExponent
                        )
                    );

                updateDisplay();

                return;


            /* ---------------- CUBE ROOT ---------------- */

            case "cbrt":

                result =
                    Math.cbrt(n);

                break;


            /* ---------------- SQUARE ---------------- */

            case "square":

                expression =
                    formatResult(
                        sciPow(x, 2)
                    );

                updateDisplay();

                return;


            /* ---------------- CUBE ---------------- */

            case "cube":

                expression =
                    formatResult(
                        sciPow(x, 3)
                    );

                updateDisplay();

                return;


            /* ---------------- INVERSE ---------------- */

            case "inverse":

                if (x.m === 0)
                    throw new Error();

                expression =
                    formatResult(
                        sci(
                            1 / x.m,
                            -x.e
                        )
                    );

                updateDisplay();

                return;


            /* ---------------- ABS ---------------- */

            case "abs":

                x.m =
                    Math.abs(x.m);

                expression =
                    formatResult(x);

                updateDisplay();

                return;


            /* ---------------- PERCENT ---------------- */

            case "percent":

                expression =
                    formatResult(
                        sciDiv(
                            x,
                            numberToSci(100)
                        )
                    );

                updateDisplay();

                return;


            default:
                return;
        }


        if (!Number.isFinite(result)) {
            throw new Error();
        }

        expression =
            formatResult(
                numberToSci(result)
            );

        updateDisplay();

    } catch {

        error();
    }
}


/* =========================================================
   FACTORIAL
========================================================= */

function factorialBig(n) {

    if (
        !Number.isFinite(n) ||
        n < 0 ||
        !Number.isInteger(n)
    ) {
        throw new Error();
    }

    /*
       Exact factorial up to 170
    */

    if (n <= 170) {

        let result = 1;

        for (
            let i = 2;
            i <= n;
            i++
        ) {
            result *= i;
        }

        return numberToSci(result);
    }

    /*
       Stirling/log factorial
    */

    let log10 =
        0;

    for (
        let i = 2;
        i <= n;
        i++
    ) {
        log10 += Math.log10(i);
    }

    let exponent =
        Math.floor(log10);

    let mantissa =
        Math.pow(
            10,
            log10 - exponent
        );

    return sci(
        mantissa,
        exponent
    );
}


/* =========================================================
   POWER BUTTON
========================================================= */

function powerButton() {

    if (expression === "") {
        expression = "0^";
    } else {
        expression += "^";
    }

    updateDisplay();
}


/* =========================================================
   ×10^ BUTTON
========================================================= */

function tenPowerButton() {

    /*
       Example:

       10 ×10^ -1000

       User can enter:

       1
       ×10^
       -
       1000
    */

    if (expression === "") {

        expression = "1×10^";

    } else {

        expression += "×10^";
    }

    updateDisplay();
}


/* =========================================================
   SCIENTIFIC BUTTON EVENTS
========================================================= */

document
.querySelectorAll(".function-key")
.forEach(button => {

    button.addEventListener("click", () => {

        let action =
            button.dataset.value;


        /* =========================
           SHIFT MODE
        ========================= */

        if (shiftMode) {

            shiftMode = false;
            updateIndicators();


            if (action === "sin") {
                applyFunction("asin");
                return;
            }

            if (action === "cos") {
                applyFunction("acos");
                return;
            }

            if (action === "tan") {
                applyFunction("atan");
                return;
            }

            if (action === "sqrt") {
                applyFunction("cbrt");
                return;
            }

            if (action === "x2") {
                applyFunction("cube");
                return;
            }

            if (action === "log") {

                expression = "10^";
                updateDisplay();

                return;
            }

            if (action === "ln") {

                expression = "e^";
                updateDisplay();

                return;
            }
        }


        /* =========================
           NORMAL MODE
        ========================= */

        switch (action) {

            case "sin":
                applyFunction("sin");
                break;

            case "cos":
                applyFunction("cos");
                break;

            case "tan":
                applyFunction("tan");
                break;

            case "log":
                applyFunction("log");
                break;

            case "ln":
                applyFunction("ln");
                break;

            case "sqrt":
                applyFunction("sqrt");
                break;

            case "x2":
                applyFunction("square");
                break;

            case "power":
                powerButton();
                break;

            case "inverse":
                applyFunction("inverse");
                break;

            case "factorial":

                try {

                    let x =
                        currentValue();

                    let n =
                        sciToNumber(x);

                    expression =
                        formatResult(
                            factorialBig(n)
                        );

                    updateDisplay();

                } catch {

                    error();
                }

                break;

            case "abs":
                applyFunction("abs");
                break;

            case "percent":
                applyFunction("percent");
                break;

            case "pi":

                expression += "π";
                updateDisplay();

                break;

            case "e":

                expression += "e";
                updateDisplay();

                break;

            case "exp":

                tenPowerButton();

                break;

            case "negate":

                if (
                    expression.startsWith("-")
                ) {

                    expression =
                        expression.substring(1);

                } else {

                    expression =
                        "-" + expression;
                }

                updateDisplay();

                break;

            case "s-d":

                scientificDisplay();

                break;

            case "eng":

                engineeringDisplay();

                break;

            case "rnd":

                try {

                    let x =
                        currentValue();

                    let n =
                        sciToNumber(x);

                    expression =
                        cleanNumber(
                            Math.round(n)
                        );

                    updateDisplay();

                } catch {

                    error();
                }

                break;

            case "ans":

                expression +=
                    answer;

                updateDisplay();

                break;

            case "rcl":

                expression +=
                    memory;

                updateDisplay();

                break;

            case "m-plus":

                try {

                    let a =
                        currentValue();

                    let b =
                        stringToSci(memory);

                    memory =
                        formatResult(
                            sciAdd(a, b)
                        );

                    updateDisplay(memory);

                } catch {

                    error();
                }

                break;

            case "m-minus":

                try {

                    let a =
                        currentValue();

                    let b =
                        stringToSci(memory);

                    memory =
                        formatResult(
                            sciSub(b, a)
                        );

                    updateDisplay(memory);

                } catch {

                    error();
                }

                break;

            case "sto":

                try {

                    memory =
                        formatResult(
                            currentValue()
                        );

                    updateDisplay(memory);

                } catch {

                    error();
                }

                break;

            case "fraction":

                expression += "/";

                updateDisplay();

                break;

            case "hyp":

                /*
                   Hyperbolic mode:
                   sinh(x)
                */

                try {

                    let n =
                        sciToNumber(
                            currentValue()
                        );

                    let result =
                        Math.sinh(
                            toRad(n)
                        );

                    expression =
                        cleanNumber(result);

                    updateDisplay();

                } catch {

                    error();
                }

                break;

            case "setup":

                cycleAngleMode();

                break;

            case "comma":

                expression += ",";

                updateDisplay();

                break;
        }

    });

});


/* =========================================================
   EQUAL BUTTON
========================================================= */

document
.querySelector('[data-action="equals"]')
.addEventListener("click", calculate);


function calculate() {

    if (!expression) {
        return;
    }

    try {

        let result =
            evaluate(expression);

        let formatted =
            formatResult(result);

        history.push(expression);

        if (history.length > 50) {
            history.shift();
        }

        historyIndex =
            history.length;

        answer =
            formatted;

        expression =
            formatted;

        updateDisplay();

    } catch {

        error();
    }
}


/* =========================================================
   S ↔ D
========================================================= */

function scientificDisplay() {

    try {

        let x =
            currentValue();

        if (x.m === 0) {

            expression = "0";

        } else if (
            x.e >= -9 &&
            x.e <= 11
        ) {

            expression =
                cleanNumber(
                    sciToNumber(x)
                );

        } else {

            expression =
                sciToString(x);
        }

        updateDisplay();

    } catch {

        error();
    }
}


/* =========================================================
   ENGINEERING NOTATION
========================================================= */

function engineeringDisplay() {

    try {

        let x =
            currentValue();

        if (x.m === 0) {
            expression = "0";
            updateDisplay();
            return;
        }

        let exponent =
            Math.floor(x.e / 3) * 3;

        let mantissa =
            x.m *
            Math.pow(
                10,
                x.e - exponent
            );

        expression =
            cleanNumber(mantissa) +
            "×10^" +
            exponent;

        updateDisplay();

    } catch {

        error();
    }
}


/* =========================================================
   SHIFT
========================================================= */

document
.getElementById("shiftBtn")
.addEventListener("click", () => {

    shiftMode =
        !shiftMode;

    updateIndicators();
});


/* =========================================================
   ALPHA
========================================================= */

document
.getElementById("alphaBtn")
.addEventListener("click", () => {

    alphaMode =
        !alphaMode;

    updateIndicators();
});


/* =========================================================
   MODE
========================================================= */

document
.getElementById("modeBtn")
.addEventListener("click", () => {

    cycleAngleMode();
});


function cycleAngleMode() {

    angleMode =
        angleMode === "DEG"
            ? "RAD"
            : "DEG";

    updateIndicators();
}


/* =========================================================
   ON
========================================================= */

document
.getElementById("onBtn")
.addEventListener("click", () => {

    expression = "";

    shiftMode = false;
    alphaMode = false;

    updateIndicators();
    updateDisplay("0");
});


/* =========================================================
   INDICATORS
========================================================= */

function updateIndicators() {

    document
    .getElementById("shift-indicator")
    .style.visibility =
        shiftMode
            ? "visible"
            : "hidden";


    document
    .getElementById("alpha-indicator")
    .style.visibility =
        alphaMode
            ? "visible"
            : "hidden";


    document
    .getElementById("mode-indicator")
    .textContent =
        angleMode;
}


/* =========================================================
   REPLAY
========================================================= */

document
.querySelectorAll(".replay-btn")
.forEach(button => {

    button.addEventListener("click", () => {

        let action =
            button.dataset.action;


        if (
            history.length === 0
        ) {
            return;
        }


        if (action === "up") {

            if (
                historyIndex > 0
            ) {
                historyIndex--;
            }

            expression =
                history[historyIndex] || "";

            updateDisplay();
        }


        if (action === "down") {

            if (
                historyIndex <
                history.length - 1
            ) {

                historyIndex++;

                expression =
                    history[historyIndex];

                updateDisplay();

            } else {

                historyIndex =
                    history.length;

                expression = "";

                updateDisplay("0");
            }
        }


        if (action === "left") {

            expression =
                expression.slice(
                    0,
                    -1
                );

            updateDisplay();
        }


        if (action === "right") {

            updateDisplay();

        }

    });

});


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
"keydown",
event => {

    let key =
        event.key;


    /* Numbers */

    if (/^[0-9]$/.test(key)) {

        expression += key;

        updateDisplay();

        return;
    }


    /* Decimal */

    if (key === ".") {

        let parts =
            expression.split(
                /[+\-*/^()]/
            );

        let last =
            parts[parts.length - 1];

        if (!last.includes(".")) {
            expression += ".";
        }

        updateDisplay();

        return;
    }


    /* Operators */

    if (
        key === "+" ||
        key === "-" ||
        key === "*" ||
        key === "/"
    ) {

        expression += key;

        updateDisplay();

        return;
    }


    if (key === "^") {

        expression += "^";

        updateDisplay();

        return;
    }


    if (
        key === "(" ||
        key === ")"
    ) {

        expression += key;

        updateDisplay();

        return;
    }


    /* Enter */

    if (
        key === "Enter" ||
        key === "="
    ) {

        calculate();

        return;
    }


    /* Backspace */

    if (
        key === "Backspace"
    ) {

        expression =
            expression.slice(
                0,
                -1
            );

        updateDisplay();

        return;
    }


    /* Escape */

    if (
        key === "Escape"
    ) {

        expression = "";

        updateDisplay("0");

        return;
    }

});


/* =========================================================
   INITIAL START
========================================================= */

updateIndicators();
updateDisplay("0");
