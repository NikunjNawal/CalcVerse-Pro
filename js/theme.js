document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("themeToggle");

    // If page does not have toggle button, stop
    if (!themeToggle) return;

    // Load saved theme
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
