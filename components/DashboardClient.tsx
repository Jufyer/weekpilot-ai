"use client";

import { useEffect, useMemo, useState } from "react";
import { AiSettings } from "@/components/AiSettings";
import { AvailabilitySettings as AvailabilitySettingsCard } from "@/components/AvailabilitySettings";
import { AuthButtons } from "@/components/AuthButtons";
import { EventList } from "@/components/EventList";
import { FreeSlots } from "@/components/FreeSlots";
import { StressScore } from "@/components/StressScore";
import { WeekSummary } from "@/components/WeekSummary";
import { expandAvailabilityToEvents } from "@/lib/availability";
import { analyzeCalendar } from "@/lib/calendarAnalyzer";
import {
    addDays,
    formatWeekRange,
    getDefaultPlanningWeek,
} from "@/lib/dateUtils";
import { demoEvents } from "@/lib/demoEvents";
import type {
    AiProvider,
    AvailabilitySettings as AvailabilitySettingsType,
    CalendarEvent,
    PlannedStudySuggestion,
    StructuredAiSummary,
    StudyTimeDraft,
} from "@/lib/types";
import { StudyPlanSuggestions } from "@/components/StudyPlanSuggestions";
import { generateStudySuggestions } from "@/lib/studyPlanner";

const defaultModelByProvider: Record<AiProvider, string> = {
    ollama: "llama3.2",
    openai: "gpt-4o-mini",
    deepseek: "deepseek-chat",
};

const defaultAvailabilitySettings: AvailabilitySettingsType = {
    sleepStart: "23:00",
    sleepEnd: "07:00",
    recurringBlocks: [],
};

function loadInitialAvailability(): AvailabilitySettingsType {
    if (typeof window === "undefined") {
        return defaultAvailabilitySettings;
    }

    try {
        const saved = window.localStorage.getItem("weekpilot-availability");
        if (!saved) {
            return defaultAvailabilitySettings;
        }

        return JSON.parse(saved) as AvailabilitySettingsType;
    } catch {
        return defaultAvailabilitySettings;
    }
}

