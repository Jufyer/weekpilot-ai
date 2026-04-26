import { AvailabilitySettings, CalendarEvent } from "@/lib/types";
import { addDays } from "@/lib/dateUtils";

function setTime(date: Date, time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    const copy = new Date(date);
    copy.setHours(hours, minutes, 0, 0);
    return copy;
}

export function expandAvailabilityToEvents(
    weekStart: Date,
    settings: AvailabilitySettings
): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    for (let i = 0; i < 7; i++) {
        const currentDay = addDays(weekStart, i);
        const weekday = currentDay.getDay();

        const matchingBlocks = settings.recurringBlocks.filter(
            (block) => block.weekday === weekday
        );

        for (const block of matchingBlocks) {
            const start = setTime(currentDay, block.startTime);
            let end = setTime(currentDay, block.endTime);

            if (end <= start) {
                end = addDays(end, 1);
            }

            events.push({
                id: `manual-${block.id}-${currentDay.toISOString()}`,
                title: block.title,
                start: start.toISOString(),
                end: end.toISOString(),
                category:
                    block.category === "training"
                        ? "sport"
                        : block.category === "fixed"
                            ? "personal"
                            : "personal",
            });
        }
    }

    return events;
}