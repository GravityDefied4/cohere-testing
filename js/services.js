window.Cohere = window.Cohere || {};
Cohere.Services = (function () {
    "use strict";

    // Returns true if a task is overdue (not completed and deadline is before today)
    function isOverdue(task) {
        if (!task) return false;
        if (task.status === "Completed") return false;
        const today = Cohere.Utils.todayISO();
        return task.deadline < today;
    }

    // Returns true if a task was completed on or before its deadline
    function isOnTime(task) {
        if (!task) return false;
        if (task.status !== "Completed") return false;
        if (!task.completedAt) return false;
        return task.completedAt <= task.deadline;
    }

    return { isOverdue, isOnTime };
})();