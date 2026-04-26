import { WeekWarning } from "@/lib/warnings";

type Props = {
    warnings: WeekWarning[];
};

const toneClasses: Record<WeekWarning["severity"], string> = {
    high: "bg-red-100 text-red-950",
    medium: "bg-amber-100 text-amber-950",
    low: "bg-slate-200 text-slate-900",
};

export function ConflictWarnings({ warnings }: Props) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm">
            <div className="mb-4">
                <h2 className="text-xl font-semibold">Conflict warnings</h2>
                <p className="mt-1 text-sm text-slate-600">
                    Risks detected from events, availability, and planned study blocks.
                </p>
            </div>

            {warnings.length === 0 ? (
                <p className="rounded-xl bg-emerald-100 p-3 text-sm font-medium text-emerald-950">
                    Great news: no major conflicts detected for this week.
                </p>
            ) : (
                <ul className="space-y-3">
                    {warnings.map((warning) => (
                        <li key={warning.id} className="rounded-xl bg-slate-50 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-semibold">{warning.title}</p>
                                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${toneClasses[warning.severity]}`}>
                                    {warning.severity}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-700">{warning.message}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
