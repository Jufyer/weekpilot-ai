type Props = {
    loadScore: number;
    freeStudySlots: number;
    warningsCount: number;
    plannedStudyBlocks: number;
};

const items = [
    {
        key: "load",
        label: "Load Score",
        suffix: "/100",
    },
    {
        key: "free",
        label: "Free Study Slots",
        suffix: "",
    },
    {
        key: "warnings",
        label: "Warnings",
        suffix: "",
    },
    {
        key: "planned",
        label: "Planned Study Blocks",
        suffix: "",
    },
] as const;

export function KpiStrip({
    loadScore,
    freeStudySlots,
    warningsCount,
    plannedStudyBlocks,
}: Props) {
    const valueByKey = {
        load: loadScore,
        free: freeStudySlots,
        warnings: warningsCount,
        planned: plannedStudyBlocks,
    } as const;

    return (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
                <div
                    key={item.key}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 shadow-sm"
                >
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                        {valueByKey[item.key]}
                        <span className="text-base font-semibold text-slate-500">
                            {item.suffix}
                        </span>
                    </p>
                </div>
            ))}
        </div>
    );
}
