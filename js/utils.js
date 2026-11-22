window.Cohere = window.Cohere || {};
Cohere.Utils = (function () {
    "use strict";

    // Generates a unique ID with a given prefix
    function generateId(prefix) {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        let id = "";
        for (let i = 0; i < 10; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return prefix + "_" + id;
    }

    // Returns today's local date as "YYYY-MM-DD"
    function todayISO() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    // Adds n days to an ISO date string
    function addDays(iso, n) {
        const parts = iso.split("-");
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        d.setDate(d.getDate() + n);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    // Checks if a string is a valid YYYY-MM-DD date
    function isValidISODate(str) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
        const parts = str.split("-");
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.getFullYear() === parseInt(parts[0]) &&
            d.getMonth() === parseInt(parts[1]) - 1 &&
            d.getDate() === parseInt(parts[2]);
    }

    // Formats YYYY-MM-DD to "Mon DD, YYYY"
    function formatDate(iso) {
        if (!iso) return "";
        const parts = iso.split("-");
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    // Formats HH:MM to 12-hour time
    function formatTime(hhmm) {
        if (!hhmm) return "";
        const parts = hhmm.split(":");
        let h = parseInt(parts[0]);
        const m = parts[1];
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
    }

    // Formats ISO timestamp to readable date and time
    function formatDateTime(isoTimestamp) {
        if (!isoTimestamp) return "";
        const d = new Date(isoTimestamp);
        return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
    }

    // Escapes HTML special characters
    function escapeHtml(str) {
        if (typeof str !== "string") return "";
        return str.replace(/[&<>"']/g, function (match) {
            const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
            return map[match];
        });
    }

    // Formats a number as a percentage or "N/A"
    function formatPercent(value) {
        if (value === null || value === undefined || isNaN(value)) return "N/A";
        return value.toFixed(1) + "%";
    }

    // Creates a DOM element
    function createEl(tag, props, children) {
        const el = document.createElement(tag);
        if (props) {
            Object.keys(props).forEach(function (key) {
                if (key === "className") el.className = props[key];
                else if (key === "textContent") el.textContent = props[key];
                else if (key === "dataset") {
                    Object.keys(props[key]).forEach(function (dk) { el.dataset[dk] = props[key][dk]; });
                } else {
                    el.setAttribute(key, props[key]);
                }
            });
        }
        if (children) {
            children.forEach(function (child) {
                if (child) el.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
            });
        }
        return el;
    }

    // Clears all children of an element
    function clearEl(el) {
        if (el) while (el.firstChild) el.removeChild(el.firstChild);
    }

    // Populates a select element with options
    function populateSelect(selectEl, items, placeholder) {
        if (!selectEl) return;
        const currentVal = selectEl.value;
        clearEl(selectEl);
        if (placeholder) {
            const opt = createEl("option", { value: "", textContent: placeholder });
            selectEl.appendChild(opt);
        }
        items.forEach(function (item) {
            const opt = createEl("option", { value: item.value, textContent: item.label });
            selectEl.appendChild(opt);
        });
        if (currentVal && selectEl.querySelector(`option[value="${currentVal}"]`)) {
            selectEl.value = currentVal;
        }
    }

    return { generateId, todayISO, addDays, isValidISODate, formatDate, formatTime, formatDateTime, escapeHtml, formatPercent, createEl, clearEl, populateSelect };
})();