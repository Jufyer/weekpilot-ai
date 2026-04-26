export type CalendarEvent = {
    id: string;
    title: string;
    start: string;
    end: string;
    category: "school" | "study" | "sport" | "deadline" | "personal";
    allDay?: boolean;
};

export type FreeSlot = {
    date: string;
    start: string;
    end: string;
    durationMinutes: number;
};

export type DayLoad = {
    date: string;
    weekday: string;
    eventCount: number;
    scheduledMinutes: number;
};

export type CalendarAnalysis = {
    totalEvents: number;
    totalScheduledMinutes: number;
    loadScore: number;
    busiestDay: DayLoad;
    days: DayLoad[];
    freeSlots: FreeSlot[];
};