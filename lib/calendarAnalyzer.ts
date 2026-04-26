import { CalendarAnalysis, CalendarEvent, DayLoad, FreeSlot } from "@/lib/types";

function minutesBetween(start: Date, end: Date) {
    return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

function toDateKey(date: Date) {
    return date.toISOString().split("T")[0];
}

function getWeekday(date: Date) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
}

function getWeekStart(events: CalendarEvent[]) {
    const firstEventDate = new Date(events[0].start);
    const day = firstEventDate.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(firstEventDate);
    monday.setDate(firstEventDate.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    return monday;
}

function getEventsForDay(events: CalendarEvent[], date: Date) {
    const dateKey = toDateKey(date);

    return events.filter((event) => {
        const eventDate = toDateKey(new Date(event.start));
        return eventDate === dateKey;
    });
}

function findFreeSlots(events: CalendarEvent[], weekStart: Date): FreeSlot[] {
    const freeSlots: FreeSlot[] = [];

    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(weekStart);
        currentDay.setDate(weekStart.getDate() + i);

        const dayEvents = getEventsForDay(events, currentDay)
            .map((event) => ({
                start: new Date(event.start),
                end: new Date(event.end),
            }))
            .sort((a, b) => a.start.getTime() - b.start.getTime());

        const studyStart = new Date(currentDay);
        studyStart.setHours(15, 0, 0, 0);

        const studyEnd = new Date(currentDay);
        studyEnd.setHours(21, 0, 0, 0);

        let pointer = studyStart;

        for (const event of dayEvents) {
            if (event.end <= studyStart || event.start >= studyEnd) {
                continue;
            }

            if (event.start > pointer) {
                const duration = minutesBetween(pointer, event.start);

                if (duration >= 45) {
                    freeSlots.push({
                        date: toDateKey(currentDay),
                        start: pointer.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        end: event.start.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        durationMinutes: duration,
                    });
                }
            }

            if (event.end > pointer) {
                pointer = event.end;
            }
        }

        if (pointer < studyEnd) {
            const duration = minutesBetween(pointer, studyEnd);

            if (duration >= 45) {
                freeSlots.push({
                    date: toDateKey(currentDay),
                    start: pointer.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    end: studyEnd.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    durationMinutes: duration,
                });
            }
        }
    }

    return freeSlots;
}

export function analyzeCalendar(events: CalendarEvent[]): CalendarAnalysis {
    const weekStart = getWeekStart(events);

    const days: DayLoad[] = [];

    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(weekStart);
        currentDay.setDate(weekStart.getDate() + i);

        const dayEvents = getEventsForDay(events, currentDay);

        const scheduledMinutes = dayEvents.reduce((sum, event) => {
            return sum + minutesBetween(new Date(event.start), new Date(event.end));
        }, 0);

        days.push({
            date: toDateKey(currentDay),
            weekday: getWeekday(currentDay),
            eventCount: dayEvents.length,
            scheduledMinutes,
        });
    }

    const totalScheduledMinutes = days.reduce(
        (sum, day) => sum + day.scheduledMinutes,
        0
    );

    const busiestDay = days.reduce((max, day) => {
        return day.scheduledMinutes > max.scheduledMinutes ? day : max;
    }, days[0]);

    const freeSlots = findFreeSlots(events, weekStart);

    const totalHours = totalScheduledMinutes / 60;

    const loadScore = Math.min(
        100,
        Math.max(0, Math.round(totalHours * 5 + events.length * 3 - freeSlots.length * 2))
    );

    return {
        totalEvents: events.length,
        totalScheduledMinutes,
        loadScore,
        busiestDay,
        days,
        freeSlots,
    };
}