window.Cohere = window.Cohere || {};
Cohere.App = (function () {
    "use strict";

    // Initializes the app
    function init() {
        // 1) Load state (stubbed for M0 since storage.js is not built yet)
        if (Cohere.Storage) {
            Cohere.Storage.loadAll();
        } else {
            window.Cohere.state = {
                organizations: [],
                members: [],
                tasks: [],
                appointments: [],
                attendance: [],
                activity: [],
                notifications: [],
                settings: { seeded: false, schemaVersion: 1, viewingAs: "admin" }
            };
        }

        // 2) Seed data if needed (stubbed for M0)
        if (!window.Cohere.state.settings.seeded && Cohere.Seed) {
            const seedData = Cohere.Seed.generate();
            Object.assign(window.Cohere.state, seedData);
            window.Cohere.state.settings.seeded = true;
            if (Cohere.Storage) Cohere.Storage.saveAll();
        }

        // 3) Init permissions
        if (Cohere.Permissions) Cohere.Permissions.init();

        // 4) Init views (stubbed for M0)
        const views = ["Dashboard", "Members", "Tasks", "Appointments", "Attendance", "Performance", "ActivityView", "Settings"];
        views.forEach(function (v) {
            if (Cohere[v] && typeof Cohere[v].init === "function") Cohere[v].init();
        });

        // 5) Generate reminders (stubbed for M0)
        if (Cohere.Services && Cohere.Services.generateDeadlineReminders) {
            Cohere.Services.generateDeadlineReminders();
        }

        // 6) Render all
        renderAll();

        // 7) Show dashboard
        showView("dashboard");

        // Update header date
        const dateEl = document.getElementById("header-date");
        if (dateEl) dateEl.textContent = Cohere.Utils.formatDate(Cohere.Utils.todayISO());

        // Sidebar toggle
        const menuBtn = document.getElementById("btn-menu-toggle");
        if (menuBtn) {
            menuBtn.addEventListener("click", function () {
                if (Cohere.UI) Cohere.UI.toggleSidebar();
            });
        }

        // Sidebar navigation
        const sidebar = document.getElementById("sidebar");
        if (sidebar) {
            sidebar.addEventListener("click", function (e) {
                const btn = e.target.closest(".nav-btn");
                if (btn && btn.dataset.view) {
                    showView(btn.dataset.view);
                    if (window.innerWidth < 900) {
                        sidebar.classList.remove("sidebar-open");
                    }
                }
            });
        }

        // Temporary toast test for M0 done check
        const testToastBtn = document.getElementById("btn-test-toast");
        if (testToastBtn) {
            testToastBtn.addEventListener("click", function () {
                Cohere.UI.showToast("This is a test toast message!", "success");
            });
        }

        // Storage change listener
        window.addEventListener("storage", handleStorageChange);
    }

    // Shows a specific view
    function showView(name) {
        document.querySelectorAll(".view").forEach(function (v) { v.hidden = true; });
        const target = document.getElementById("view-" + name);
        if (target) target.hidden = false;

        document.querySelectorAll(".nav-btn").forEach(function (b) { b.classList.remove("active"); });
        const activeBtn = document.querySelector(`.nav-btn[data-view="${name}"]`);
        if (activeBtn) activeBtn.classList.add("active");
    }

    // Renders all views and UI components
    function renderAll() {
        if (Cohere.Permissions) Cohere.Permissions.renderSelector();

        const views = ["Dashboard", "Members", "Tasks", "Appointments", "Attendance", "Performance", "ActivityView", "Settings"];
        views.forEach(function (v) {
            if (Cohere[v] && typeof Cohere[v].render === "function") Cohere[v].render();
        });

        if (Cohere.Notify && Cohere.Notify.renderPanel) Cohere.Notify.renderPanel();

        if (Cohere.UI) Cohere.UI.applyPermissions();
    }

    // Handles storage changes from other tabs
    function handleStorageChange(e) {
        if (e.key && e.key.startsWith("cohere.v1.")) {
            if (Cohere.Storage) Cohere.Storage.loadAll();
            if (Cohere.Permissions) {
                const current = Cohere.Permissions.getViewingAs();
                if (current !== "admin" && window.Cohere.state.members) {
                    const exists = window.Cohere.state.members.some(function (m) { return m.id === current; });
                    if (!exists) Cohere.Permissions.setViewingAs("admin");
                }
            }
            renderAll();
        }
    }

    return { init, showView, renderAll, handleStorageChange };
})();

document.addEventListener("DOMContentLoaded", function () {
    Cohere.App.init();
});