import { CalendarAnalysis } from "@/lib/types";

type Props = {
    analysis: CalendarAnalysis;
};

export function WeekSummary({ analysis }: Props) {
    const hours = Math.round((analysis.totalScheduledMinutes / 60) * 10) / 10;

    return (
        <div className="rounded-2xl border bg-white p-5 shadow-sm text-slate-950">
            <h2 className="mb-4 text-xl font-semibold">AI week summary</h2>

            <p className="leading-7 text-gray-700">
                This week contains <strong>{analysis.totalEvents}</strong> events with
                around <strong>{hours}</strong> scheduled hours. Your busiest day is{" "}
                <strong>{analysis.busiestDay.weekday}</strong>. WeekPilot found{" "}
                <strong>{analysis.freeSlots.length}</strong> possible study slots in
                the afternoon and evening. Your current week load score is{" "}
                <strong>{analysis.loadScore}/100</strong>.
            </p>

            <p className="mt-4 leading-7 text-gray-700">
                Recommendation: Use one of the longer free slots early in the week for
                focused study, especially before deadline-heavy days.
            </p>
        </div>
    );
}