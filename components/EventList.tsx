import { CalendarEvent } from "@/lib/types";

type Props = {
    events: CalendarEvent[];
};

export function EventList({ events }: Props) {
    return (
        <div className="rounded-2xl border bg-white p-5 shadow-sm text-slate-950">
            <h2 className="mb-4 text-xl font-semibold">Upcoming events</h2>

            {events.length === 0 ? (
                <p className="text-gray-500">No upcoming events found.</p>
            ) : (
                <div className="space-y-3">
                    {events.map((event) => {
                        const start = new Date(event.start);
                        const end = new Date(event.end);

                        return (
                            <div key={event.id} className="rounded-xl bg-gray-50 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium">{event.title}</p>

                                        <p className="text-sm text-gray-500">
                                            {start.toLocaleDateString("en-US", {
                                                weekday: "short",
                                                month: "short",
                                                day: "numeric",
                                            })}{" "}
                                            ·{" "}
                                            {event.allDay
                                                ? "All-day"
                                                : `${start.toLocaleTimeString("en-US", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })} - ${end.toLocaleTimeString("en-US", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}`}
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-black px-3 py-1 text-xs text-white">
                                        {event.category}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}