window.Cohere = window.Cohere || {};
Cohere.UI = (function () {
    "use strict";

    // Shows a toast message
    function showToast(message, type) {
        const container = document.getElementById("toast-container");
        if (!container) return;
        const toast = Cohere.Utils.createEl("div", { className: "toast toast-" + (type || "info"), textContent: message });
        container.appendChild(toast);
        setTimeout(function () {
            toast.classList.add("toast-hide");
            setTimeout(function () { toast.remove(); }, 300);
        }, 3000);
    }

    // Opens a modal
    function openModal(title, contentNode) {
        const overlay = document.getElementById("modal-overlay");
        const titleEl = document.getElementById("modal-title");
        const bodyEl = document.getElementById("modal-body");
        if (!overlay || !titleEl || !bodyEl) return;
        titleEl.textContent = title;
        Cohere.Utils.clearEl(bodyEl);
        if (contentNode) bodyEl.appendChild(contentNode);
        overlay.hidden = false;
    }

    // Closes the modal and notification panel
    function closeModal() {
        const overlay = document.getElementById("modal-overlay");
        if (overlay) overlay.hidden = true;
        const notifPanel = document.getElementById("notif-panel");
        if (notifPanel) notifPanel.hidden = true;
    }

    // Wraps window.confirm
    function confirmAction(message) {
        return window.confirm(message);
    }

    // Shows field errors on a form
    function showFieldErrors(form, errors) {
        if (!form || !errors) return;
        Object.keys(errors).forEach(function (field) {
            const input = form.querySelector(`#${field}`);
            if (input) {
                input.classList.add("is-invalid");
                input.setAttribute("aria-invalid", "true");
                const errEl = Cohere.Utils.createEl("small", { className: "field-error", textContent: errors[field] });
                input.parentNode.insertBefore(errEl, input.nextSibling);
            }
        });
        showToast("Please fix the highlighted fields.", "error");
    }

    // Clears all field errors in a form
    function clearFieldErrors(form) {
        if (!form) return;
        form.querySelectorAll(".field-error").forEach(function (el) { el.remove(); });
        form.querySelectorAll(".is-invalid").forEach(function (el) {
            el.classList.remove("is-invalid");
            el.removeAttribute("aria-invalid");
        });
    }

    // Clears a specific field error
    function clearFieldError(field) {
        if (!field) return;
        field.classList.remove("is-invalid");
        field.removeAttribute("aria-invalid");
        const next = field.nextElementSibling;
        if (next && next.classList.contains("field-error")) next.remove();
    }

    // Toggles the sidebar on mobile
    function toggleSidebar() {
        const sidebar = document.getElementById("sidebar");
        if (sidebar) sidebar.classList.toggle("sidebar-open");
    }

    // Creates a status badge element
    function statusBadge(text, kind) {
        return Cohere.Utils.createEl("span", { className: "badge badge-" + (kind || "default"), textContent: text });
    }

    // Applies permissions to the UI (M0 stub: does nothing since can() is always true)
    function applyPermissions() {
        // In M9, this will hide elements with data-permission if !Permissions.can(action)
        // and show view-only notes.
    }

    // Attach global listeners for modal/overlay close and field error clearing
    function attachGlobalListeners() {
        document.addEventListener("click", function (e) {
            if (e.target.id === "modal-overlay" || e.target.id === "modal-close") {
                closeModal();
            }
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeModal();
        });
        document.addEventListener("input", function (e) {
            if (e.target.matches("input, textarea, select")) {
                clearFieldError(e.target);
            }
        });
    }

    attachGlobalListeners();

    return { showToast, openModal, closeModal, confirmAction, showFieldErrors, clearFieldErrors, clearFieldError, toggleSidebar, statusBadge, applyPermissions };
})();