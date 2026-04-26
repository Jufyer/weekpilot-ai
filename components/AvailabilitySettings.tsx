"use client";

import type {
    AvailabilitySettings as AvailabilitySettingsType,
    RecurringBlock,
} from "@/lib/types";

type Props = {
    settings: AvailabilitySettingsType;
    onChange: (settings: AvailabilitySettingsType) => void;
};

const weekdays = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
];

export function AvailabilitySettings({ settings, onChange }: Props) {
    function updateBlock(id: string, patch: Partial<RecurringBlock>) {
        onChange({
            ...settings,
            recurringBlocks: settings.recurringBlocks.map((block) =>
                block.id === id ? { ...block, ...patch } : block
            ),
        });
    }

    function addBlock() {
        const newBlock: RecurringBlock = {
            id: crypto.randomUUID(),
            title: "Karate training",
            weekday: 2,
            startTime: "18:00",
            endTime: "19:30",
            category: "training",
        };

        onChange({
            ...settings,
            recurringBlocks: [...settings.recurringBlocks, newBlock],
        });
    }

    function removeBlock(id: string) {
        onChange({
            ...settings,
            recurringBlocks: settings.recurringBlocks.filter((block) => block.id !== id),
        });
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm">
            <div className="mb-4">
                <h2 className="text-xl font-semibold">Availability settings</h2>
                <p className="mt-1 text-sm text-slate-600">
                    Add sleep times and recurring offline commitments that are not stored in your calendar.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Sleep start</span>
                    <input
                        type="time"
                        value={settings.sleepStart}
                        onChange={(event) =>
                            onChange({ ...settings, sleepStart: event.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Wake up</span>
                    <input
                        type="time"
                        value={settings.sleepEnd}
                        onChange={(event) =>
                            onChange({ ...settings, sleepEnd: event.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                    />
                </label>
            </div>

            <div className="mt-5 space-y-3">
                {settings.recurringBlocks.map((block) => (
                    <div
                        key={block.id}
                        className="grid gap-2 rounded-xl bg-slate-50 p-4 md:grid-cols-5"
                    >
                        <input
                            value={block.title}
                            onChange={(event) =>
                                updateBlock(block.id, { title: event.target.value })
                            }
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2"
                            placeholder="Title"
                        />

                        <select
                            value={block.weekday}
                            onChange={(event) =>
                                updateBlock(block.id, { weekday: Number(event.target.value) })
                            }
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2"
                        >
                            {weekdays.map((day) => (
                                <option key={day.value} value={day.value}>
                                    {day.label}
                                </option>
                            ))}
                        </select>

                        <input
                            type="time"
                            value={block.startTime}
                            onChange={(event) =>
                                updateBlock(block.id, { startTime: event.target.value })
                            }
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2"
                        />

                        <input
                            type="time"
                            value={block.endTime}
                            onChange={(event) =>
                                updateBlock(block.id, { endTime: event.target.value })
                            }
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2"
                        />

                        <button
                            onClick={() => removeBlock(block.id)}
                            className="rounded-xl border border-red-300 bg-white px-3 py-2 font-semibold text-red-700"
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-4">
                <button
                    onClick={addBlock}
                    className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
                >
                    Add recurring block
                </button>
            </div>
        </div>
    );
}