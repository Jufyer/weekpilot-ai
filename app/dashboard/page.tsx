import { EventList } from "@/components/EventList";
import { FreeSlots } from "@/components/FreeSlots";
import { StressScore } from "@/components/StressScore";
import { WeekSummary } from "@/components/WeekSummary";
import { analyzeCalendar } from "@/lib/calendarAnalyzer";
import { demoEvents } from "@/lib/demoEvents";

export default function DashboardPage() {
    const analysis = analyzeCalendar(demoEvents);

    return (
        <main className="min-h-screen bg-gray-100 px-6 py-8">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                        WeekPilot AI
                    </p>
                    <h1 className="mt-2 text-4xl font-bold text-gray-600">
                        Your smart weekly action plan
                    </h1>
                    <p className="mt-3 max-w-2xl text-gray-600">
                        WeekPilot analyzes your calendar, finds free study time, detects
                        busy days, and turns your week into a clear plan.
                    </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-3 text-gray-600">
                    <StressScore analysis={analysis} />

                    <div className="lg:col-span-2">
                        <WeekSummary analysis={analysis} />
                    </div>

                    <div className="lg:col-span-2">
                        <EventList events={demoEvents} />
                    </div>

                    <FreeSlots slots={analysis.freeSlots} />
                </div>
            </div>
        </main>
    );
}