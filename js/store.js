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

    return { getOrg, getMember, getMemberName, addOrg, updateOrg, deleteOrg, addMember, updateMember, deleteMember };
})();