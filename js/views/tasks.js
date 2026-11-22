window.Cohere = window.Cohere || {};
Cohere.Tasks = (function () {
    "use strict";

    // Initializes the tasks view (attach listeners once)
    function init() {
        const taskForm = document.getElementById("task-form");
        if (taskForm) {
            taskForm.addEventListener("submit", handleTaskSubmit);
        }

        const taskStatus = document.getElementById("task-status");
        if (taskStatus) {
            taskStatus.addEventListener("change", toggleCompletedField);
        }

        const taskCancel = document.getElementById("task-cancel");
        if (taskCancel) {
            taskCancel.addEventListener("click", function () {
                resetTaskForm();
            });
        }

        const taskList = document.getElementById("task-list");
        if (taskList) {
            taskList.addEventListener("click", function (e) {
                const btn = e.target.closest("[data-action]");
                if (!btn) return;
                const id = btn.dataset.id;
                const action = btn.dataset.action;

                if (action === "edit") startEditTask(id);
                else if (action === "delete") handleTaskDelete(id);
                else if (action === "toggle-complete") quickToggleComplete(id);
            });
        }

        const taskSearch = document.getElementById("task-search");
        if (taskSearch) {
            taskSearch.addEventListener("input", renderTaskList);
        }

        const filterStatus = document.getElementById("task-filter-status");
        if (filterStatus) {
            filterStatus.addEventListener("change", renderTaskList);
        }

        const filterPriority = document.getElementById("task-filter-priority");
        if (filterPriority) {
            filterPriority.addEventListener("change", renderTaskList);
        }

        const filterAssignee = document.getElementById("task-filter-assignee");
        if (filterAssignee) {
            filterAssignee.addEventListener("change", renderTaskList);
        }

        const taskSort = document.getElementById("task-sort");
        if (taskSort) {
            taskSort.addEventListener("change", renderTaskList);
        }
    }

    // Renders the entire tasks view
    function render() {
        renderTaskForm();
        renderTaskList();
    }

    // Renders the task form dropdowns
    function renderTaskForm() {
        const assigneeSelect = document.getElementById("task-assigneeId");
        const prioritySelect = document.getElementById("task-priority");
        const statusSelect = document.getElementById("task-status");

        if (assigneeSelect) {
            const members = window.Cohere.state.members.map(function (m) {
                return { value: m.id, label: m.fullName + " — " + m.position };
            });
            Cohere.Utils.populateSelect(assigneeSelect, members, "Select an assignee");
        }

        if (prioritySelect) {
            const priorities = Cohere.Config.PRIORITIES.map(function (p) {
                return { value: p, label: p };
            });
            Cohere.Utils.populateSelect(prioritySelect, priorities, "Select a priority");
        }

        if (statusSelect) {
            const statuses = Cohere.Config.TASK_STATUSES.map(function (s) {
                return { value: s, label: s };
            });
            Cohere.Utils.populateSelect(statusSelect, statuses, null);
            if (!statusSelect.value) statusSelect.value = "Pending";
        }

        // If editing, fill the form
        const editingId = document.getElementById("task-id").value;
        if (editingId) {
            const task = Cohere.Store.getTask(editingId);
            if (task) {
                document.getElementById("task-title").value = task.title;
                document.getElementById("task-description").value = task.description || "";
                document.getElementById("task-assigneeId").value = task.assigneeId;
                document.getElementById("task-priority").value = task.priority;
                document.getElementById("task-deadline").value = task.deadline;
                document.getElementById("task-status").value = task.status;
                if (task.status === "Completed") {
                    document.getElementById("task-completedAt").value = task.completedAt || Cohere.Utils.todayISO();
                }
                document.getElementById("task-submit").textContent = "Update Task";
                document.getElementById("task-cancel").hidden = false;
            }
        }

        toggleCompletedField();
    }

    // Shows/hides the completedAt field based on status
    function toggleCompletedField() {
        const status = document.getElementById("task-status").value;
        const wrap = document.getElementById("task-completed-wrap");
        const completedAtInput = document.getElementById("task-completedAt");

        if (status === "Completed") {
            wrap.hidden = false;
            if (!completedAtInput.value) {
                completedAtInput.value = Cohere.Utils.todayISO();
            }
        } else {
            wrap.hidden = true;
            completedAtInput.value = "";
        }
    }

    // Renders the task list with filters and sort
    function renderTaskList() {
        const tbody = document.getElementById("task-list");
        if (!tbody) return;

        Cohere.Utils.clearEl(tbody);

        // Populate filter dropdowns
        const filterStatus = document.getElementById("task-filter-status");
        if (filterStatus && !filterStatus.options.length) {
            const statuses = [{ value: "", label: "All statuses" }];
            Cohere.Config.TASK_STATUSES.forEach(function (s) {
                statuses.push({ value: s, label: s });
            });
            Cohere.Utils.populateSelect(filterStatus, statuses, null);
        }

        const filterPriority = document.getElementById("task-filter-priority");
        if (filterPriority && !filterPriority.options.length) {
            const priorities = [{ value: "", label: "All priorities" }];
            Cohere.Config.PRIORITIES.forEach(function (p) {
                priorities.push({ value: p, label: p });
            });
            Cohere.Utils.populateSelect(filterPriority, priorities, null);
        }

        const filterAssignee = document.getElementById("task-filter-assignee");
        if (filterAssignee) {
            const currentVal = filterAssignee.value;
            const members = [{ value: "", label: "All assignees" }];
            window.Cohere.state.members.forEach(function (m) {
                members.push({ value: m.id, label: m.fullName });
            });
            Cohere.Utils.populateSelect(filterAssignee, members, null);
            filterAssignee.value = currentVal;
        }

        const taskSort = document.getElementById("task-sort");
        if (taskSort && !taskSort.options.length) {
            const sorts = [
                { value: "deadline-asc", label: "Deadline (soonest first)" },
                { value: "deadline-desc", label: "Deadline (latest first)" },
                { value: "priority", label: "Priority (high to low)" },
                { value: "assignee", label: "Assignee (A-Z)" }
            ];
            Cohere.Utils.populateSelect(taskSort, sorts, null);
        }

        const search = (document.getElementById("task-search").value || "").toLowerCase();
        const statusFilter = filterStatus ? filterStatus.value : "";
        const priorityFilter = filterPriority ? filterPriority.value : "";
        const assigneeFilter = filterAssignee ? filterAssignee.value : "";
        const sort = taskSort ? taskSort.value : "deadline-asc";

        let tasks = window.Cohere.state.tasks.slice();

        // Apply filters
        if (statusFilter) {
            tasks = tasks.filter(function (t) { return t.status === statusFilter; });
        }
        if (priorityFilter) {
            tasks = tasks.filter(function (t) { return t.priority === priorityFilter; });
        }
        if (assigneeFilter) {
            tasks = tasks.filter(function (t) { return t.assigneeId === assigneeFilter; });
        }
        if (search) {
            tasks = tasks.filter(function (t) {
                const assigneeName = Cohere.Store.getMemberName(t.assigneeId).toLowerCase();
                return t.title.toLowerCase().includes(search) ||
                    assigneeName.includes(search);
            });
        }

        // Apply sort
        tasks = sortTasks(tasks, sort);

        if (tasks.length === 0) {
            const tr = Cohere.Utils.createEl("tr");
            const td = Cohere.Utils.createEl("td", {
                textContent: "No tasks found. Use the form to add one.",
                colSpan: "6",
                className: "text-muted"
            });
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        const today = Cohere.Utils.todayISO();

        tasks.forEach(function (t) {
            const isOverdue = Cohere.Services.isOverdue(t);
            const tr = Cohere.Utils.createEl("tr");
            if (isOverdue) tr.classList.add("row-overdue");

            tr.appendChild(Cohere.Utils.createEl("td", { textContent: t.title }));
            tr.appendChild(Cohere.Utils.createEl("td", { textContent: Cohere.Store.getMemberName(t.assigneeId) }));

            const priorityKind = t.priority === "High" ? "high" : t.priority === "Medium" ? "medium" : "low";
            tr.appendChild(Cohere.Utils.createEl("td", {
                appendChild: Cohere.UI.statusBadge(t.priority, priorityKind)
            }));

            const deadlineText = Cohere.Utils.formatDate(t.deadline) + (isOverdue ? " (overdue)" : "");
            tr.appendChild(Cohere.Utils.createEl("td", { textContent: deadlineText }));

            const statusKind = t.status === "Completed" ? "completed" : t.status === "In Progress" ? "progress" : "pending";
            tr.appendChild(Cohere.Utils.createEl("td", {
                appendChild: Cohere.UI.statusBadge(t.status, statusKind)
            }));

            const actionsTd = Cohere.Utils.createEl("td");

            const canUpdate = Cohere.Permissions.canUpdateTask(t);
            const canManage = Cohere.Permissions.can("manageTasks");

            if (canUpdate) {
                const toggleText = t.status === "Completed" ? "Reopen" : "Complete";
                const toggleBtn = Cohere.Utils.createEl("button", {
                    textContent: toggleText,
                    className: "btn btn-secondary",
                    dataset: { action: "toggle-complete", id: t.id }
                });
                actionsTd.appendChild(toggleBtn);
            }

            if (canManage) {
                const editBtn = Cohere.Utils.createEl("button", {
                    textContent: "Edit",
                    className: "btn btn-secondary",
                    dataset: { action: "edit", id: t.id },
                    style: "margin-left: 4px;"
                });

                const deleteBtn = Cohere.Utils.createEl("button", {
                    textContent: "Delete",
                    className: "btn btn-danger",
                    dataset: { action: "delete", id: t.id },
                    style: "margin-left: 4px;"
                });

                actionsTd.appendChild(editBtn);
                actionsTd.appendChild(deleteBtn);
            }

            if (!canUpdate && !canManage) {
                actionsTd.textContent = "—";
            }

            tr.appendChild(actionsTd);
            tbody.appendChild(tr);
        });
    }

    // Sorts tasks according to the selected sort option
    function sortTasks(tasks, sort) {
        const openTasks = tasks.filter(function (t) { return t.status !== "Completed"; });
        const completedTasks = tasks.filter(function (t) { return t.status === "Completed"; });

        const sortFn = function (a, b) {
            if (sort === "deadline-asc" || sort === "deadline-desc") {
                const cmp = a.deadline.localeCompare(b.deadline);
                return sort === "deadline-desc" ? -cmp : cmp;
            } else if (sort === "priority") {
                const priorityOrder = { "High": 3, "Medium": 2, "Low": 1 };
                const cmp = priorityOrder[b.priority] - priorityOrder[a.priority];
                if (cmp !== 0) return cmp;
                return a.deadline.localeCompare(b.deadline);
            } else if (sort === "assignee") {
                const nameA = Cohere.Store.getMemberName(a.assigneeId);
                const nameB = Cohere.Store.getMemberName(b.assigneeId);
                const cmp = nameA.localeCompare(nameB);
                if (cmp !== 0) return cmp;
                return a.deadline.localeCompare(b.deadline);
            }
            return 0;
        };

        openTasks.sort(sortFn);
        completedTasks.sort(sortFn);

        return openTasks.concat(completedTasks);
    }

    // Handles task form submission
    function handleTaskSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const editingId = document.getElementById("task-id").value;

        const values = {
            title: document.getElementById("task-title").value,
            description: document.getElementById("task-description").value,
            assigneeId: document.getElementById("task-assigneeId").value,
            priority: document.getElementById("task-priority").value,
            deadline: document.getElementById("task-deadline").value,
            status: document.getElementById("task-status").value,
            completedAt: document.getElementById("task-completedAt").value
        };

        Cohere.UI.clearFieldErrors(form);

        const validation = Cohere.Validators.validateTask(values, editingId || null);
        if (!validation.valid) {
            Cohere.UI.showFieldErrors(form, validation.errors);
            return;
        }

        let result;
        if (editingId) {
            result = Cohere.Store.updateTask(editingId, values);
        } else {
            result = Cohere.Store.addTask(values);
        }

        if (result.ok) {
            Cohere.UI.showToast(editingId ? "Task updated." : "Task added.", "success");
            resetTaskForm();
            Cohere.App.renderAll();
        } else {
            Cohere.UI.showToast(result.error, "error");
        }
    }

    // Starts editing a task
    function startEditTask(id) {
        const task = Cohere.Store.getTask(id);
        if (!task) return;

        document.getElementById("task-id").value = task.id;
        document.getElementById("task-title").value = task.title;
        document.getElementById("task-description").value = task.description || "";
        document.getElementById("task-assigneeId").value = task.assigneeId;
        document.getElementById("task-priority").value = task.priority;
        document.getElementById("task-deadline").value = task.deadline;
        document.getElementById("task-status").value = task.status;
        if (task.status === "Completed") {
            document.getElementById("task-completedAt").value = task.completedAt || Cohere.Utils.todayISO();
        }
        document.getElementById("task-submit").textContent = "Update Task";
        document.getElementById("task-cancel").hidden = false;

        toggleCompletedField();
        document.getElementById("task-title").focus();
    }

    // Handles task deletion
    function handleTaskDelete(id) {
        const task = Cohere.Store.getTask(id);
        if (!task) return;

        if (!Cohere.UI.confirmAction("Delete task \"" + task.title + "\"?")) return;

        const result = Cohere.Store.deleteTask(id);
        if (result.ok) {
            Cohere.UI.showToast("Task deleted.", "success");
            Cohere.App.renderAll();
        } else {
            Cohere.UI.showToast(result.error, "error");
        }
    }

    // Quick toggles a task's complete/reopen status
    function quickToggleComplete(id) {
        const task = Cohere.Store.getTask(id);
        if (!task) return;

        let newStatus, completedAt;
        if (task.status === "Completed") {
            newStatus = "Pending";
            completedAt = null;
        } else {
            newStatus = "Completed";
            completedAt = Cohere.Utils.todayISO();
        }

        const result = Cohere.Store.setTaskStatus(id, newStatus, completedAt);
        if (result.ok) {
            Cohere.UI.showToast(newStatus === "Completed" ? "Task marked complete." : "Task reopened.", "success");
            Cohere.App.renderAll();
        } else {
            Cohere.UI.showToast(result.error, "error");
        }
    }

    // Resets the task form
    function resetTaskForm() {
        const form = document.getElementById("task-form");
        if (form) {
            form.reset();
            document.getElementById("task-id").value = "";
            document.getElementById("task-submit").textContent = "Add Task";
            document.getElementById("task-cancel").hidden = true;
            document.getElementById("task-status").value = "Pending";
            Cohere.UI.clearFieldErrors(form);
            toggleCompletedField();
        }
    }

    return { init, render, renderTaskList, toggleCompletedField };
})();