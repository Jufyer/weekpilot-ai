export function addDays(date: Date, days: number) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
}

export function getMonday(date: Date) {
    const copy = new Date(date);
    const day = copy.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    copy.setDate(copy.getDate() + diffToMonday);
    copy.setHours(0, 0, 0, 0);

    return copy;
}

export function getDefaultPlanningWeek() {
    const today = new Date();

    if (today.getDay() === 0) {
        return addDays(getMonday(today), 7);
    }

    return getMonday(today);
}

export function formatWeekRange(weekStart: Date) {
    const weekEnd = addDays(weekStart, 6);

    const startText = weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });

    const endText = weekEnd.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return `${startText} - ${endText}`;
}