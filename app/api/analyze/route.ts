import { NextResponse } from "next/server";
import { analyzeCalendar } from "@/lib/calendarAnalyzer";
import { demoEvents } from "@/lib/demoEvents";

export async function GET() {
    const analysis = analyzeCalendar(demoEvents);

    return NextResponse.json({
        events: demoEvents,
        analysis,
    });
}