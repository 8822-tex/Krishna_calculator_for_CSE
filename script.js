/* =========================================================
   KRISHNA'S SCIENTIFIC CALCULATOR
   Casio fx-991ES PLUS style calculator engine
========================================================= */

const display = document.getElementById("display");

let expression = "";
let answer = 0;
let memory = 0;

let angleMode = "DEG";

let shiftMode = false;
let alphaMode = false;

let history = [];
let historyIndex = -1;


/* =========================================================
   DISPLAY
========================================================= */

function updateDisplay(value = expression) {
    display.textContent = value === "" ? "0" : value;
}


/* =========================================================
   SHIFT / ALPHA
========================================================= */

const shiftIndicator = document.getElementById("shift-indicator");
const alphaIndicator = document.getElementById("alpha-indicator");
const modeIndicator = document.getElementById("mode-indicator");

function updateIndicators() {
    shiftIndicator.style.visibility =
        shiftMode ? "visible" : "hidden";

    alphaIndicator.style.visibility =
        alphaMode ? "visible" : "hidden";

    modeIndicator.textContent = angleMode;
}

function toggleShift() {
    shiftMode = !shiftMode;
    updateIndicators();
}

function toggleAlpha() {
    alphaMode = !alphaMode;
    updateIndicators();
}


/* =========================================================
   NUMBER INPUT
========================================================= */

document.querySelectorAll(".number-key").forEach(button => {

    button.addEventListener("click", () => {

        let value = button.dataset.value;

        if (shiftMode || alphaMode) {
            shiftMode = false;
            alphaMode = false;
            updateIndicators();
        }

        expression += value;

        updateDisplay();
    });

});


/* =========================================================
   DECIMAL
========================================================= */

function addDecimal() {

    if (expression === "") {
        expression = "0.";
        updateDisplay();
        return;
    }

    /*
       Prevent multiple decimals in the same number
    */
    let parts = expression.split(/[\+\-\*\/\^×÷\(\)]/);
    let last = parts[parts.length - 1];

    if (!last.includes(".")) {
        expression += ".";
    }

    updateDisplay();
}


/* =========================================================
   OPERATORS
========================================================= */

document.querySelectorAll(".operator-key").forEach(button => {

    button.addEventListener("click", () => {

        let op = button.dataset.value;

        if (expression === "") {

            if (op === "-") {
                expression = "-";
            }

            updateDisplay();
            return;
        }

        /*
           ×10^ handling is kept separately
        */

        let last = expression.slice(-1);

        if ("+-*/^".includes(last)) {
            expression = expression.slice(0, -1);
        }

        expression += op;

        updateDisplay();
    });

});


/* =========================================================
   DECIMAL BUTTON
========================================================= */

document.querySelectorAll('[data-value="."]').forEach(button => {

    button.addEventListener("click", addDecimal);

});


/* =========================================================
   PARENTHESES
========================================================= */

document.querySelectorAll('[data-value="("]').forEach(button => {

    button.addEventListener("click", () => {

        expression += "(";
        updateDisplay();

    });

});

document.querySelectorAll('[data-value=")"]').forEach(button => {

    button.addEventListener("click", () => {

        expression += ")";
        updateDisplay();

    });

});


/* =========================================================
   DELETE
========================================================= */

document.querySelector('[data-action="delete"]')
    .addEventListener("click", () => {

        expression = expression.slice(0, -1);

        updateDisplay();
    });


/* =========================================================
   AC
========================================================= */

document.querySelector('[data-action="clear"]')
    .addEventListener("click", () => {

        expression = "";
        updateDisplay("0");
    });


/* =========================================================
   ANGLE CONVERSION
========================================================= */

function toRadians(x) {

    if (angleMode === "DEG") {
        return x * Math.PI / 180;
    }

    return x;
}

function fromRadians(x) {

    if (angleMode === "DEG") {
        return x * 180 / Math.PI;
    }

    return x;
}


