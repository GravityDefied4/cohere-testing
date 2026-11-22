window.Cohere = window.Cohere || {};
Cohere.Storage = (function () {
    "use strict";

    // Loads a single key from localStorage with error handling
    function load(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return fallback;
            return JSON.parse(raw);
        } catch (e) {
            console.error("Storage.load failed for key:", key, e);
            if (Cohere.UI) Cohere.UI.showToast("Could not load data. Using defaults.", "error");
            return fallback;
        }
    }

    // Saves a single key to localStorage
    function save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error("Storage.save failed for key:", key, e);
            if (Cohere.UI) Cohere.UI.showToast("Could not save data. Export a backup.", "error");
            return false;
        }
    }

    // Loads all collections into Cohere.state
    function loadAll() {
        const KEYS = Cohere.Config.KEYS;
        window.Cohere.state = {
            organizations: load(KEYS.orgs, []),
            members: load(KEYS.members, []),
            tasks: load(KEYS.tasks, []),
            appointments: load(KEYS.appointments, []),
            attendance: load(KEYS.attendance, []),
            activity: load(KEYS.activity, []),
            notifications: load(KEYS.notifications, []),
            settings: load(KEYS.settings, { seeded: false, schemaVersion: 1, viewingAs: "admin" })
        };
    }

    // Saves all collections from Cohere.state
    function saveAll() {
        const KEYS = Cohere.Config.KEYS;
        const state = window.Cohere.state;
        if (!state) return false;

        let success = true;
        success = save(KEYS.orgs, state.organizations) && success;
        success = save(KEYS.members, state.members) && success;
        success = save(KEYS.tasks, state.tasks) && success;
        success = save(KEYS.appointments, state.appointments) && success;
        success = save(KEYS.attendance, state.attendance) && success;
        success = save(KEYS.activity, state.activity) && success;
        success = save(KEYS.notifications, state.notifications) && success;
        success = save(KEYS.settings, state.settings) && success;

        return success;
    }

    // Clears all Cohere data from localStorage
    function clearAll() {
        const KEYS = Cohere.Config.KEYS;
        try {
            Object.values(KEYS).forEach(function (key) {
                localStorage.removeItem(key);
            });
            return true;
        } catch (e) {
            console.error("Storage.clearAll failed", e);
            return false;
        }
    }

    // Returns approximate storage usage in bytes
    function getUsageBytes() {
        const KEYS = Cohere.Config.KEYS;
        let total = 0;
        try {
            Object.values(KEYS).forEach(function (key) {
                const item = localStorage.getItem(key);
                if (item) total += item.length * 2; // UTF-16
            });
        } catch (e) {
            console.error("Storage.getUsageBytes failed", e);
        }
        return total;
    }

    return { load, save, loadAll, saveAll, clearAll, getUsageBytes };
})();