export default function DashboardPage() {
    const [events, setEvents] = useState<CalendarEvent[]>(demoEvents);
    const [weekOffset, setWeekOffset] = useState(0);
    const [baseWeekStart] = useState(() => getDefaultPlanningWeek());

    const [loading, setLoading] = useState(true);
    const [usingDemoData, setUsingDemoData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [availabilitySettings, setAvailabilitySettings] =
        useState<AvailabilitySettingsType>(loadInitialAvailability);

    const [aiProvider, setAiProvider] = useState<AiProvider>("ollama");
    const [aiModel, setAiModel] = useState(defaultModelByProvider.ollama);
    const [apiKey, setApiKey] = useState("");

    const [aiSummary, setAiSummary] = useState<StructuredAiSummary | undefined>();
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const [addingSlotId, setAddingSlotId] = useState<string | null>(null);
    const [calendarActionMessage, setCalendarActionMessage] = useState<string | null>(null);
    const [calendarActionError, setCalendarActionError] = useState<string | null>(null);

    const selectedWeekStart = useMemo(() => {
        return addDays(baseWeekStart, weekOffset * 7);
    }, [baseWeekStart, weekOffset]);

    const selectedWeekEnd = useMemo(() => {
        return addDays(selectedWeekStart, 7);
    }, [selectedWeekStart]);

    const [plannedSuggestions, setPlannedSuggestions] = useState<PlannedStudySuggestion[]>([]);
    const [addingSuggestionId, setAddingSuggestionId] = useState<string | null>(null);
    const [addingAllSuggestions, setAddingAllSuggestions] = useState(false);

    useEffect(() => {
        window.localStorage.setItem(
            "weekpilot-availability",
            JSON.stringify(availabilitySettings)
        );
    }, [availabilitySettings]);

    useEffect(() => {
        async function loadCalendar() {
            setLoading(true);
            setError(null);
            setCalendarActionMessage(null);
            setCalendarActionError(null);

            try {
                const params = new URLSearchParams({
                    start: selectedWeekStart.toISOString(),
                    end: selectedWeekEnd.toISOString(),
                });

                const response = await fetch(`/api/calendar?${params.toString()}`);

                if (!response.ok) {
                    throw new Error("Could not load Google Calendar events");
                }

                const data = await response.json();

                setEvents(data.events);
                setUsingDemoData(false);
            } catch {
                setError("Using demo data because Google Calendar could not be loaded.");
                setEvents(demoEvents);
                setUsingDemoData(true);
            } finally {
                setLoading(false);
            }
        }

        loadCalendar();
    }, [selectedWeekStart, selectedWeekEnd]);

    const mergedEvents = useMemo(() => {
        const manualEvents = expandAvailabilityToEvents(
            selectedWeekStart,
            availabilitySettings
        );

        return [...events, ...manualEvents].sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        );
    }, [events, selectedWeekStart, availabilitySettings]);

    const analysis = useMemo(() => {
        return analyzeCalendar(
            mergedEvents,
            selectedWeekStart,
            availabilitySettings
        );
    }, [mergedEvents, selectedWeekStart, availabilitySettings]);

    function resetAiOutput() {
        setAiSummary(undefined);
        setAiError(null);
    }

    function goPreviousWeek() {
        setWeekOffset((value) => value - 1);
        resetAiOutput();
        setPlannedSuggestions([]);
    }

    function goNextWeek() {
        setWeekOffset((value) => value + 1);
        resetAiOutput();
        setPlannedSuggestions([]);
    }

    function goThisWeek() {
        setWeekOffset(0);
        resetAiOutput();
        setPlannedSuggestions([]);
    }

    function handleAvailabilitySettingsChange(next: AvailabilitySettingsType) {
        setAvailabilitySettings(next);
        resetAiOutput();
        setPlannedSuggestions([]);
    }

    function handleProviderChange(provider: AiProvider) {
        setAiProvider(provider);
        setAiModel(defaultModelByProvider[provider]);
        setAiSummary(undefined);
        setAiError(null);
    }

    function handleModelChange(model: string) {
        setAiModel(model);
        resetAiOutput();
    }

    async function generateAiSummary() {
        setAiLoading(true);
        setAiError(null);

        try {
            const response = await fetch("/api/ai-summary", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    events: mergedEvents,
                    analysis,
                    provider: aiProvider,
                    model: aiModel,
                    apiKey,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error ?? "Could not generate summary");
            }

            setAiSummary(data.summary);
        } catch (error) {
            setAiSummary(undefined);
            setAiError(
                error instanceof Error
                    ? error.message
                    : "Could not generate AI summary"
            );
        } finally {
            setAiLoading(false);
        }
    }

    async function refreshCalendarEvents() {
        const params = new URLSearchParams({
            start: selectedWeekStart.toISOString(),
            end: selectedWeekEnd.toISOString(),
        });

        const response = await fetch(`/api/calendar?${params.toString()}`);

        if (!response.ok) {
            throw new Error("Could not refresh calendar");
        }

        const data = await response.json();
        setEvents(data.events);
    }

    function handleAutoPlanWeek() {
        const suggestions = generateStudySuggestions(analysis.freeSlots, 4);
        setPlannedSuggestions(suggestions);
        setCalendarActionMessage(
            suggestions.length > 0
                ? "WeekPilot generated study block suggestions."
                : "No suitable study blocks were found for this week."
        );
        setCalendarActionError(null);
    }

    async function createCalendarEventFromDraft(draft: StudyTimeDraft) {
        const response = await fetch("/api/calendar/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: draft.title,
                startIso: draft.startIso,
                endIso: draft.endIso,
                description: draft.description,
            }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(data?.error ?? "Could not create calendar event");
        }
    }

    async function handleAddOneSuggestion(
        draft: StudyTimeDraft,
        suggestionId: string
    ) {
        setAddingSuggestionId(suggestionId);
        setCalendarActionMessage(null);
        setCalendarActionError(null);

        try {
            await createCalendarEventFromDraft(draft);
            await refreshCalendarEvents();

            setPlannedSuggestions((current) =>
                current.filter((suggestion) => suggestion.id !== suggestionId)
            );

            setCalendarActionMessage("Study block was added to Google Calendar.");
            resetAiOutput();
        } catch (error) {
            setCalendarActionError(
                error instanceof Error
                    ? error.message
                    : "Could not add study block to Google Calendar."
            );
        } finally {
            setAddingSuggestionId(null);
        }
    }

    async function handleAddAllSuggestions(
        drafts: Array<{ suggestionId: string; draft: StudyTimeDraft }>
    ) {
        setAddingAllSuggestions(true);
        setCalendarActionMessage(null);
        setCalendarActionError(null);

        try {
            for (const item of drafts) {
                await createCalendarEventFromDraft(item.draft);
            }

            await refreshCalendarEvents();
            setPlannedSuggestions([]);

            setCalendarActionMessage("Selected study blocks were added to Google Calendar.");
            resetAiOutput();
        } catch (error) {
            setCalendarActionError(
                error instanceof Error
                    ? error.message
                    : "Could not add all study blocks to Google Calendar."
            );
        } finally {
            setAddingAllSuggestions(false);
        }
    }

    async function handleAddStudySlot(draft: StudyTimeDraft, slotId: string) {
        setAddingSlotId(slotId);
        setCalendarActionMessage(null);
        setCalendarActionError(null);

        try {
            const response = await fetch("/api/calendar/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: draft.title,
                    startIso: draft.startIso,
                    endIso: draft.endIso,
                    description: draft.description,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.error ?? "Could not create calendar event");
            }

            const params = new URLSearchParams({
                start: selectedWeekStart.toISOString(),
                end: selectedWeekEnd.toISOString(),
            });

            const refreshResponse = await fetch(`/api/calendar?${params.toString()}`);

            if (!refreshResponse.ok) {
                throw new Error(
                    "Study event was created, but the calendar could not be refreshed."
                );
            }

            const refreshData = await refreshResponse.json();
            setEvents(refreshData.events);
            setCalendarActionMessage("Study time was added to Google Calendar.");
            resetAiOutput();
        } catch (error) {
            setCalendarActionError(
                error instanceof Error
                    ? error.message
                    : "Could not add study time to Google Calendar."
            );
        } finally {
            setAddingSlotId(null);
        }
    }

    return (
        <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-950">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-wide text-slate-600">
                                WeekPilot AI
                            </p>

                            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                                Your smart weekly action plan
                            </h1>

                            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
                                WeekPilot analyzes your calendar, availability, and recurring
                                offline commitments to turn your week into a clear plan.
                            </p>

                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                <button
                                    onClick={goPreviousWeek}
                                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                                >
                                    Previous week
                                </button>

                                <div className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white">
                                    {formatWeekRange(selectedWeekStart)}
                                </div>

                                <button
                                    onClick={goNextWeek}
                                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                                >
                                    Next week
                                </button>

                                <button
                                    onClick={goThisWeek}
                                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                                >
                                    This week
                                </button>


                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {loading && (
                                    <span className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800">
                                        Loading calendar...
                                    </span>
                                )}

                                {!loading && usingDemoData && (
                                    <span className="rounded-full bg-amber-200 px-4 py-2 text-sm font-semibold text-amber-950">
                                        Demo data mode
                                    </span>
                                )}

                                {!loading && !usingDemoData && (
                                    <span className="rounded-full bg-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-950">
                                        Connected to Google Calendar
                                    </span>
                                )}

                                {error && (
                                    <span className="rounded-full bg-red-200 px-4 py-2 text-sm font-semibold text-red-950">
                                        {error}
                                    </span>
                                )}

                                {calendarActionMessage && (
                                    <span className="rounded-full bg-blue-200 px-4 py-2 text-sm font-semibold text-blue-950">
                                        {calendarActionMessage}
                                    </span>
                                )}

                                {calendarActionError && (
                                    <span className="rounded-full bg-red-200 px-4 py-2 text-sm font-semibold text-red-950">
                                        {calendarActionError}
                                    </span>
                                )}
                            </div>
                        </div>

                        <AuthButtons />
                    </div>
                </div>

                <div className="mb-5">
                    <AiSettings
                        provider={aiProvider}
                        model={aiModel}
                        apiKey={apiKey}
                        loading={aiLoading}
                        onProviderChange={handleProviderChange}
                        onModelChange={handleModelChange}
                        onApiKeyChange={setApiKey}
                        onGenerate={generateAiSummary}
                    />
                </div>

                <div className="mb-5">
                    <AvailabilitySettingsCard
                        settings={availabilitySettings}
                        onChange={handleAvailabilitySettingsChange}
                    />
                </div>

                <div className="mb-5 flex flex-wrap gap-3">
                    <button
                        onClick={handleAutoPlanWeek}
                        disabled={analysis.freeSlots.length === 0}
                        className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400"
                    >
                        Auto-plan my week
                    </button>

                    {plannedSuggestions.length > 0 && (
                        <button
                            onClick={() => setPlannedSuggestions([])}
                            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900"
                        >
                            Clear suggestions
                        </button>
                    )}

                </div>

                {plannedSuggestions.length > 0 && (
                    <div className="mb-5">
                        <StudyPlanSuggestions
                            suggestions={plannedSuggestions}
                            addingSuggestionId={addingSuggestionId}
                            addingAll={addingAllSuggestions}
                            onAddOne={handleAddOneSuggestion}
                            onAddAll={handleAddAllSuggestions}
                        />
                    </div>
                )}

                <div className="grid gap-5 lg:grid-cols-3">
                    <StressScore analysis={analysis} />

                    <div className="lg:col-span-2">
                        <WeekSummary
                            analysis={analysis}
                            aiSummary={aiSummary}
                            loading={aiLoading}
                            error={aiError}
                        />
                    </div>

                    <div className="lg:col-span-2">
                        <EventList events={mergedEvents} />
                    </div>

                    <FreeSlots
                        slots={analysis.freeSlots}
                        onAddStudySlot={handleAddStudySlot}
                        addingSlotId={addingSlotId}
                    />
                </div>
            </div>
        </main>
    );
}
