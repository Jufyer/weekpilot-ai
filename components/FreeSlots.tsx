"use client";

import { useState } from "react";
import { FreeSlot, StudyTimeDraft } from "@/lib/types";

type Props = {
    slots: FreeSlot[];
    onAddStudySlot?: (draft: StudyTimeDraft, slotId: string) => void;
    addingSlotId?: string | null;
};

type EditableSlotDraft = {
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
};

function pad(value: number) {
    return String(value).padStart(2, "0");
}

function isoToLocalDate(iso: string) {
    const date = new Date(iso);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isoToLocalTime(iso: string) {
    const date = new Date(iso);
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toLocalInputDraft(slot: FreeSlot): EditableSlotDraft {
    return {
        title: "Study time",
        description: "Created by WeekPilot AI",
        date: isoToLocalDate(slot.startIso),
        startTime: isoToLocalTime(slot.startIso),
        endTime: isoToLocalTime(slot.endIso),
    };
}

function toIso(date: string, time: string) {
    return new Date(`${date}T${time}`).toISOString();
}

export function FreeSlots({
    slots,
    onAddStudySlot,
    addingSlotId,
}: Props) {
    const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, EditableSlotDraft>>({});

    function getSlotId(slot: FreeSlot) {
        return `${slot.startIso}-${slot.endIso}`;
    }

    function getDraft(slot: FreeSlot) {
        const slotId = getSlotId(slot);
        return drafts[slotId] ?? toLocalInputDraft(slot);
    }

    function startEditing(slot: FreeSlot) {
        const slotId = getSlotId(slot);

        setDrafts((current) => ({
            ...current,
            [slotId]: current[slotId] ?? toLocalInputDraft(slot),
        }));

        setEditingSlotId(slotId);
    }

    function stopEditing() {
        setEditingSlotId(null);
    }

    function updateDraft(slotId: string, patch: Partial<EditableSlotDraft>) {
        setDrafts((current) => ({
            ...current,
            [slotId]: {
                ...(current[slotId] ?? {
                    title: "Study time",
                    description: "Created by WeekPilot AI",
                    date: "",
                    startTime: "",
                    endTime: "",
                }),
                ...patch,
            },
        }));
    }

    function handleAdd(slot: FreeSlot) {
        if (!onAddStudySlot) {
            return;
        }

        const slotId = getSlotId(slot);
        const draft = getDraft(slot);

        const startIso = toIso(draft.date, draft.startTime);
        const endIso = toIso(draft.date, draft.endTime);

        if (new Date(endIso) <= new Date(startIso)) {
            return;
        }

        onAddStudySlot(
            {
                title: draft.title.trim() || "Study time",
                description: draft.description.trim() || "Created by WeekPilot AI",
                startIso,
                endIso,
            },
            slotId
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Suggested study slots</h2>

            <div className="space-y-3">
                {slots.slice(0, 6).map((slot) => {
                    const slotId = getSlotId(slot);
                    const isEditing = editingSlotId === slotId;
                    const draft = getDraft(slot);

                    const previewStartIso =
                        draft.date && draft.startTime
                            ? toIso(draft.date, draft.startTime)
                            : slot.startIso;

                    const previewEndIso =
                        draft.date && draft.endTime
                            ? toIso(draft.date, draft.endTime)
                            : slot.endIso;

                    const invalidRange =
                        new Date(previewEndIso) <= new Date(previewStartIso);

                    const previewMinutes = Math.max(
                        0,
                        Math.round(
                            (new Date(previewEndIso).getTime() -
                                new Date(previewStartIso).getTime()) /
                            60000
                        )
                    );

                    return (
                        <div key={slotId} className="rounded-xl bg-slate-50 p-4">
                            <p className="font-medium">{slot.date}</p>
                            <p className="text-sm text-slate-600">
                                {slot.start} - {slot.end} · {slot.durationMinutes} min
                            </p>

                            {isEditing && (
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    <label className="block md:col-span-2">
                                        <span className="text-sm font-semibold text-slate-700">
                                            Title
                                        </span>
                                        <input
                                            value={draft.title}
                                            onChange={(event) =>
                                                updateDraft(slotId, { title: event.target.value })
                                            }
                                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="text-sm font-semibold text-slate-700">
                                            Date
                                        </span>
                                        <input
                                            type="date"
                                            value={draft.date}
                                            onChange={(event) =>
                                                updateDraft(slotId, { date: event.target.value })
                                            }
                                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
                                        />
                                    </label>

                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="block">
                                            <span className="text-sm font-semibold text-slate-700">
                                                Start
                                            </span>
                                            <input
                                                type="time"
                                                value={draft.startTime}
                                                onChange={(event) =>
                                                    updateDraft(slotId, { startTime: event.target.value })
                                                }
                                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
                                            />
                                        </label>

                                        <label className="block">
                                            <span className="text-sm font-semibold text-slate-700">
                                                End
                                            </span>
                                            <input
                                                type="time"
                                                value={draft.endTime}
                                                onChange={(event) =>
                                                    updateDraft(slotId, { endTime: event.target.value })
                                                }
                                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
                                            />
                                        </label>
                                    </div>

                                    <label className="block md:col-span-2">
                                        <span className="text-sm font-semibold text-slate-700">
                                            Description
                                        </span>
                                        <textarea
                                            value={draft.description}
                                            onChange={(event) =>
                                                updateDraft(slotId, { description: event.target.value })
                                            }
                                            rows={3}
                                            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950"
                                        />
                                    </label>

                                    <div className="md:col-span-2 rounded-xl bg-white p-3 text-sm text-slate-700">
                                        <p className="font-semibold text-slate-900">Preview</p>
                                        <p className="mt-1">
                                            {draft.date} · {draft.startTime} - {draft.endTime} ·{" "}
                                            {previewMinutes} min
                                        </p>

                                        {invalidRange && (
                                            <p className="mt-2 font-medium text-red-700">
                                                End time must be after start time.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                    onClick={() =>
                                        isEditing ? stopEditing() : startEditing(slot)
                                    }
                                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                                >
                                    {isEditing ? "Cancel edit" : "Edit"}
                                </button>

                                {onAddStudySlot && (
                                    <button
                                        onClick={() => handleAdd(slot)}
                                        disabled={addingSlotId === slotId || invalidRange}
                                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
                                    >
                                        {addingSlotId === slotId
                                            ? "Adding..."
                                            : "Add study time to Google Calendar"}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}