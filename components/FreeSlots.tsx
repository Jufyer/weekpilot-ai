import { FreeSlot } from "@/lib/types";

type Props = {
    slots: FreeSlot[];
};

export function FreeSlots({ slots }: Props) {
    return (
        <div className="rounded-2xl border bg-white p-5 shadow-sm text-slate-950">
            <h2 className="mb-4 text-xl font-semibold">Suggested study slots</h2>

            <div className="space-y-3">
                {slots.slice(0, 6).map((slot, index) => (
                    <div key={index} className="rounded-xl bg-gray-50 p-4">
                        <p className="font-medium">{slot.date}</p>
                        <p className="text-sm text-gray-500">
                            {slot.start} - {slot.end} · {slot.durationMinutes} min
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}