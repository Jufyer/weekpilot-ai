import { CalendarEvent, FreeSlot, PlannedStudySuggestion } from "@/lib/types";
import { extractCriticalDates } from "@/lib/warnings";

type PlannerOptions = {
    events?: CalendarEvent[];
    weekStart?: Date;
};

function dayPriority(date: string) {
    const day = new Date(date).getDay();
    return day === 0 ? 7 : day;
}

export function generateStudySuggestions(
    slots: FreeSlot[],
    maxSuggestions = 4,
    options?: PlannerOptions
): PlannedStudySuggestion[] {
    const boundedMax = Math.min(4, Math.max(2, maxSuggestions));
    const criticalDateKeys =
        options?.events && options?.weekStart
            ? extractCriticalDates(options.events, options.weekStart)
            : [];

    const pickedByDay = new Map<string, number>();

    function scoreSlot(slot: FreeSlot) {
        const day = dayPriority(slot.date);
        const base = slot.durationMinutes * 1.15 - day * 7;

        const slotDay = new Date(`${slot.date}T00:00:00`);

        const criticalBonus = criticalDateKeys.reduce((best, key) => {
            const criticalDay = new Date(`${key}T00:00:00`);
            const diffDays = Math.round(
                (criticalDay.getTime() - slotDay.getTime()) / (24 * 60 * 60 * 1000)
            );

            if (diffDays < 0 || diffDays > 2) {
                return best;
            }

            if (diffDays === 0) return Math.max(best, 12);
            if (diffDays === 1) return Math.max(best, 28);
            return Math.max(best, 18);
        }, 0);

        const alreadyOnDay = pickedByDay.get(slot.date) ?? 0;
        const spreadPenalty = alreadyOnDay * 30;

        return base + criticalBonus - spreadPenalty;
    }

    const candidates = [...slots].filter((slot) => slot.durationMinutes >= 45);
    const rankedSlots: FreeSlot[] = [];

    while (rankedSlots.length < boundedMax && candidates.length > 0) {
        candidates.sort((a, b) => scoreSlot(b) - scoreSlot(a));
        const best = candidates.shift();

        if (!best) {
            break;
        }

        const perDay = pickedByDay.get(best.date) ?? 0;
        const tooManyForDay = perDay >= 2 && candidates.some((slot) => slot.date !== best.date);

        if (tooManyForDay) {
            continue;
        }

        rankedSlots.push(best);
        pickedByDay.set(best.date, perDay + 1);
    }

    return rankedSlots.map((slot, index) => {
        const start = new Date(slot.startIso);
        const durationMinutes = Math.min(
            slot.durationMinutes >= 120 ? 90 : slot.durationMinutes,
            120
        );

        const adjustedEnd = new Date(start.getTime() + durationMinutes * 60000);

        return {
            id: `${slot.startIso}-${slot.endIso}-${index}`,
            title: "Study time",
            description: "Suggested by WeekPilot AI",
            startIso: start.toISOString(),
            endIso: adjustedEnd.toISOString(),
            durationMinutes,
        };
    });
}