/* =========================================================
   SCIENTIFIC FUNCTIONS
========================================================= */

function scientificFunction(name) {

    let value;

    try {

        value = evaluateExpression(expression);

    } catch {

        display.textContent = "Math ERROR";
        return;
    }

    let result;

    switch (name) {

        case "sin":
            result = Math.sin(toRadians(value));
            break;

        case "cos":
            result = Math.cos(toRadians(value));
            break;

        case "tan":
            result = Math.tan(toRadians(value));
            break;

        case "asin":
            result = fromRadians(Math.asin(value));
            break;

        case "acos":
            result = fromRadians(Math.acos(value));
            break;

        case "atan":
            result = fromRadians(Math.atan(value));
            break;

        case "log":
            result = Math.log10(value);
            break;

        case "ln":
            result = Math.log(value);
            break;

        case "sqrt":
            result = Math.sqrt(value);
            break;

        case "cbrt":
            result = Math.cbrt(value);
            break;

        case "square":
            result = value * value;
            break;

        case "cube":
            result = value * value * value;
            break;

        case "inverse":

            if (value === 0) {
                display.textContent = "Math ERROR";
                return;
            }

            result = 1 / value;
            break;

        case "factorial":
            result = factorial(value);
            break;

        case "abs":
            result = Math.abs(value);
            break;

        case "percent":
            result = value / 100;
            break;

        case "exp":
            result = "10^";
            expression = expression + "×10^";
            updateDisplay();
            return;

        case "pi":
            expression += "π";
            updateDisplay();
            return;

        case "e":
            expression += "e";
            updateDisplay();
            return;

        case "negate":
            expression =
                expression.startsWith("-")
                    ? expression.substring(1)
                    : "-" + expression;

            updateDisplay();
            return;

        default:
            return;
    }

    if (!Number.isFinite(result)) {

        /*
           Don't immediately show error for huge values.
           Convert them into scientific notation.
        */

        if (name === "square" || name === "cube") {

            const big = scientificPower(value, name === "square" ? 2 : 3);

            expression = big;
            updateDisplay(big);
            return;
        }

        display.textContent = "Math ERROR";
        return;
    }

    expression = formatNumber(result);
    updateDisplay();
}


/* =========================================================
   FACTORIAL
========================================================= */

function factorial(n) {

    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        throw new Error("Factorial");
    }

    /*
       Normal factorial
    */

    if (n <= 170) {

        let result = 1;

        for (let i = 2; i <= n; i++) {
            result *= i;
        }

        return result;
    }

    /*
       For bigger values use logarithmic
       scientific representation
    */

    let log10 = 0;

    for (let i = 2; i <= n; i++) {
        log10 += Math.log10(i);
    }

    const exponent = Math.floor(log10);

    const mantissa = Math.pow(10, log10 - exponent);

    return mantissa * Math.pow(10, exponent);
}


/* =========================================================
   LARGE EXPONENT SYSTEM
========================================================= */

/*
   Converts:

   10^-1000000

   into a safe string instead of JavaScript
   converting it to 0.
*/

function normalizeScientific(mantissa, exponent) {

    if (mantissa === 0) {
        return "0";
    }

    while (Math.abs(mantissa) >= 10) {

        mantissa /= 10;
        exponent++;
    }

    while (Math.abs(mantissa) < 1) {

        mantissa *= 10;
        exponent--;
    }

    return `${formatNumber(mantissa)}×10^${exponent}`;
}


/*
   Scientific power

   Example:
   10^1000000
   10^-1000000
*/

