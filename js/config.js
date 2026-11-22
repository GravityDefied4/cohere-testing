window.Cohere = window.Cohere || {};
Cohere.Config = (function () {
    "use strict";

    const KEYS = {
        orgs: "cohere.v1.organizations",
        members: "cohere.v1.members",
        tasks: "cohere.v1.tasks",
        appointments: "cohere.v1.appointments",
        attendance: "cohere.v1.attendance",
        activity: "cohere.v1.activity",
        notifications: "cohere.v1.notifications",
        settings: "cohere.v1.settings"
    };

    const POSITIONS = ["President", "Vice President", "Secretary", "Treasurer", "Auditor", "Public Information Officer", "Representative", "Member"];
    const PRIORITIES = ["Low", "Medium", "High"];
    const TASK_STATUSES = ["Pending", "In Progress", "Completed"];
    const APPT_STATUSES = ["Scheduled", "Completed", "Cancelled"];
    const ATT_STATUSES = ["present", "absent", "excused"];
    const WEIGHTS = { task: 0.4, onTime: 0.3, attendance: 0.3 };
    const REMINDER_DAYS = 2;
    const MAX_ACTIVITY = 200;
    const MAX_NOTIFICATIONS = 100;

    const ACTIONS = ["manageMembers", "manageTasks", "manageMeetings", "markAttendance", "manageData"];

    const PERMISSIONS = {
        "Administrator (demo)": ["manageMembers", "manageTasks", "manageMeetings", "markAttendance", "manageData"],
        "President": ["manageMembers", "manageTasks", "manageMeetings", "markAttendance", "manageData"],
        "Vice President": ["manageMembers", "manageTasks", "manageMeetings", "markAttendance", "manageData"],
        "Secretary": ["manageTasks", "manageMeetings", "markAttendance"],
        "Treasurer": [],
        "Auditor": [],
        "Public Information Officer": [],
        "Representative": [],
        "Member": []
    };

    const ACTION_LABELS = {
        manageMembers: "manage members",
        manageTasks: "manage tasks",
        manageMeetings: "manage meetings",
        markAttendance: "mark attendance",
        manageData: "manage data"
    };

    return { KEYS, POSITIONS, PRIORITIES, TASK_STATUSES, APPT_STATUSES, ATT_STATUSES, WEIGHTS, REMINDER_DAYS, MAX_ACTIVITY, MAX_NOTIFICATIONS, ACTIONS, PERMISSIONS, ACTION_LABELS };
})();