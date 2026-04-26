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
    startIso: string;
    endIso: string;
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

export type AiProvider = "ollama" | "openai" | "deepseek";

export type StructuredAiSummary = {
    overview: string;
    risks: string[];
    studyPlan: string[];
    recommendation: string;
    provider: AiProvider | "fallback";
    model: string;
};


export type RecurringBlock = {
    id: string;
    title: string;
    weekday: number; // 0 = Sunday, 1 = Monday ...
    startTime: string; // "18:00"
    endTime: string;   // "19:30"
    category: "training" | "fixed" | "personal";
};

export type AvailabilitySettings = {
    sleepStart: string; // z.B. "23:00"
    sleepEnd: string;   // z.B. "07:00"
    recurringBlocks: RecurringBlock[];
};

export type StudyTimeDraft = {
    title: string;
    description?: string;
    startIso: string;
    endIso: string;
};

export type PlannedStudySuggestion = {
    id: string;
    title: string;
    description: string;
    startIso: string;
    endIso: string;
    durationMinutes: number;
};