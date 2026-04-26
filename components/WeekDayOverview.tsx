import { DayLoad, FreeSlot } from "@/lib/types";

type DayOverviewItem = {
    date: string;
    weekday: string;
    eventCount: number;
    plannedHours: number;
    freeSlotCount: number;
    status: "Overloaded" | "Good for study" | "Light day";
};

type Props = {
    days: DayLoad[];
    freeSlots: FreeSlot[];
};

export function WeekDayOverview({ days, freeSlots }: Props) {
    const freeByDay = freeSlots.reduce<Record<string, { count: number; minutes: number }>>(
        (acc, slot) => {
            const current = acc[slot.date] ?? { count: 0, minutes: 0 };
            acc[slot.date] = {
                count: current.count + 1,
                minutes: current.minutes + slot.durationMinutes,
            };
            return acc;
        },
        {}
    );

    const dayItems: DayOverviewItem[] = days.map((day) => {
        const free = freeByDay[day.date] ?? { count: 0, minutes: 0 };

        let status: DayOverviewItem["status"] = "Light day";

        if (day.scheduledMinutes >= 8 * 60 || day.eventCount >= 6) {
            status = "Overloaded";
        } else if (free.count >= 2 || free.minutes >= 180) {
            status = "Good for study";
        }

        return {
            date: day.date,
            weekday: day.weekday,
            eventCount: day.eventCount,
            plannedHours: Math.round((day.scheduledMinutes / 60) * 10) / 10,
            freeSlotCount: free.count,
            status,
        };
    });

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm lg:col-span-3">
            <div className="mb-4">
                <h2 className="text-xl font-semibold">Weekly day overview</h2>
                <p className="mt-1 text-sm text-slate-600">
                    Compact day-by-day view for events, workload, and study opportunities.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {dayItems.map((day) => (
                    <div key={day.date} className="rounded-xl bg-slate-50 p-4">
                        <p className="font-semibold text-slate-900">{day.weekday}</p>
                        <p className="text-xs text-slate-500">{day.date}</p>

                        <div className="mt-2 space-y-1 text-sm text-slate-700">
                            <p>Events: {day.eventCount}</p>
                            <p>Planned: {day.plannedHours}h</p>
                            <p>Free slots: {day.freeSlotCount}</p>
                        </div>

                        <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900">
                            {day.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
