window.Cohere = window.Cohere || {};
Cohere.Members = (function () {
    "use strict";

    // Initializes the members view (attach listeners once)
    function init() {
        // Organization form
        const orgForm = document.getElementById("org-form");
        if (orgForm) {
            orgForm.addEventListener("submit", handleOrgSubmit);
        }

        const orgCancel = document.getElementById("org-cancel");
        if (orgCancel) {
            orgCancel.addEventListener("click", function () {
                resetOrgForm();
            });
        }

        // Organization list (event delegation)
        const orgList = document.getElementById("org-list");
        if (orgList) {
            orgList.addEventListener("click", function (e) {
                const btn = e.target.closest("[data-action]");
                if (!btn) return;
                const id = btn.dataset.id;
                const action = btn.dataset.action;

                if (action === "edit") startEditOrg(id);
                else if (action === "delete") handleOrgDelete(id);
            });
        }

        // Member form
        const memberForm = document.getElementById("member-form");
        if (memberForm) {
            memberForm.addEventListener("submit", handleMemberSubmit);
        }

        const memberCancel = document.getElementById("member-cancel");
        if (memberCancel) {
            memberCancel.addEventListener("click", function () {
                resetMemberForm();
            });
        }

        // Member search and filter
        const memberSearch = document.getElementById("member-search");
        if (memberSearch) {
            memberSearch.addEventListener("input", renderMemberTable);
        }

        const memberFilterOrg = document.getElementById("member-filter-org");
        if (memberFilterOrg) {
            memberFilterOrg.addEventListener("change", renderMemberTable);
        }

        // Member table (event delegation)
        const memberTableBody = document.getElementById("member-table-body");
        if (memberTableBody) {
            memberTableBody.addEventListener("click", function (e) {
                const btn = e.target.closest("[data-action]");
                if (!btn) return;
                const id = btn.dataset.id;
                const action = btn.dataset.action;

                if (action === "edit") startEditMember(id);
                else if (action === "delete") handleMemberDelete(id);
            });
        }
    }

    // Renders the entire members view
    function render() {
        renderOrgList();
        renderOrgForm();
        renderMemberForm();
        renderMemberTable();
    }

    // Renders the organization list
    function renderOrgList() {
        const list = document.getElementById("org-list");
        if (!list) return;

        Cohere.Utils.clearEl(list);

        const orgs = window.Cohere.state.organizations;

        if (orgs.length === 0) {
            const empty = Cohere.Utils.createEl("li", {
                textContent: "No organizations yet. Use the form to add one.",
                className: "text-muted"
            });
            list.appendChild(empty);
            return;
        }

        orgs.forEach(function (org) {
            const li = Cohere.Utils.createEl("li");
            li.style.padding = "12px";
            li.style.borderBottom = "1px solid var(--color-border)";

            const memberCount = window.Cohere.state.members.filter(function (m) { return m.orgId === org.id; }).length;

            const header = Cohere.Utils.createEl("div", {
                textContent: org.name + " (" + memberCount + " member" + (memberCount !== 1 ? "s" : "") + ")",
                style: "font-weight: 600; margin-bottom: 4px;"
            });

            const desc = Cohere.Utils.createEl("div", {
                textContent: org.description || "No description",
                className: "text-muted",
                style: "font-size: 0.875rem; margin-bottom: 8px;"
            });

            li.appendChild(header);
            li.appendChild(desc);

            if (Cohere.Permissions.can("manageMembers")) {
                const actions = Cohere.Utils.createEl("div", { style: "display: flex; gap: 8px;" });

                const editBtn = Cohere.Utils.createEl("button", {
                    textContent: "Edit",
                    className: "btn btn-secondary",
                    dataset: { action: "edit", id: org.id }
                });

                const deleteBtn = Cohere.Utils.createEl("button", {
                    textContent: "Delete",
                    className: "btn btn-danger",
                    dataset: { action: "delete", id: org.id }
                });

                actions.appendChild(editBtn);
                actions.appendChild(deleteBtn);
                li.appendChild(actions);
            }

            list.appendChild(li);
        });
    }

    // Renders the organization form (for editing)
    function renderOrgForm() {
        const editingId = document.getElementById("org-id").value;
        if (!editingId) return;

        const org = Cohere.Store.getOrg(editingId);
        if (!org) return;

        document.getElementById("org-name").value = org.name;
        document.getElementById("org-desc").value = org.description;
        document.getElementById("org-submit").textContent = "Update Organization";
        document.getElementById("org-cancel").hidden = false;
    }

    // Handles organization form submission
    function handleOrgSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const editingId = document.getElementById("org-id").value;

        const values = {
            name: document.getElementById("org-name").value,
            description: document.getElementById("org-desc").value
        };

        Cohere.UI.clearFieldErrors(form);

        const validation = Cohere.Validators.validateOrg(values, editingId || null);
        if (!validation.valid) {
            Cohere.UI.showFieldErrors(form, validation.errors);
            return;
        }

        let result;
        if (editingId) {
            result = Cohere.Store.updateOrg(editingId, values);
        } else {
            result = Cohere.Store.addOrg(values);
        }

        if (result.ok) {
            Cohere.UI.showToast(editingId ? "Organization updated." : "Organization added.", "success");
            resetOrgForm();
            Cohere.App.renderAll();
        } else {
            Cohere.UI.showToast(result.error, "error");
        }
    }

    // Starts editing an organization
    function startEditOrg(id) {
        const org = Cohere.Store.getOrg(id);
        if (!org) return;

        document.getElementById("org-id").value = org.id;
        document.getElementById("org-name").value = org.name;
        document.getElementById("org-desc").value = org.description;
        document.getElementById("org-submit").textContent = "Update Organization";
        document.getElementById("org-cancel").hidden = false;

        document.getElementById("org-name").focus();
    }

    // Handles organization deletion
    function handleOrgDelete(id) {
        const org = Cohere.Store.getOrg(id);
        if (!org) return;

        if (!Cohere.UI.confirmAction("Delete organization \"" + org.name + "\"?")) return;

        const result = Cohere.Store.deleteOrg(id);
        if (result.ok) {
            Cohere.UI.showToast("Organization deleted.", "success");
            Cohere.App.renderAll();
        } else {
            Cohere.UI.showToast(result.error, "error");
        }
    }

    // Resets the organization form
    function resetOrgForm() {
        const form = document.getElementById("org-form");
        if (form) {
            form.reset();
            document.getElementById("org-id").value = "";
            document.getElementById("org-submit").textContent = "Add Organization";
            document.getElementById("org-cancel").hidden = true;
            Cohere.UI.clearFieldErrors(form);
        }
    }

    // Renders the member form dropdowns
    function renderMemberForm() {
        const orgSelect = document.getElementById("member-orgId");
        const positionSelect = document.getElementById("member-position");

        if (orgSelect) {
            const orgs = window.Cohere.state.organizations.map(function (o) {
                return { value: o.id, label: o.name };
            });
            Cohere.Utils.populateSelect(orgSelect, orgs, "Select an organization");
        }

        if (positionSelect) {
            const positions = Cohere.Config.POSITIONS.map(function (p) {
                return { value: p, label: p };
            });
            Cohere.Utils.populateSelect(positionSelect, positions, "Select a position");
        }

        // If editing, fill the form
        const editingId = document.getElementById("member-id").value;
        if (editingId) {
            const member = Cohere.Store.getMember(editingId);
            if (member) {
                document.getElementById("member-fullName").value = member.fullName;
                document.getElementById("member-studentId").value = member.studentId;
                document.getElementById("member-orgId").value = member.orgId;
                document.getElementById("member-position").value = member.position;
                document.getElementById("member-yearSection").value = member.yearSection || "";
                document.getElementById("member-email").value = member.email || "";
                document.getElementById("member-submit").textContent = "Update Member";
                document.getElementById("member-cancel").hidden = false;
            }
        }
    }

    // Renders the member table with search and filter
    function renderMemberTable() {
        const tbody = document.getElementById("member-table-body");
        if (!tbody) return;

        Cohere.Utils.clearEl(tbody);

        // Update filter dropdown
        const filterOrg = document.getElementById("member-filter-org");
        if (filterOrg) {
            const currentVal = filterOrg.value;
            const orgs = window.Cohere.state.organizations.map(function (o) {
                return { value: o.id, label: o.name };
            });
            Cohere.Utils.populateSelect(filterOrg, orgs, "All organizations");
            filterOrg.value = currentVal;
        }

        const search = (document.getElementById("member-search").value || "").toLowerCase();
        const filterOrgId = filterOrg ? filterOrg.value : "";

        let members = window.Cohere.state.members;

        // Apply filters
        if (filterOrgId) {
            members = members.filter(function (m) { return m.orgId === filterOrgId; });
        }

        if (search) {
            members = members.filter(function (m) {
                return m.fullName.toLowerCase().includes(search) ||
                    m.studentId.toLowerCase().includes(search) ||
                    m.position.toLowerCase().includes(search);
            });
        }

        if (members.length === 0) {
            const tr = Cohere.Utils.createEl("tr");
            const td = Cohere.Utils.createEl("td", {
                textContent: "No members found.",
                colSpan: "5",
                className: "text-muted"
            });
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        members.forEach(function (m) {
            const org = Cohere.Store.getOrg(m.orgId);
            const orgName = org ? org.name : "Unknown";

            const tr = Cohere.Utils.createEl("tr");

            tr.appendChild(Cohere.Utils.createEl("td", { textContent: m.fullName }));
            tr.appendChild(Cohere.Utils.createEl("td", { textContent: m.studentId }));
            tr.appendChild(Cohere.Utils.createEl("td", { textContent: orgName }));
            tr.appendChild(Cohere.Utils.createEl("td", { textContent: m.position }));

            const actionsTd = Cohere.Utils.createEl("td");

            if (Cohere.Permissions.can("manageMembers")) {
                const editBtn = Cohere.Utils.createEl("button", {
                    textContent: "Edit",
                    className: "btn btn-secondary",
                    dataset: { action: "edit", id: m.id }
                });

                const deleteBtn = Cohere.Utils.createEl("button", {
                    textContent: "Delete",
                    className: "btn btn-danger",
                    dataset: { action: "delete", id: m.id },
                    style: "margin-left: 4px;"
                });

                actionsTd.appendChild(editBtn);
                actionsTd.appendChild(deleteBtn);
            } else {
                actionsTd.textContent = "—";
            }

            tr.appendChild(actionsTd);
            tbody.appendChild(tr);
        });
    }

    // Handles member form submission
    function handleMemberSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const editingId = document.getElementById("member-id").value;

        const values = {
            fullName: document.getElementById("member-fullName").value,
            studentId: document.getElementById("member-studentId").value,
            orgId: document.getElementById("member-orgId").value,
            position: document.getElementById("member-position").value,
            yearSection: document.getElementById("member-yearSection").value,
            email: document.getElementById("member-email").value
        };

        Cohere.UI.clearFieldErrors(form);

        const validation = Cohere.Validators.validateMember(values, editingId || null);
        if (!validation.valid) {
            Cohere.UI.showFieldErrors(form, validation.errors);
            return;
        }

        let result;
        if (editingId) {
            result = Cohere.Store.updateMember(editingId, values);
        } else {
            result = Cohere.Store.addMember(values);
        }

        if (result.ok) {
            Cohere.UI.showToast(editingId ? "Member updated." : "Member added.", "success");
            resetMemberForm();
            Cohere.App.renderAll();
        } else {
            Cohere.UI.showToast(result.error, "error");
        }
    }

    // Starts editing a member
    function startEditMember(id) {
        const member = Cohere.Store.getMember(id);
        if (!member) return;

        document.getElementById("member-id").value = member.id;
        document.getElementById("member-fullName").value = member.fullName;
        document.getElementById("member-studentId").value = member.studentId;
        document.getElementById("member-orgId").value = member.orgId;
        document.getElementById("member-position").value = member.position;
        document.getElementById("member-yearSection").value = member.yearSection || "";
        document.getElementById("member-email").value = member.email || "";
        document.getElementById("member-submit").textContent = "Update Member";
        document.getElementById("member-cancel").hidden = false;

        document.getElementById("member-fullName").focus();
    }

    // Handles member deletion
    function handleMemberDelete(id) {
        const member = Cohere.Store.getMember(id);
        if (!member) return;

        const taskCount = window.Cohere.state.tasks.filter(function (t) { return t.assigneeId === id; }).length;
        let confirmMsg = "Delete member \"" + member.fullName + "\"?";
        if (taskCount > 0) {
            confirmMsg += " This will also delete " + taskCount + " task(s) assigned to them.";
        }

        if (!Cohere.UI.confirmAction(confirmMsg)) return;

        const result = Cohere.Store.deleteMember(id);
        if (result.ok) {
            Cohere.UI.showToast("Member deleted.", "success");
            Cohere.App.renderAll();
        } else {
            Cohere.UI.showToast(result.error, "error");
        }
    }

    // Resets the member form
    function resetMemberForm() {
        const form = document.getElementById("member-form");
        if (form) {
            form.reset();
            document.getElementById("member-id").value = "";
            document.getElementById("member-submit").textContent = "Add Member";
            document.getElementById("member-cancel").hidden = true;
            Cohere.UI.clearFieldErrors(form);
        }
    }

    return { init, render, renderMemberTable };
})();