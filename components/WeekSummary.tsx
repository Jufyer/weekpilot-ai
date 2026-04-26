import { CalendarAnalysis } from "@/lib/types";

type Props = {
    analysis: CalendarAnalysis;
    aiSummary?: string;
    loading?: boolean;
};

export function WeekSummary({ analysis, aiSummary, loading }: Props) {
    const hours = Math.round((analysis.totalScheduledMinutes / 60) * 10) / 10;

    return (
        <div className="rounded-2xl border bg-white p-5 text-slate-950 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">AI week summary</h2>

            {loading ? (
                <p className="leading-7 text-slate-700">Generating weekly summary...</p>
            ) : aiSummary ? (
                <p className="leading-7 text-slate-700">{aiSummary}</p>
            ) : (
                <>
                    <p className="leading-7 text-slate-700">
                        This week contains <strong>{analysis.totalEvents}</strong> events
                        with around <strong>{hours}</strong> scheduled hours. Your busiest
                        day is <strong>{analysis.busiestDay.weekday}</strong>. WeekPilot
                        found <strong>{analysis.freeSlots.length}</strong> possible study
                        slots in the afternoon and evening. Your current week load score is{" "}
                        <strong>{analysis.loadScore}/100</strong>.
                    </p>

                    <p className="mt-4 leading-7 text-slate-700">
                        Recommendation: Use one of the longer free slots early in the week
                        for focused study, especially before deadline-heavy days.
                    </p>
                </>
            )}
        </div>
    );
}