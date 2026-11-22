window.Cohere = window.Cohere || {};
Cohere.Store = (function () {
    "use strict";

    // Returns an organization by ID
    function getOrg(id) {
        return window.Cohere.state.organizations.find(function (o) { return o.id === id; }) || null;
    }

    // Returns a member by ID
    function getMember(id) {
        return window.Cohere.state.members.find(function (m) { return m.id === id; }) || null;
    }

    // Returns a member's full name, or "Unknown officer" if not found
    function getMemberName(id) {
        const m = getMember(id);
        return m ? m.fullName : "Unknown officer";
    }

    // Returns a task by ID
    function getTask(id) {
        return window.Cohere.state.tasks.find(function (t) { return t.id === id; }) || null;
    }

    // Adds a new organization
    function addOrg(values) {
        if (!Cohere.Permissions.can("manageMembers")) {
            return { ok: false, error: Cohere.Permissions.denyMessage("manageMembers") };
        }

        const org = {
            id: Cohere.Utils.generateId("org"),
            name: values.name.trim(),
            description: (values.description || "").trim(),
            createdAt: Cohere.Utils.todayISO()
        };

        window.Cohere.state.organizations.push(org);
        Cohere.Storage.saveAll();
        Cohere.Activity.log("organization", "Created organization \"" + org.name + "\"");

        return { ok: true, data: org };
    }

    // Updates an existing organization
    function updateOrg(id, values) {
        if (!Cohere.Permissions.can("manageMembers")) {
            return { ok: false, error: Cohere.Permissions.denyMessage("manageMembers") };
        }

        const org = getOrg(id);
        if (!org) return { ok: false, error: "Organization not found." };

        org.name = values.name.trim();
        org.description = (values.description || "").trim();

        Cohere.Storage.saveAll();
        Cohere.Activity.log("organization", "Updated organization \"" + org.name + "\"");

        return { ok: true, data: org };
    }

    // Deletes an organization (blocked if it has members)
    function deleteOrg(id) {
        if (!Cohere.Permissions.can("manageMembers")) {
            return { ok: false, error: Cohere.Permissions.denyMessage("manageMembers") };
        }

        const org = getOrg(id);
        if (!org) return { ok: false, error: "Organization not found." };

        const hasMembers = window.Cohere.state.members.some(function (m) { return m.orgId === id; });
        if (hasMembers) {
            return { ok: false, error: "Cannot delete organization \"" + org.name + "\" because it still has members. Remove or reassign them first." };
        }

        window.Cohere.state.organizations = window.Cohere.state.organizations.filter(function (o) { return o.id !== id; });
        Cohere.Storage.saveAll();
        Cohere.Activity.log("organization", "Deleted organization \"" + org.name + "\"");

        return { ok: true, data: org };
    }

    // Adds a new member
    function addMember(values) {
        if (!Cohere.Permissions.can("manageMembers")) {
            return { ok: false, error: Cohere.Permissions.denyMessage("manageMembers") };
        }

        const member = {
            id: Cohere.Utils.generateId("mem"),
            fullName: values.fullName.trim(),
            studentId: values.studentId.trim(),
            orgId: values.orgId,
            position: values.position,
            yearSection: (values.yearSection || "").trim(),
            email: (values.email || "").trim(),
            createdAt: Cohere.Utils.todayISO()
        };

        window.Cohere.state.members.push(member);
        Cohere.Storage.saveAll();
        Cohere.Activity.log("member", "Added member \"" + member.fullName + "\"");

        return { ok: true, data: member };
    }

    // Updates an existing member
    function updateMember(id, values) {
        if (!Cohere.Permissions.can("manageMembers")) {
            return { ok: false, error: Cohere.Permissions.denyMessage("manageMembers") };
        }

        const member = getMember(id);
        if (!member) return { ok: false, error: "Member not found." };

        member.fullName = values.fullName.trim();
        member.studentId = values.studentId.trim();
        member.orgId = values.orgId;
        member.position = values.position;
        member.yearSection = (values.yearSection || "").trim();
        member.email = (values.email || "").trim();

        Cohere.Storage.saveAll();
        Cohere.Activity.log("member", "Updated member \"" + member.fullName + "\"");

        return { ok: true, data: member };
    }

    // Deletes a member with cascade rules
    function deleteMember(id) {
        if (!Cohere.Permissions.can("manageMembers")) {
            return { ok: false, error: Cohere.Permissions.denyMessage("manageMembers") };
        }

        const member = getMember(id);
        if (!member) return { ok: false, error: "Member not found." };

        // Cascade: delete tasks assigned to this member
        const memberTasks = window.Cohere.state.tasks.filter(function (t) { return t.assigneeId === id; });
        window.Cohere.state.tasks = window.Cohere.state.tasks.filter(function (t) { return t.assigneeId !== id; });

        // Cascade: remove from appointments
        window.Cohere.state.appointments.forEach(function (appt) {
            appt.memberIds = appt.memberIds.filter(function (mid) { return mid !== id; });
        });

        // Cascade: delete attendance records
        window.Cohere.state.attendance = window.Cohere.state.attendance.filter(function (a) { return a.memberId !== id; });

        // Delete the member
        window.Cohere.state.members = window.Cohere.state.members.filter(function (m) { return m.id !== id; });

        // If viewing as this member, reset to admin
        if (Cohere.Permissions.getViewingAs() === id) {
            Cohere.Permissions.setViewingAs("admin");
        }
        
        Cohere.Storage.saveAll();
        Cohere.Activity.log("member", "Deleted member \"" + member.fullName + "\"" + (memberTasks.length > 0 ? " and " + memberTasks.length + " task(s)" : ""));

        return { ok: true, data: member };
    }

    // Adds a new task
    function addTask(values) {
        if (!Cohere.Permissions.can("manageTasks")) {
            return { ok: false, error: Cohere.Permissions.denyMessage("manageTasks") };
        }

        const task = {
            id: Cohere.Utils.generateId("task"),
            title: values.title.trim(),
            description: (values.description || "").trim(),
            assigneeId: values.assigneeId,
            priority: values.priority,
            deadline: values.deadline,
            status: values.status,
            createdAt: Cohere.Utils.todayISO(),
            completedAt: values.status === "Completed" ? values.completedAt : null
        };

        window.Cohere.state.tasks.push(task);
        Cohere.Storage.saveAll();
        Cohere.Activity.log("task", "Created task \"" + task.title + "\" assigned to " + getMemberName(task.assigneeId));
        Cohere.Notify.add("task", "You have been assigned a new task: \"" + task.title + "\"", task.assigneeId, task.id);

        return { ok: true, data: task };
    }

    // Updates an existing task
    function updateTask(id, values) {
        if (!Cohere.Permissions.can("manageTasks")) {
            return { ok: false, error: Cohere.Permissions.denyMessage("manageTasks") };
        }

        const task = getTask(id);
        if (!task) return { ok: false, error: "Task not found." };

        const oldAssignee = task.assigneeId;

        task.title = values.title.trim();
        task.description = (values.description || "").trim();
        task.assigneeId = values.assigneeId;
        task.priority = values.priority;
        task.deadline = values.deadline;
        task.status = values.status;
        task.completedAt = values.status === "Completed" ? values.completedAt : null;

        Cohere.Storage.saveAll();
        Cohere.Activity.log("task", "Updated task \"" + task.title + "\"");

        if (oldAssignee !== task.assigneeId) {
            Cohere.Notify.add("task", "You have been assigned task: \"" + task.title + "\"", task.assigneeId, task.id);
        }

        return { ok: true, data: task };
    }

    // Deletes a task
    function deleteTask(id) {
        if (!Cohere.Permissions.can("manageTasks")) {
            return { ok: false, error: Cohere.Permissions.denyMessage("manageTasks") };
        }

        const task = getTask(id);
        if (!task) return { ok: false, error: "Task not found." };

        window.Cohere.state.tasks = window.Cohere.state.tasks.filter(function (t) { return t.id !== id; });
        Cohere.Storage.saveAll();
        Cohere.Activity.log("task", "Deleted task \"" + task.title + "\"");

        return { ok: true, data: task };
    }

    // Sets a task's status (used for quick complete/reopen, checks canUpdateTask)
    function setTaskStatus(taskId, status, completedAt) {
        const task = getTask(taskId);
        if (!task) return { ok: false, error: "Task not found." };

        if (!Cohere.Permissions.canUpdateTask(task)) {
            return { ok: false, error: Cohere.Permissions.denyMessage("manageTasks") };
        }

        task.status = status;
        task.completedAt = status === "Completed" ? (completedAt || Cohere.Utils.todayISO()) : null;

        Cohere.Storage.saveAll();
        Cohere.Activity.log("task", (status === "Completed" ? "Completed" : "Reopened") + " task \"" + task.title + "\"");

        return { ok: true, data: task };
    }

    return {
        getOrg, getMember, getMemberName, getTask,
        addOrg, updateOrg, deleteOrg,
        addMember, updateMember, deleteMember,
        addTask, updateTask, deleteTask, setTaskStatus
    };
})();