function scientificPower(base, power) {

    if (base === 0 && power < 0) {
        throw new Error("Math ERROR");
    }

    if (base === 0) {
        return "0";
    }

    let sign = "";

    if (base < 0) {

        if (!Number.isInteger(power)) {
            throw new Error("Math ERROR");
        }

        if (Math.abs(power) % 2 === 1) {
            sign = "-";
        }
    }

    const absoluteBase = Math.abs(base);

    const logValue =
        Math.log10(absoluteBase) * power;

    /*
       Keep exponent as a normal JS integer.
       1,000,000 is completely safe.
    */

    const exponent =
        Math.floor(logValue);

    const mantissa =
        Math.pow(
            10,
            logValue - exponent
        );

    return normalizeScientific(
        Number(sign + mantissa),
        exponent
    );
}


/* =========================================================
   POWER
========================================================= */

function calculatePower() {

    try {

        const parts = expression.split("^");

        if (parts.length !== 2) {
            return;
        }

        const base = Number(parts[0]);
        const power = Number(parts[1]);

        /*
           Special large exponent support
        */

        if (
            Math.abs(power) > 308 ||
            Math.abs(base) > 1e154
        ) {

            const result =
                scientificPower(base, power);

            expression = result;
            updateDisplay(result);
            return;
        }

        const result =
            Math.pow(base, power);

        expression = formatNumber(result);

        updateDisplay();

    } catch {

        display.textContent = "Math ERROR";
    }
}


/* =========================================================
   EXPRESSION PARSER
========================================================= */

function evaluateExpression(input) {

    if (!input) {
        return 0;
    }

    let exp = input;

    /*
       Replace calculator symbols
    */

    exp = exp
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/π/g, "Math.PI")
        .replace(/\be\b/g, "Math.E");

    /*
       Handle ×10^
    */

    exp = exp.replace(
        /(\d+(?:\.\d+)?)×10\^(-?\d+)/g,
        "($1*Math.pow(10,$2))"
    );

    /*
       Handle x^y
    */

    exp = exp.replace(
        /(\d+(?:\.\d+)?)\^(-?\d+)/g,
        "Math.pow($1,$2)"
    );

    /*
       Basic validation
    */

    if (!/^[0-9+\-*/().,\sA-Za-z_]*$/.test(exp)) {
        throw new Error("Invalid");
    }

    /*
       Evaluate
    */

    return Function(
        `"use strict"; return (${exp})`
    )();
}


/* =========================================================
   EQUALS
========================================================= */

document.querySelector('[data-action="equals"]')
    .addEventListener("click", calculate);


function calculate() {

    if (expression === "") {
        return;
    }

    try {

        /*
           Large 10^ exponent detection
        */

        const largeMatch =
            expression.match(
                /^(-?\d+(?:\.\d+)?)\^(-?\d+)$/
            );

        if (largeMatch) {

            const base =
                Number(largeMatch[1]);

            const exponent =
                Number(largeMatch[2]);

            if (Math.abs(exponent) > 308) {

                const result =
                    scientificPower(
                        base,
                        exponent
                    );

                history.push(expression);

                answer = result;
                expression = result;

                historyIndex = history.length;

                updateDisplay(result);
                return;
            }
        }


        /*
           10^-1000000 entered using ×10^
        */

        const tenPower =
            expression.match(
                /^10\^(-?\d+)$/
            );

        if (tenPower) {

            const exponent =
                Number(tenPower[1]);

            if (Math.abs(exponent) > 308) {

                const result =
                    normalizeScientific(
                        1,
                        exponent
                    );

                history.push(expression);

                answer = result;
                expression = result;

                updateDisplay(result);

                return;
            }
        }


        const result =
            evaluateExpression(expression);

        if (!Number.isFinite(result)) {

            /*
               Try to convert power expressions
            */

            if (expression.includes("^")) {
                calculatePower();
                return;
            }

            throw new Error("Math ERROR");
        }

        history.push(expression);

        answer = result;

        expression =
            formatNumber(result);

        historyIndex = history.length;

        updateDisplay();

    } catch {

        display.textContent = "Math ERROR";
    }
}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(value) {

    if (typeof value === "string") {
        return value;
    }

    if (Object.is(value, -0)) {
        value = 0;
    }

    if (!Number.isFinite(value)) {
        return String(value);
    }

    /*
       Very small values
    */

    if (
        Math.abs(value) > 0 &&
        Math.abs(value) < 1e-10
    ) {

        return value
            .toExponential(10)
            .replace(/\.?0+e/, "e");
    }


    /*
       Very large values
    */

    if (Math.abs(value) >= 1e12) {

        return value
            .toExponential(10)
            .replace(/\.?0+e/, "e");
    }


    /*
       Normal number
    */

    return Number(
        value.toPrecision(12)
    ).toString();
}


