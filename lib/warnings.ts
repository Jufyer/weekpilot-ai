import { CalendarAnalysis, CalendarEvent, PlannedStudySuggestion } from "@/lib/types";
import { addDays } from "@/lib/dateUtils";

export type WarningType =
    | "no-study-before-deadline"
    | "no-study-before-exam"
    | "overloaded-day"
    | "too-many-evening-commitments"
    | "too-few-study-opportunities";

export type WeekWarning = {
    id: string;
    type: WarningType;
    title: string;
    message: string;
    severity: "low" | "medium" | "high";
};

type WarningInput = {
    events: CalendarEvent[];
    analysis: CalendarAnalysis;
    plannedSuggestions: PlannedStudySuggestion[];
    weekStart: Date;
};

function startOfDay(date: Date) {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

function toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function dayLabel(date: Date) {
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

function isExamEvent(event: CalendarEvent) {
    return /\b(exam|klausur|test|quiz)\b/i.test(event.title);
}

function isStudyEvent(event: CalendarEvent) {
    return event.category === "study" || /\bstudy\b/i.test(event.title);
}

function hasStudyBlockBefore(moment: Date, studyBlocks: Array<{ start: Date; end: Date }>) {
    return studyBlocks.some((block) => block.end <= moment);
}

export function buildWeekWarnings({
    events,
    analysis,
    plannedSuggestions,
    weekStart,
}: WarningInput): WeekWarning[] {
    const warnings: WeekWarning[] = [];
    const weekEnd = addDays(weekStart, 7);

    const eventsInWeek = events.filter((event) => {
        const start = new Date(event.start);
        return start >= weekStart && start < weekEnd;
    });

    const studyBlocks = [
        ...eventsInWeek.filter(isStudyEvent).map((event) => ({
            start: new Date(event.start),
            end: new Date(event.end),
        })),
        ...plannedSuggestions.map((suggestion) => ({
            start: new Date(suggestion.startIso),
            end: new Date(suggestion.endIso),
        })),
    ];

    const deadlineEvents = eventsInWeek.filter((event) => event.category === "deadline");

    for (const deadline of deadlineEvents) {
        const deadlineStart = new Date(deadline.start);
        if (!hasStudyBlockBefore(deadlineStart, studyBlocks)) {
            warnings.push({
                id: `deadline-${deadline.id}`,
                type: "no-study-before-deadline",
                title: "No study block before deadline",
                message: `${deadline.title} (${dayLabel(deadlineStart)}) has no study session scheduled before it.`,
                severity: "high",
            });
        }
    }

    const examEvents = eventsInWeek.filter(isExamEvent);

    for (const exam of examEvents) {
        const examStart = new Date(exam.start);
        if (!hasStudyBlockBefore(examStart, studyBlocks)) {
            warnings.push({
                id: `exam-${exam.id}`,
                type: "no-study-before-exam",
                title: "No study block before exam",
                message: `${exam.title} (${dayLabel(examStart)}) has no prep session planned before it.`,
                severity: "high",
            });
        }
    }

    const overloadedDays = analysis.days.filter(
        (day) => day.scheduledMinutes >= 8 * 60 || day.eventCount >= 6
    );

    for (const day of overloadedDays) {
        warnings.push({
            id: `overloaded-${day.date}`,
            type: "overloaded-day",
            title: "Overloaded day",
            message: `${day.weekday} has ${Math.round(day.scheduledMinutes / 60)}h scheduled across ${day.eventCount} events.`,
            severity: "medium",
        });
    }

    const eveningCommitments = eventsInWeek.filter((event) => {
        const start = new Date(event.start);
        const hour = start.getHours();
        return !event.allDay && hour >= 18;
    });

    if (eveningCommitments.length >= 4) {
        warnings.push({
            id: "evening-commitments",
            type: "too-many-evening-commitments",
            title: "Too many evening commitments",
            message: `You have ${eveningCommitments.length} evening commitments this week, which can reduce recovery time.`,
            severity: "medium",
        });
    }

    const totalFreeMinutes = analysis.freeSlots.reduce(
        (sum, slot) => sum + slot.durationMinutes,
        0
    );

    if (analysis.freeSlots.length < 3 || totalFreeMinutes < 180) {
        warnings.push({
            id: "few-opportunities",
            type: "too-few-study-opportunities",
            title: "Too few study opportunities this week",
            message: `Only ${analysis.freeSlots.length} suitable free slots found (${Math.round(totalFreeMinutes / 60)}h total).`,
            severity: "medium",
        });
    }

    const unique = new Map<string, WeekWarning>();
    for (const warning of warnings) {
        unique.set(warning.id, warning);
    }

    return [...unique.values()].sort((a, b) => {
        const severityScore = { high: 3, medium: 2, low: 1 };
        return severityScore[b.severity] - severityScore[a.severity];
    });
}

export function extractCriticalDates(events: CalendarEvent[], weekStart: Date) {
    const weekEnd = addDays(weekStart, 7);

    return events
        .filter((event) => {
            const start = new Date(event.start);
            const isCritical = event.category === "deadline" || isExamEvent(event);
            return isCritical && start >= weekStart && start < weekEnd;
        })
        .map((event) => startOfDay(new Date(event.start)))
        .reduce<string[]>((acc, date) => {
            const key = toDateKey(date);
            if (!acc.includes(key)) {
                acc.push(key);
            }
            return acc;
        }, []);
}
