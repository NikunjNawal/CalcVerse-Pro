// CalcVerse Pro - Basic Calculator (Final Working Version)

document.addEventListener("DOMContentLoaded", () => {

    console.log("CalcVerse Pro JS Loaded ✅");
     
    const stepsEl = document.getElementById("steps");
    const expressionEl = document.getElementById("expression");
    const resultEl = document.getElementById("result");
    const historyEl = document.getElementById("history");
    const buttons = document.querySelectorAll(".btn");
    const toggleBtn = document.getElementById("toggleSteps");
    const themeToggle = document.getElementById("themeToggle");



    let expression = "";
    let history = [];

    if (!buttons.length) {
        console.error("Buttons not found ❌");
        return;
    }

    // ==============================
    // Button Click Handling
    // ==============================
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const value = btn.innerText.trim();
            handleInput(value);
        });
    });

    function handleInput(value) {
        if (value === "C") return clearAll();
        if (value === "CE") return clearEntry();
        if (value === "⌫") return backspace();
        if (value === "=") return calculate();
        if (value === "%") return percentage();
        if (value === "±") return toggleSign();

        append(value);
    }

    // ==============================
    // Core Functions
    // ==============================
    function append(value) {
        const lastChar = expression.slice(-1);
        if (isOperator(lastChar) && isOperator(value)) return;

        expression += value;
        updateDisplay();
    }

    function clearAll() {
        expression = "";
        resultEl.textContent = "0";
        updateDisplay();
    }

    function clearEntry() {
        if (!expression) return;
        expression = expression.replace(/(-?\d+\.?\d*)$/, "");

        updateDisplay();
    }

    function backspace() {
        expression = expression.slice(0, -1);
        updateDisplay();
    }

    function calculate() {
        if (!expression) return;

        try {
            const safeExp = expression
                .replace(/×/g, "*")
                .replace(/÷/g, "/")
                .replace(/−/g, "-");

            const result = Function(`"use strict"; return (${safeExp})`)();

            if (!isFinite(result)) throw new Error();

            addToHistory(expression, result);
            generateSteps(expression, result);
            expression = result.toString();
            resultEl.textContent = result;
            updateDisplay();

        } catch {
            resultEl.textContent = "Error";
        }
    }

    function updateDisplay() {
        expressionEl.textContent = expression || "0";
    }

    function isOperator(char) {
        return ["+", "−", "×", "÷"].includes(char);
    }

    // ==============================
    // Percentage (%) Logic
    // ==============================
    function percentage() {
        if (!expression) return;

        const match = expression.match(/(-?\d+\.?\d*)$/);
        if (!match) return;

        const number = match[0];
        const percentValue = parseFloat(number) / 100;

        expression = expression.replace(/(-?\d+\.?\d*)$/, percentValue);
        updateDisplay();
    }

    // ==============================
    // Plus / Minus (±) Logic
    // ==============================
    function toggleSign() {
        if (!expression) return;

        const match = expression.match(/(-?\d+\.?\d*)$/);
        if (!match) return;

        const number = match[0];
        const toggled = (-parseFloat(number)).toString();

        expression = expression.replace(/(-?\d+\.?\d*)$/, toggled);
        updateDisplay();
    }

    // ==============================
    // History
    // ==============================
    function addToHistory(exp, res) {
        history.unshift(`${exp} = ${res}`);
        if (history.length > 5) history.pop();
        renderHistory();
    }

    function renderHistory() {
        historyEl.innerHTML = "";
        history.forEach(item => {
            const li = document.createElement("li");
            li.textContent = item;
            historyEl.appendChild(li);
        });
    }

    // ==============================
    // Keyboard Support
    // ==============================
    document.addEventListener("keydown", (e) => {
        const key = e.key;

        if (!isNaN(key)) append(key);
        else if (key === "+") append("+");
        else if (key === "-") append("−");
        else if (key === "*") append("×");
        else if (key === "/") append("÷");
        else if (key === ".") append(".");
        else if (key === "Enter" || key === "=") {
            e.preventDefault();
            calculate();
        }
        else if (key === "Backspace") backspace();
        else if (key === "Escape") clearAll();
    });
    
    function generateSteps(exp, finalResult) {
    if (!stepsEl) return;

    let explanation = `<p><strong>Expression:</strong> ${exp}</p>`;
    explanation += `<p><strong>Rule Used:</strong> BODMAS</p>`;

    let tempExp = exp;
    let stepCount = 1;

    // Helper to safely evaluate a simple expression
    const evalSimple = (a, op, b) => {
        a = parseFloat(a);
        b = parseFloat(b);
        if (op === "×") return a * b;
        if (op === "÷") return a / b;
        if (op === "+") return a + b;
        if (op === "−") return a - b;
    };

    // 1️⃣ Handle multiplication & division first
    let mdRegex = /(-?\d+\.?\d*)\s*([×÷])\s*(-?\d+\.?\d*)/;

    while (mdRegex.test(tempExp)) {
        const match = tempExp.match(mdRegex);
        const [full, a, op, b] = match;
        const value = evalSimple(a, op, b);

        explanation += `<p>Step ${stepCount++}: ${a} ${op} ${b} = ${value}</p>`;
        tempExp = tempExp.replace(full, value);
    }

    // 2️⃣ Handle addition & subtraction
    let asRegex = /(-?\d+\.?\d*)\s*([+\−])\s*(-?\d+\.?\d*)/;

    while (asRegex.test(tempExp)) {
        const match = tempExp.match(asRegex);
        const [full, a, op, b] = match;
        const value = evalSimple(a, op, b);

        explanation += `<p>Step ${stepCount++}: ${a} ${op} ${b} = ${value}</p>`;
        tempExp = tempExp.replace(full, value);
    }

    explanation += `<p class="final-answer">Final Answer: ${finalResult}</p>`;
    stepsEl.innerHTML = "";
     setTimeout(() => {
        stepsEl.innerHTML = explanation;
    }, 50);

}
let stepsVisible = false;

toggleBtn.addEventListener("click", () => {
    stepsVisible = !stepsVisible;

    if (stepsVisible) {
        stepsEl.classList.remove("hidden");
        toggleBtn.textContent = "Hide Steps";
    } else {
        stepsEl.classList.add("hidden");
        toggleBtn.textContent = "Show Steps";
    }
});

// ==============================
// Dark Mode Toggle
// ==============================

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️ Light";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        themeToggle.textContent = "☀️ Light";
        localStorage.setItem("theme", "dark");
    } else {
        themeToggle.textContent = "🌙 Dark";
        localStorage.setItem("theme", "light");
    }
});

});

