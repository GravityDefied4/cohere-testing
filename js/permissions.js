window.Cohere = window.Cohere || {};
Cohere.Permissions = (function () {
    "use strict";

    let viewingAs = "admin";

    // Initializes the viewing as selector and validates saved profile
    function init() {
        const select = document.getElementById("viewing-as");
        if (select) {
            select.addEventListener("change", function () {
                setViewingAs(select.value);
            });
        }
    }

    // Rebuilds the dropdown options
    function renderSelector() {
        const select = document.getElementById("viewing-as");
        if (!select) return;
        const items = [{ value: "admin", label: "Administrator (demo)" }];
        if (Cohere.state && Cohere.state.members) {
            Cohere.state.members.forEach(function (m) {
                const org = Cohere.state.organizations.find(function (o) { return o.id === m.orgId; });
                const orgName = org ? org.name : "Unknown Org";
                items.push({ value: m.id, label: `${m.fullName} — ${m.position} (${orgName})` });
            });
        }
        Cohere.Utils.populateSelect(select, items, null);
        select.value = viewingAs;
    }

    // Returns the current viewing as ID
    function getViewingAs() {
        return viewingAs;
    }

    // Sets the viewing as ID and saves to state
    function setViewingAs(id) {
        viewingAs = id;
        if (Cohere.state && Cohere.state.settings) {
            Cohere.state.settings.viewingAs = id;
            if (Cohere.Storage) Cohere.Storage.save(Cohere.Config.KEYS.settings, Cohere.state.settings);
        }
        const label = getActor().name;
        if (Cohere.UI) Cohere.UI.showToast("Now viewing as " + label + ".", "success");
        if (Cohere.App) Cohere.App.renderAll();
    }

    // Returns the current actor object
    function getActor() {
        if (viewingAs === "admin") {
            return { id: "admin", name: "Administrator (demo)", position: "", isAdmin: true };
        }
        if (Cohere.state && Cohere.state.members) {
            const m = Cohere.state.members.find(function (mem) { return mem.id === viewingAs; });
            if (m) {
                return { id: m.id, name: m.fullName, position: m.position, isAdmin: false };
            }
        }
        return { id: "admin", name: "Administrator (demo)", position: "", isAdmin: true };
    }

    // M0 Stub: Always returns true
    function can(action) {
        return true;
    }

    // M0 Stub: Always returns true
    function canUpdateTask(task) {
        return true;
    }

    // Returns a deny message for an action
    function denyMessage(action) {
        const actor = getActor();
        const label = Cohere.Config.ACTION_LABELS[action] || action;
        return `Viewing as ${actor.name} (${actor.position || "Administrator"}): you do not have permission to ${label}.`;
    }

    return { init, renderSelector, getViewingAs, setViewingAs, getActor, can, canUpdateTask, denyMessage };
})();