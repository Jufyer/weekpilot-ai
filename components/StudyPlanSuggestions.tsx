"use client";

import { useMemo, useState } from "react";
import type { PlannedStudySuggestion, StudyTimeDraft } from "@/lib/types";

type Props = {
  suggestions: PlannedStudySuggestion[];
  addedSuggestionIds?: string[];
  addingSuggestionId?: string | null;
  addingAll?: boolean;
  onAddOne: (draft: StudyTimeDraft, suggestionId: string) => void;
  onAddAll: (
    drafts: Array<{ suggestionId: string; draft: StudyTimeDraft }>
  ) => void;
};

type EditableSuggestion = {
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
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

function isoToLocalTime(iso: string) {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(date: string, time: string) {
  return new Date(`${date}T${time}`).toISOString();
}

function toDraft(suggestion: PlannedStudySuggestion): EditableSuggestion {
  return {
    title: suggestion.title,
    description: suggestion.description,
    date: isoToLocalDate(suggestion.startIso),
    startTime: isoToLocalTime(suggestion.startIso),
    endTime: isoToLocalTime(suggestion.endIso),
  };
}

export function StudyPlanSuggestions({
  suggestions,
  addedSuggestionIds = [],
  addingSuggestionId,
  addingAll,
  onAddOne,
  onAddAll,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    suggestions.map((suggestion) => suggestion.id)
  );
  const [drafts, setDrafts] = useState<Record<string, EditableSuggestion>>({});

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  function getDraft(suggestion: PlannedStudySuggestion) {
    return drafts[suggestion.id] ?? toDraft(suggestion);
  }

  function updateDraft(id: string, patch: Partial<EditableSuggestion>) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? {
          title: "Study time",
          description: "Suggested by WeekPilot AI",
          date: "",
          startTime: "",
          endTime: "",
        }),
        ...patch,
      },
    }));
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  function selectAll() {
    setSelectedIds(suggestions.map((suggestion) => suggestion.id));
  }

  function selectNone() {
    setSelectedIds([]);
  }

  function startEditing(suggestion: PlannedStudySuggestion) {
    setDrafts((current) => ({
      ...current,
      [suggestion.id]: current[suggestion.id] ?? toDraft(suggestion),
    }));
    setEditingId(suggestion.id);
  }

  function stopEditing() {
    setEditingId(null);
  }

  function buildStudyDraft(suggestion: PlannedStudySuggestion): StudyTimeDraft {
    const draft = getDraft(suggestion);

    return {
      title: draft.title.trim() || "Study time",
      description: draft.description.trim() || "Suggested by WeekPilot AI",
      startIso: toIso(draft.date, draft.startTime),
      endIso: toIso(draft.date, draft.endTime),
    };
  }

  function handleAddOne(suggestion: PlannedStudySuggestion) {
    if (addedSuggestionIds.includes(suggestion.id)) {
      return;
    }

    const draft = buildStudyDraft(suggestion);

    if (new Date(draft.endIso) <= new Date(draft.startIso)) {
      return;
    }

    onAddOne(draft, suggestion.id);
  }

  function handleAddAll() {
    const payload = suggestions
      .filter(
        (suggestion) =>
          selectedIdSet.has(suggestion.id) &&
          !addedSuggestionIds.includes(suggestion.id)
      )
      .map((suggestion) => ({
        suggestionId: suggestion.id,
        draft: buildStudyDraft(suggestion),
      }))
      .filter(({ draft }) => new Date(draft.endIso) > new Date(draft.startIso));

    if (payload.length === 0) {
      return;
    }

    onAddAll(payload);
  }

  const selectedActiveCount = suggestions.filter(
    (suggestion) =>
      selectedIdSet.has(suggestion.id) &&
      !addedSuggestionIds.includes(suggestion.id)
  ).length;

  const hasAnySelected = selectedActiveCount > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Auto-planned study blocks</h2>
          <p className="mt-1 text-sm text-slate-600">
            Review and adjust WeekPilot&apos;s suggested study sessions before
            adding them to Google Calendar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={selectAll}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
          >
            Select all
          </button>

          <button
            onClick={selectNone}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
          >
            Select none
          </button>

          <button
            onClick={handleAddAll}
            disabled={addingAll || !hasAnySelected}
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400"
          >
            {addingAll ? "Adding all..." : `Add selected (${selectedActiveCount})`}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {suggestions.map((suggestion) => {
          const isEditing = editingId === suggestion.id;
          const draft = getDraft(suggestion);

          const previewStartIso = toIso(draft.date, draft.startTime);
          const previewEndIso = toIso(draft.date, draft.endTime);
          const previewStart = new Date(previewStartIso);
          const previewEnd = new Date(previewEndIso);

          const invalidDate =
            Number.isNaN(previewStart.getTime()) ||
            Number.isNaN(previewEnd.getTime());
          const invalidRange = invalidDate || previewEnd <= previewStart;

          const isAdded = addedSuggestionIds.includes(suggestion.id);
          const originalDraft = toDraft(suggestion);
          const isEdited =
            draft.title !== originalDraft.title ||
            draft.description !== originalDraft.description ||
            draft.date !== originalDraft.date ||
            draft.startTime !== originalDraft.startTime ||
            draft.endTime !== originalDraft.endTime;

          const previewMinutes = Math.max(
            0,
            Math.round(
              (new Date(previewEndIso).getTime() -
                new Date(previewStartIso).getTime()) /
                60000
            )
          );

          return (
            <div key={suggestion.id} className="rounded-xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIdSet.has(suggestion.id)}
                  onChange={() => toggleSelected(suggestion.id)}
                  className="mt-1 h-4 w-4"
                />

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{draft.title}</p>

                    {!isAdded && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-900">
                        New
                      </span>
                    )}

                    {isAdded && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                        Added
                      </span>
                    )}

                    {isEdited && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                        Edited
                      </span>
                    )}

                    {selectedIdSet.has(suggestion.id) && (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-900">
                        Selected
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600">
                    {draft.date} · {draft.startTime} - {draft.endTime} ·{" "}
                    {previewMinutes} min
                  </p>
                </div>
              </div>

              {isEditing && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="block md:col-span-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Title
                    </span>
                    <input
                      value={draft.title}
                      onChange={(event) =>
                        updateDraft(suggestion.id, {
                          title: event.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
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
                        updateDraft(suggestion.id, {
                          date: event.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
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
                          updateDraft(suggestion.id, {
                            startTime: event.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
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
                          updateDraft(suggestion.id, {
                            endTime: event.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
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
                        updateDraft(suggestion.id, {
                          description: event.target.value,
                        })
                      }
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
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
                        {invalidDate
                          ? "Please enter a valid date and time."
                          : "End time must be after start time."}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    isEditing ? stopEditing() : startEditing(suggestion)
                  }
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                >
                  {isEditing ? "Cancel edit" : "Edit"}
                </button>

                <button
                  onClick={() => handleAddOne(suggestion)}
                  disabled={
                    addingSuggestionId === suggestion.id ||
                    invalidRange ||
                    isAdded
                  }
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
                >
                  {isAdded
                    ? "Added"
                    : addingSuggestionId === suggestion.id
                      ? "Adding..."
                      : "Add this block"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}