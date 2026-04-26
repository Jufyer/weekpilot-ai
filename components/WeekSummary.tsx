import { CalendarAnalysis, StructuredAiSummary } from "@/lib/types";

type Props = {
    analysis: CalendarAnalysis;
    aiSummary?: StructuredAiSummary;
    loading?: boolean;
    error?: string | null;
};

export function WeekSummary({ analysis, aiSummary, loading, error }: Props) {
    const hours = Math.round((analysis.totalScheduledMinutes / 60) * 10) / 10;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm">
            <div className="mb-4 flex flex-col gap-1">
                <h2 className="text-xl font-semibold">AI week summary</h2>

                {aiSummary && (
                    <p className="text-sm text-slate-600">
                        Generated with {aiSummary.provider} · {aiSummary.model}
                    </p>
                )}
            </div>

            {loading && (
                <p className="leading-7 text-slate-700">Generating weekly summary...</p>
            )}

            {!loading && error && (
                <p className="rounded-xl bg-red-100 p-4 text-sm font-medium text-red-950">
                    {error}
                </p>
            )}

            {!loading && aiSummary && (
                <div className="space-y-4">
                    <section className="rounded-xl bg-slate-50 p-4">
                        <h3 className="font-semibold text-slate-950">Week overview</h3>
                        <p className="mt-2 leading-7 text-slate-700">{aiSummary.overview}</p>
                    </section>

                    <section className="rounded-xl bg-slate-50 p-4">
                        <h3 className="font-semibold text-slate-950">Main risks</h3>
                        <ul className="mt-2 list-disc space-y-2 pl-5 text-slate-700">
                            {aiSummary.risks.length > 0 ? (
                                aiSummary.risks.map((risk, index) => (
                                    <li key={index}>{risk}</li>
                                ))
                            ) : (
                                <li>No major risks detected.</li>
                            )}
                        </ul>
                    </section>

                    <section className="rounded-xl bg-slate-50 p-4">
                        <h3 className="font-semibold text-slate-950">Suggested study plan</h3>
                        <ol className="mt-2 list-decimal space-y-2 pl-5 text-slate-700">
                            {aiSummary.studyPlan.length > 0 ? (
                                aiSummary.studyPlan.map((step, index) => (
                                    <li key={index}>{step}</li>
                                ))
                            ) : (
                                <li>Use your longest free slot for focused study.</li>
                            )}
                        </ol>
                    </section>

                    <section className="rounded-xl bg-slate-900 p-4 text-white">
                        <h3 className="font-semibold">Final recommendation</h3>
                        <p className="mt-2 leading-7 text-slate-100">
                            {aiSummary.recommendation}
                        </p>
                    </section>
                </div>
            )}

            {!loading && !aiSummary && !error && (
                <div className="space-y-4">
                    <p className="leading-7 text-slate-700">
                        This week contains <strong>{analysis.totalEvents}</strong> events
                        with around <strong>{hours}</strong> scheduled hours. Your busiest
                        day is <strong>{analysis.busiestDay.weekday}</strong>. WeekPilot
                        found <strong>{analysis.freeSlots.length}</strong> possible study
                        slots. Your current week load score is{" "}
                        <strong>{analysis.loadScore}/100</strong>.
                    </p>

                    <p className="text-sm text-slate-600">
                        Click “Generate AI summary” to create a structured weekly plan.
                    </p>
                </div>
            )}
        </div>
    );
}