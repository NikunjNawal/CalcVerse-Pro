// CalcVerse Pro - BASIC Calculator (Final Stable Version + Dark Mode FIXED)

document.addEventListener("DOMContentLoaded", () => {

    console.log("CalcVerse Pro Basic JS Loaded ✅");

    /* ==============================
       DOM ELEMENTS
    ============================== */
    const expressionEl = document.getElementById("expression");
    const resultEl = document.getElementById("result");
    const historyEl = document.getElementById("history");
    const stepsEl = document.getElementById("steps");
    const toggleBtn = document.getElementById("toggleSteps");
    const themeToggle = document.getElementById("themeToggle");
    const buttons = document.querySelectorAll(".btn");

    // ❗ SAFETY CHECK
    if (!themeToggle) {
        console.error("❌ Dark mode button not found (id='themeToggle')");
        return;
    }

    let expression = "0";
    let history = [];
    let stepsVisible = false;

    /* ==============================
       BUTTON HANDLING
    ============================== */
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            handleInput(btn.innerText.trim());
        });
    });

    function handleInput(value) {
        if (value === "C") return clearAll();
        if (value === "CE") return clearEntry();
        if (value === "±") return toggleSign();
        if (value === "%") return percentage();
        if (value === "=") return calculate();

        append(value);
    }

    /* ==============================
       CORE CALCULATOR LOGIC
    ============================== */
    function append(value) {
        const last = expression.slice(-1);

        // Prevent leading zero like 09, 04
        if (expression === "0" && !isOperator(value) && value !== ".") {
            expression = value;
        }
        // Prevent multiple operators
        else if (isOperator(last) && isOperator(value)) {
            return;
        }
        else {
            expression += value;
        }

        updateDisplay();
    }

    function calculate() {
        if (!expression || expression === "0") return;

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

            // Auto-show steps
            stepsVisible = true;
            stepsEl.classList.remove("hidden");
            toggleBtn.textContent = "Hide Steps";

        } catch (err) {
            console.error("Calculation error:", err);
            resultEl.textContent = "Error";
        }
    }

    function clearAll() {
        expression = "0";
        resultEl.textContent = "0";
        updateDisplay();

        stepsEl.innerHTML = `
            <p class="steps-placeholder">
                Perform a calculation to see step-by-step explanation.
            </p>
        `;
    }

    function clearEntry() {
        expression = expression.slice(0, -1) || "0";
        updateDisplay();
    }

    function updateDisplay() {
        expressionEl.textContent = expression;
    }

    function isOperator(ch) {
        return ["+", "−", "×", "÷"].includes(ch);
    }

    /* ==============================
       EXTRA FUNCTIONS
    ============================== */
    function percentage() {
        expression = expression.replace(
            /(-?\d+\.?\d*)$/,
            m => parseFloat(m) / 100
        );
        updateDisplay();
    }

    function toggleSign() {
        expression = expression.replace(
            /(-?\d+\.?\d*)$/,
            m => (-parseFloat(m)).toString()
        );
        updateDisplay();
    }

    /* ==============================
       HISTORY
    ============================== */
    function addToHistory(exp, res) {
        history.unshift(`${exp} = ${res}`);
        if (history.length > 5) history.pop();
        historyEl.innerHTML = history.map(h => `<li>${h}</li>`).join("");
    }

    /* ==============================
       STEP-BY-STEP EXPLANATION (BODMAS)
    ============================== */
    function generateSteps(exp, finalResult) {
        let html = `<p><strong>Expression:</strong> ${exp}</p>`;
        html += `<p><strong>Rule Used:</strong> BODMAS</p>`;

        let temp = exp.replace(/−/g, "-");
        let step = 1;

        const evalOp = (a, op, b) => {
            a = parseFloat(a);
            b = parseFloat(b);
            if (op === "×") return a * b;
            if (op === "÷") return a / b;
            if (op === "+") return a + b;
            if (op === "-") return a - b;
        };

        let md = /(-?\d+\.?\d*)\s*([×÷])\s*(-?\d+\.?\d*)/;
        while (md.test(temp)) {
            const [full, a, op, b] = temp.match(md);
            const value = evalOp(a, op, b);
            html += `<p>Step ${step++}: ${a} ${op} ${b} = ${value}</p>`;
            temp = temp.replace(full, value);
        }

        let as = /(-?\d+\.?\d*)\s*([+-])\s*(-?\d+\.?\d*)/;
        while (as.test(temp)) {
            const [full, a, op, b] = temp.match(as);
            const value = evalOp(a, op, b);
            html += `<p>Step ${step++}: ${a} ${op} ${b} = ${value}</p>`;
            temp = temp.replace(full, value);
        }

        html += `<p class="final-answer">Final Answer: ${finalResult}</p>`;
        stepsEl.innerHTML = html;
    }

    /* ==============================
       STEP TOGGLE BUTTON
    ============================== */
    toggleBtn.addEventListener("click", () => {
        stepsVisible = !stepsVisible;
        stepsEl.classList.toggle("hidden", !stepsVisible);
        toggleBtn.textContent = stepsVisible ? "Hide Steps" : "Show Steps";
    });

    /* ==============================
       KEYBOARD SUPPORT
    ============================== */
    document.addEventListener("keydown", e => {
        const k = e.key;

        if (!isNaN(k)) append(k);
        else if (k === "+") append("+");
        else if (k === "-") append("−");
        else if (k === "*") append("×");
        else if (k === "/") append("÷");
        else if (k === ".") append(".");
        else if (k === "Enter") calculate();
        else if (k === "Backspace") clearEntry();
        else if (k === "Escape") clearAll();
    });

    /* ==============================
       DARK MODE (FIXED & VERIFIED)
    ============================== */
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeToggle.textContent = "☀️ Light";
    }

    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");

        const isDark = document.body.classList.contains("dark");
        themeToggle.textContent = isDark ? "☀️ Light" : "🌙 Dark";
        localStorage.setItem("theme", isDark ? "dark" : "light");

        console.log("Dark mode toggled:", isDark);
    });

});
