import { NextResponse } from "next/server";
import { CalendarAnalysis, CalendarEvent } from "@/lib/types";

type RequestBody = {
    events: CalendarEvent[];
    analysis: CalendarAnalysis;
};

function buildFallbackSummary(events: CalendarEvent[], analysis: CalendarAnalysis) {
    const totalHours = Math.round((analysis.totalScheduledMinutes / 60) * 10) / 10;

    const deadlineEvents = events.filter(
        (event) => event.category === "deadline"
    );

    const studySlots = analysis.freeSlots
        .slice(0, 3)
        .map((slot) => `${slot.date} from ${slot.start} to ${slot.end}`)
        .join(", ");

    let summary = `Your week has ${analysis.totalEvents} events and about ${totalHours} scheduled hours. `;

    summary += `The busiest day is ${analysis.busiestDay.weekday}, so you should avoid adding too many extra tasks there. `;

    if (deadlineEvents.length > 0) {
        summary += `There are ${deadlineEvents.length} deadline-related events, so preparing early would reduce stress. `;
    }

    if (analysis.freeSlots.length > 0) {
        summary += `Good study opportunities are: ${studySlots}. `;
    } else {
        summary += `There are not many clear study slots, so this week may require shorter focused sessions. `;
    }

    if (analysis.loadScore >= 70) {
        summary += `Overall, this looks like a high-load week. Prioritize sleep, important deadlines, and avoid unnecessary commitments.`;
    } else if (analysis.loadScore >= 40) {
        summary += `Overall, this looks like a medium-load week. With some planning, it should be manageable.`;
    } else {
        summary += `Overall, this looks like a light week. This is a good chance to work ahead.`;
    }

    return summary;
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as RequestBody;

        const summary = buildFallbackSummary(body.events, body.analysis);

        return NextResponse.json({
            summary,
            mode: "fallback",
        });
    } catch {
        return NextResponse.json(
            { error: "Could not generate AI summary" },
            { status: 500 }
        );
    }
}