/* =========================================================
   SCIENTIFIC FUNCTION BUTTONS
========================================================= */

document.querySelectorAll(".function-key")
    .forEach(button => {

        button.addEventListener("click", () => {

            const action =
                button.dataset.value;

            /*
               SHIFT functions
            */

            if (shiftMode) {

                shiftMode = false;
                updateIndicators();

                switch (action) {

                    case "sin":
                        scientificFunction("asin");
                        return;

                    case "cos":
                        scientificFunction("acos");
                        return;

                    case "tan":
                        scientificFunction("atan");
                        return;

                    case "sqrt":
                        scientificFunction("cbrt");
                        return;

                    case "x2":
                        scientificFunction("cube");
                        return;

                    case "log":
                        expression = "10^";
                        updateDisplay();
                        return;

                    case "ln":
                        expression = "e^";
                        updateDisplay();
                        return;
                }
            }


            /*
               Normal functions
            */

            switch (action) {

                case "sin":
                case "cos":
                case "tan":
                case "log":
                case "ln":
                case "sqrt":
                case "inverse":
                case "factorial":
                case "abs":
                case "percent":
                    scientificFunction(action);
                    break;


                case "x2":
                    scientificFunction("square");
                    break;


                case "power":
                    expression += "^";
                    updateDisplay();
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

                    if (expression === "") {
                        expression = "1";
                    }

                    expression += "×10^";
                    updateDisplay();
                    break;


                case "negate":
                    scientificFunction("negate");
                    break;


                case "hyp":

                    /*
                       Hyperbolic mode
                    */

                    if (expression !== "") {

                        const value =
                            evaluateExpression(
                                expression
                            );

                        expression =
                            formatNumber(
                                Math.sinh(
                                    toRadians(value)
                                )
                            );

                        updateDisplay();
                    }

                    break;


                case "s-d":

                    /*
                       Decimal / scientific display
                    */

                    toggleScientificDisplay();

                    break;


                case "eng":

                    engineeringNotation();

                    break;


                case "rnd":

                    if (expression !== "") {

                        const value =
                            evaluateExpression(
                                expression
                            );

                        expression =
                            formatNumber(
                                Math.round(value)
                            );

                        updateDisplay();
                    }

                    break;


                case "ans":

                    expression +=
                        typeof answer === "string"
                            ? answer
                            : formatNumber(answer);

                    updateDisplay();

                    break;


                case "rcl":

                    expression +=
                        formatNumber(memory);

                    updateDisplay();

                    break;


                case "m-plus":

                    memory +=
                        evaluateExpression(
                            expression || "0"
                        );

                    updateDisplay(
                        formatNumber(memory)
                    );

                    break;


                case "m-minus":

                    memory -=
                        evaluateExpression(
                            expression || "0"
                        );

                    updateDisplay(
                        formatNumber(memory)
                    );

                    break;


                case "sto":

                    memory =
                        evaluateExpression(
                            expression || "0"
                        );

                    updateDisplay(
                        formatNumber(memory)
                    );

                    break;


                case "fraction":

                    /*
                       Basic fraction display
                    */

                    expression += "÷";
                    updateDisplay();

                    break;


                case "mixed":

                    break;


                case "comma":

                    expression += ",";
                    updateDisplay();

                    break;


                case "setup":

                    cycleAngleMode();

                    break;
            }

        });

    });


