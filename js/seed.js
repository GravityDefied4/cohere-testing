window.Cohere = window.Cohere || {};
Cohere.Seed = (function () {
    "use strict";

    // Generates minimal sample data for M1 (3 organizations)
    function generate() {
        const today = Cohere.Utils.todayISO();

        const organizations = [
            {
                id: Cohere.Utils.generateId("org"),
                name: "Computer Society (Sample)",
                description: "Sample organization for IT students",
                createdAt: today
            },
            {
                id: Cohere.Utils.generateId("org"),
                name: "Student Council (Sample)",
                description: "Sample student government organization",
                createdAt: today
            },
            {
                id: Cohere.Utils.generateId("org"),
                name: "Arts and Culture Guild (Sample)",
                description: "Sample organization for arts enthusiasts",
                createdAt: today
            }
        ];

        return {
            organizations: organizations,
            members: [],
            tasks: [],
            appointments: [],
            attendance: [],
            activity: [],
            notifications: [],
            settings: { seeded: true, schemaVersion: 1, viewingAs: "admin" }
        };
    }

    return { generate };
})();