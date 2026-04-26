import { FreeSlot, PlannedStudySuggestion } from "@/lib/types";

function dayPriority(date: string) {
    const day = new Date(date).getDay();
    return day === 0 ? 7 : day;
}

export function generateStudySuggestions(
    slots: FreeSlot[],
    maxSuggestions = 4
): PlannedStudySuggestion[] {
    const rankedSlots = [...slots]
        .filter((slot) => slot.durationMinutes >= 45)
        .sort((a, b) => {
            const scoreA = a.durationMinutes - dayPriority(a.date) * 8;
            const scoreB = b.durationMinutes - dayPriority(b.date) * 8;
            return scoreB - scoreA;
        })
        .slice(0, maxSuggestions);

    return rankedSlots.map((slot, index) => {
        const start = new Date(slot.startIso);
        const end = new Date(slot.endIso);

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