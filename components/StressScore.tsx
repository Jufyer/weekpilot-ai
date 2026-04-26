import { CalendarAnalysis } from "@/lib/types";

type Props = {
    analysis: CalendarAnalysis;
};

export function StressScore({ analysis }: Props) {
    const hours = Math.round((analysis.totalScheduledMinutes / 60) * 10) / 10;

    return (
        <div className="rounded-2xl border bg-white p-5 shadow-sm text-slate-950">
            <h2 className="mb-4 text-xl font-semibold">Week load</h2>

            <div className="flex items-end gap-3">
                <p className="text-5xl font-bold">{analysis.loadScore}</p>
                <p className="pb-2 text-gray-500">/ 100</p>
            </div>

            <div className="mt-5 h-3 rounded-full bg-gray-100">
                <div
                    className="h-3 rounded-full bg-black"
                    style={{ width: `${analysis.loadScore}%` }}
                />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-gray-500">Events</p>
                    <p className="text-lg font-semibold">{analysis.totalEvents}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-gray-500">Scheduled</p>
                    <p className="text-lg font-semibold">{hours}h</p>
                </div>

                <div className="col-span-2 rounded-xl bg-gray-50 p-3">
                    <p className="text-gray-500">Busiest day</p>
                    <p className="text-lg font-semibold">
                        {analysis.busiestDay.weekday}
                    </p>
                </div>
            </div>
        </div>
    );
}