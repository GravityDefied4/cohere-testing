window.Cohere = window.Cohere || {};
Cohere.Validators = (function () {
    "use strict";

    // Validates organization form values
    function validateOrg(values, editingId) {
        const errors = {};
        const name = (values.name || "").trim();
        const description = (values.description || "").trim();

        // Name: required, 3-60 chars
        if (!name || name.length < 3 || name.length > 60) {
            errors["org-name"] = "Organization name is required (3–60 characters).";
        }

        // Name: unique (ignore case)
        if (!errors["org-name"]) {
            const duplicate = window.Cohere.state.organizations.some(function (o) {
                return o.id !== editingId && o.name.toLowerCase() === name.toLowerCase();
            });
            if (duplicate) {
                errors["org-name"] = "That organization already exists.";
            }
        }

        // Description: optional, up to 200 chars
        if (description.length > 200) {
            errors["org-desc"] = "Description is too long (max 200).";
        }

        return { valid: Object.keys(errors).length === 0, errors: errors };
    }

    // Validates member form values
    function validateMember(values, editingId) {
        const errors = {};
        const fullName = (values.fullName || "").trim();
        const studentId = (values.studentId || "").trim();
        const orgId = values.orgId || "";
        const position = values.position || "";
        const yearSection = (values.yearSection || "").trim();
        const email = (values.email || "").trim();

        // Full name: required, 2-60 chars, letters/spaces/.  ' - only
        if (!fullName || fullName.length < 2 || fullName.length > 60) {
            errors["member-fullName"] = "Enter a valid full name.";
        } else if (!/^[A-Za-z\s.'\-]+$/.test(fullName)) {
            errors["member-fullName"] = "Enter a valid full name.";
        }

        // Student ID: required, /^[A-Za-z0-9-]{4,20}$/, unique
        if (!studentId || !/^[A-Za-z0-9-]{4,20}$/.test(studentId)) {
            errors["member-studentId"] = "Enter a valid student ID.";
        } else {
            const duplicate = window.Cohere.state.members.some(function (m) {
                return m.id !== editingId && m.studentId === studentId;
            });
            if (duplicate) {
                errors["member-studentId"] = "This student ID is already registered.";
            }
        }

        // Organization: required
        if (!orgId) {
            errors["member-orgId"] = "Select an organization.";
        } else {
            const org = Cohere.Store.getOrg(orgId);
            if (!org) {
                errors["member-orgId"] = "Select an organization.";
            }
        }

        // Position: required
        if (!position || !Cohere.Config.POSITIONS.includes(position)) {
            errors["member-position"] = "Select a position.";
        }

        // Year/section: optional, up to 20 chars
        if (yearSection.length > 20) {
            errors["member-yearSection"] = "Year/section is too long.";
        }

        // Email: optional, valid format
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors["member-email"] = "Enter a valid email address.";
        }

        return { valid: Object.keys(errors).length === 0, errors: errors };
    }

        // Validates task form values
    function validateTask(values, editingId) {
        const errors = {};
        const title = (values.title || "").trim();
        const description = (values.description || "").trim();
        const assigneeId = values.assigneeId || "";
        const priority = values.priority || "";
        const status = values.status || "";
        const deadline = (values.deadline || "").trim();
        const completedAt = (values.completedAt || "").trim();

        // Title: required, 3-80 chars
        if (!title || title.length < 3 || title.length > 80) {
            errors["task-title"] = "Task title is required (3–80 characters).";
        }

        // Description: optional, up to 300 chars
        if (description.length > 300) {
            errors["task-description"] = "Description is too long (max 300).";
        }

        // Assignee: required, must exist
        if (!assigneeId) {
            errors["task-assigneeId"] = "Choose who this task is assigned to.";
        } else {
            const member = Cohere.Store.getMember(assigneeId);
            if (!member) {
                errors["task-assigneeId"] = "Choose who this task is assigned to.";
            }
        }

        // Priority: required, must be listed
        if (!priority || !Cohere.Config.PRIORITIES.includes(priority)) {
            errors["task-priority"] = "Select a priority.";
        }

        // Status: required, must be listed
        if (!status || !Cohere.Config.TASK_STATUSES.includes(status)) {
            errors["task-status"] = "Select a status.";
        }

        // Deadline: required, valid date
        if (!deadline || !Cohere.Utils.isValidISODate(deadline)) {
            errors["task-deadline"] = "Enter a valid deadline.";
        } else {
            const today = Cohere.Utils.todayISO();
            if (editingId) {
                // When editing, allow unchanged past deadline
                const existingTask = Cohere.Store.getTask(editingId);
                if (existingTask && existingTask.deadline !== deadline && deadline < today) {
                    errors["task-deadline"] = "Deadline cannot be in the past.";
                }
            } else {
                // When creating, deadline must not be in the past
                if (deadline < today) {
                    errors["task-deadline"] = "Deadline cannot be in the past.";
                }
            }
        }

        // CompletedAt: required only when status is Completed
        if (status === "Completed") {
            if (!completedAt || !Cohere.Utils.isValidISODate(completedAt)) {
                errors["task-completedAt"] = "Enter the completion date (not in the future).";
            } else {
                const today = Cohere.Utils.todayISO();
                if (completedAt > today) {
                    errors["task-completedAt"] = "Enter the completion date (not in the future).";
                } else {
                    // Must not be before task's creation date
                    let createdAt = today;
                    if (editingId) {
                        const existingTask = Cohere.Store.getTask(editingId);
                        if (existingTask) createdAt = existingTask.createdAt;
                    }
                    if (completedAt < createdAt) {
                        errors["task-completedAt"] = "Enter the completion date (not in the future).";
                    }
                }
            }
        }

        return { valid: Object.keys(errors).length === 0, errors: errors };
    }

    return { validateOrg, validateMember, validateTask };
})();