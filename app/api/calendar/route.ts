import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { authOptions } from "@/lib/auth";
import { CalendarEvent } from "@/lib/types";

function guessCategory(title: string): CalendarEvent["category"] {
    const lower = title.toLowerCase();

    if (
        lower.includes("exam") ||
        lower.includes("test") ||
        lower.includes("klausur") ||
        lower.includes("homework") ||
        lower.includes("deadline")
    ) {
        return "deadline";
    }

    if (
        lower.includes("school") ||
        lower.includes("lesson") ||
        lower.includes("unterricht") ||
        lower.includes("kurs")
    ) {
        return "school";
    }

    if (
        lower.includes("training") ||
        lower.includes("karate") ||
        lower.includes("sport")
    ) {
        return "sport";
    }

    if (
        lower.includes("study") ||
        lower.includes("lernen") ||
        lower.includes("project")
    ) {
        return "study";
    }

    return "personal";
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(request.url);

    const startParam = url.searchParams.get("start");
    const endParam = url.searchParams.get("end");

    const now = new Date();

    const fallbackEnd = new Date();
    fallbackEnd.setDate(now.getDate() + 14);

    const timeMin = startParam ? new Date(startParam) : now;
    const timeMax = endParam ? new Date(endParam) : fallbackEnd;

    const auth = new google.auth.OAuth2();

    auth.setCredentials({
        access_token: session.accessToken,
    });

    const calendar = google.calendar({
        version: "v3",
        auth,
    });

    const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 100,
    });

    const events: CalendarEvent[] = (response.data.items ?? []).map((event) => {
        const isAllDay = Boolean(event.start?.date);

        const start =
            event.start?.dateTime ?? `${event.start?.date ?? ""}T00:00:00`;

        const end = event.end?.dateTime ?? `${event.end?.date ?? event.start?.date ?? ""}T00:00:00`;

        const title = event.summary ?? "Untitled event";

        return {
            id: event.id ?? crypto.randomUUID(),
            title,
            start,
            end,
            allDay: isAllDay,
            category: guessCategory(title),
        };
    });

    return NextResponse.json({ events });
}