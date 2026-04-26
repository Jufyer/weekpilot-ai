"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthButtons } from "@/components/AuthButtons";
import { EventList } from "@/components/EventList";
import { FreeSlots } from "@/components/FreeSlots";
import { StressScore } from "@/components/StressScore";
import { WeekSummary } from "@/components/WeekSummary";
import { analyzeCalendar } from "@/lib/calendarAnalyzer";
import { demoEvents } from "@/lib/demoEvents";
import { CalendarEvent } from "@/lib/types";
import { addDays, formatWeekRange, getDefaultPlanningWeek } from "@/lib/dateUtils";

export default function DashboardPage() {
    const [events, setEvents] = useState<CalendarEvent[]>(demoEvents);
    const [weekOffset, setWeekOffset] = useState(0);
    const [baseWeekStart] = useState(() => getDefaultPlanningWeek());
    const [loading, setLoading] = useState(true);
    const [usingDemoData, setUsingDemoData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [aiSummary, setAiSummary] = useState<string | undefined>();
    const [aiLoading, setAiLoading] = useState(false);

    const selectedWeekStart = useMemo(() => {
        return addDays(baseWeekStart, weekOffset * 7);
    }, [baseWeekStart, weekOffset]);

    const selectedWeekEnd = useMemo(() => {
        return addDays(selectedWeekStart, 7);
    }, [selectedWeekStart]);

    useEffect(() => {
        async function loadCalendar() {
            setLoading(true);
            setError(null);

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

    const analysis = analyzeCalendar(events, selectedWeekStart);

    useEffect(() => {
        async function loadAiSummary() {
            setAiLoading(true);

            try {
                const response = await fetch("/api/ai-summary", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        events,
                        analysis,
                    }),
                });

                if (!response.ok) {
                    throw new Error("Could not generate summary");
                }

                const data = await response.json();
                setAiSummary(data.summary);
            } catch {
                setAiSummary(undefined);
            } finally {
                setAiLoading(false);
            }
        }

        if (!loading) {
            loadAiSummary();
        }
    }, [events, loading]);

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
                                WeekPilot analyzes your calendar, finds free study time, detects
                                busy days, and turns your week into a clear plan.
                            </p>

                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => setWeekOffset((value) => value - 1)}
                                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                                >
                                    Previous week
                                </button>

                                <div className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white">
                                    {formatWeekRange(selectedWeekStart)}
                                </div>

                                <button
                                    onClick={() => setWeekOffset((value) => value + 1)}
                                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                                >
                                    Next week
                                </button>

                                <button
                                    onClick={() => setWeekOffset(0)}
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
                            </div>
                        </div>

                        <AuthButtons />
                    </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    <StressScore analysis={analysis} />

                    <div className="lg:col-span-2">
                        <WeekSummary
                            analysis={analysis}
                            aiSummary={aiSummary}
                            loading={aiLoading}
                        />
                    </div>

                    <div className="lg:col-span-2">
                        <EventList events={events} />
                    </div>

                    <FreeSlots slots={analysis.freeSlots} />
                </div>
            </div>
        </main>
    );
}