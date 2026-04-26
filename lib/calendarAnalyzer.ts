import { AvailabilitySettings, CalendarAnalysis, CalendarEvent, DayLoad, FreeSlot } from "@/lib/types";
import { addDays, getMonday } from "@/lib/dateUtils";

function minutesBetween(start: Date, end: Date) {
    return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

function toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getWeekday(date: Date) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
}

function getWeekStart(events: CalendarEvent[], selectedWeekStart?: Date) {
    if (selectedWeekStart) {
        return getMonday(selectedWeekStart);
    }

    if (events.length === 0) {
        return getMonday(new Date());
    }

    return getMonday(new Date(events[0].start));
}

function getEventsInWeek(events: CalendarEvent[], weekStart: Date) {
    const weekEnd = addDays(weekStart, 7);

    return events.filter((event) => {
        const eventStart = new Date(event.start);

        return eventStart >= weekStart && eventStart < weekEnd;
    });
}

function getEventsForDay(events: CalendarEvent[], date: Date) {
    const dateKey = toDateKey(date);

    return events.filter((event) => {
        const eventDate = toDateKey(new Date(event.start));
        return eventDate === dateKey;
    });
}

function findFreeSlots(
    events: CalendarEvent[],
    weekStart: Date,
    settings?: AvailabilitySettings
): FreeSlot[] {
    const freeSlots: FreeSlot[] = [];

    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(weekStart);
        currentDay.setDate(weekStart.getDate() + i);

        const dayEvents = getEventsForDay(events, currentDay)
            .filter((event) => !event.allDay)
            .map((event) => ({
                start: new Date(event.start),
                end: new Date(event.end),
            }))
            .sort((a, b) => a.start.getTime() - b.start.getTime());

        const wakeTime = settings?.sleepEnd ?? "07:00";
        const sleepTime = settings?.sleepStart ?? "23:00";

        const [wakeHour, wakeMinute] = wakeTime.split(":").map(Number);
        const [sleepHour, sleepMinute] = sleepTime.split(":").map(Number);

        const studyStart = new Date(currentDay);
        studyStart.setHours(wakeHour, wakeMinute, 0, 0);

        const studyEnd = new Date(currentDay);
        studyEnd.setHours(sleepHour, sleepMinute, 0, 0);

        if (studyEnd <= studyStart) {
            studyEnd.setDate(studyEnd.getDate() + 1);
        }

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
                        startIso: pointer.toISOString(),
                        endIso: event.start.toISOString(),
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
                    startIso: pointer.toISOString(),
                    endIso: studyEnd.toISOString(),
                    durationMinutes: duration,
                });
            }
        }
    }

    return freeSlots;
}

export function analyzeCalendar(
    events: CalendarEvent[],
    selectedWeekStart?: Date,
    settings?: AvailabilitySettings
): CalendarAnalysis {
    const weekStart = getWeekStart(events, selectedWeekStart);
    const weekEvents = getEventsInWeek(events, weekStart);

    const days: DayLoad[] = [];

    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(weekStart);
        currentDay.setDate(weekStart.getDate() + i);

        const dayEvents = getEventsForDay(weekEvents, currentDay);

        const scheduledMinutes = dayEvents.reduce((sum, event) => {
            if (event.allDay) {
                return sum;
            }

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

    const freeSlots = findFreeSlots(weekEvents, weekStart, settings);

    const totalHours = totalScheduledMinutes / 60;

    const loadScore = Math.min(
        100,
        Math.max(
            0,
            Math.round(totalHours * 5 + weekEvents.length * 3 - freeSlots.length * 2)
        )
    );

    return {
        totalEvents: weekEvents.length,
        totalScheduledMinutes,
        loadScore,
        busiestDay,
        days,
        freeSlots,
    };
}