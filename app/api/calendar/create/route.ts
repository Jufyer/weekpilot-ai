import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { authOptions } from "@/lib/auth";

type RequestBody = {
    title: string;
    startIso: string;
    endIso: string;
    description?: string;
};

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.accessToken) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = (await request.json()) as RequestBody;

        const auth = new google.auth.OAuth2();
        auth.setCredentials({
            access_token: session.accessToken,
        });

        const calendar = google.calendar({
            version: "v3",
            auth,
        });

        const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: {
                summary: body.title,
                description: body.description,
                start: {
                    dateTime: body.startIso,
                },
                end: {
                    dateTime: body.endIso,
                },
            },
        });

        return NextResponse.json({
            ok: true,
            eventId: response.data.id,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Could not create calendar event";

        return NextResponse.json({ error: message }, { status: 500 });
    }
}