/* =========================================================
   SHIFT BUTTON
========================================================= */

document.getElementById("shiftBtn")
    .addEventListener("click", () => {

        toggleShift();
    });


/* =========================================================
   ALPHA BUTTON
========================================================= */

document.getElementById("alphaBtn")
    .addEventListener("click", () => {

        toggleAlpha();
    });


/* =========================================================
   MODE BUTTON
========================================================= */

document.getElementById("modeBtn")
    .addEventListener("click", () => {

        cycleAngleMode();
    });


/* =========================================================
   ON BUTTON
========================================================= */

document.getElementById("onBtn")
    .addEventListener("click", () => {

        expression = "";
        updateDisplay("0");

        shiftMode = false;
        alphaMode = false;

        updateIndicators();
    });


/* =========================================================
   DEG / RAD
========================================================= */

function cycleAngleMode() {

    if (angleMode === "DEG") {
        angleMode = "RAD";
    } else {
        angleMode = "DEG";
    }

    updateIndicators();
}


/* =========================================================
   S ↔ D
========================================================= */

function toggleScientificDisplay() {

    if (expression === "") {
        return;
    }

    try {

        const value =
            evaluateExpression(expression);

        if (Math.abs(value) >= 1e12 ||
            (Math.abs(value) > 0 &&
             Math.abs(value) < 1e-10)) {

            expression =
                formatNumber(value);

        } else {

            expression =
                String(value);
        }

        updateDisplay();

    } catch {

        display.textContent = "Math ERROR";
    }
}


/* =========================================================
   ENGINEERING NOTATION
========================================================= */

function engineeringNotation() {

    if (expression === "") {
        return;
    }

    try {

        const value =
            evaluateExpression(expression);

        if (value === 0) {
            expression = "0";
            updateDisplay();
            return;
        }

        const exponent =
            Math.floor(
                Math.log10(Math.abs(value)) / 3
            ) * 3;

        const mantissa =
            value / Math.pow(10, exponent);

        expression =
            `${formatNumber(mantissa)}×10^${exponent}`;

        updateDisplay();

    } catch {

        display.textContent = "Math ERROR";
    }
}


/* =========================================================
   REPLAY BUTTONS
========================================================= */

document.querySelectorAll(".replay-btn")
    .forEach(button => {

        button.addEventListener("click", () => {

            const action =
                button.dataset.action;

            if (history.length === 0) {
                return;
            }


            if (action === "up") {

                if (historyIndex > 0) {
                    historyIndex--;
                }

                expression =
                    history[historyIndex] || "";

                updateDisplay();
            }


            if (action === "down") {

                if (historyIndex < history.length - 1) {

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

                /*
                   Move cursor-like behaviour
                   by deleting last character.
                */

                expression =
                    expression.slice(0, -1);

                updateDisplay();
            }


            if (action === "right") {

                /*
                   Right button intentionally
                   keeps current expression.
                */

                updateDisplay();
            }

        });

    });


/* =========================================================
   KEYBOARD SUPPORT
========================================================= */

document.addEventListener("keydown", event => {

    const key = event.key;


    if (/^[0-9]$/.test(key)) {

        expression += key;
        updateDisplay();
        return;
    }


    if (key === ".") {

        addDecimal();
        return;
    }


    if ("+-*/".includes(key)) {

        expression += key;
        updateDisplay();
        return;
    }


    if (key === "^") {

        expression += "^";
        updateDisplay();
        return;
    }


    if (key === "(" || key === ")") {

        expression += key;
        updateDisplay();
        return;
    }


    if (key === "Enter" || key === "=") {

        calculate();
        return;
    }


    if (key === "Backspace") {

        expression =
            expression.slice(0, -1);

        updateDisplay();

        return;
    }


    if (key === "Escape") {

        expression = "";

        updateDisplay("0");

        return;
    }

});


/* =========================================================
   INITIALIZE
========================================================= */

updateIndicators();
updateDisplay("0");
