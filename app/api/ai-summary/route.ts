import { NextResponse } from "next/server";
import {
    AiProvider,
    CalendarAnalysis,
    CalendarEvent,
    StructuredAiSummary,
} from "@/lib/types";

type RequestBody = {
    events: CalendarEvent[];
    analysis: CalendarAnalysis;
    provider?: AiProvider;
    model?: string;
    apiKey?: string;
};

function buildFallbackSummary(
    events: CalendarEvent[],
    analysis: CalendarAnalysis
): StructuredAiSummary {
    const totalHours = Math.round((analysis.totalScheduledMinutes / 60) * 10) / 10;

    const deadlineEvents = events.filter((event) => event.category === "deadline");

    const risks: string[] = [];

    if (analysis.loadScore >= 70) {
        risks.push("This looks like a high-load week, so avoid adding unnecessary tasks.");
    } else if (analysis.loadScore >= 40) {
        risks.push("This looks like a medium-load week. Planning ahead should make it manageable.");
    } else {
        risks.push("This looks like a light week, so the main risk is underusing your free time.");
    }

    if (deadlineEvents.length > 0) {
        risks.push(`There are ${deadlineEvents.length} deadline-related events this week.`);
    }

    const studyPlan =
        analysis.freeSlots.length > 0
            ? analysis.freeSlots.slice(0, 3).map((slot) => {
                return `Use ${slot.date} from ${slot.start} to ${slot.end} for focused study.`;
            })
            : ["Use shorter 25-minute study blocks between your existing events."];

    return {
        overview: `This week has ${analysis.totalEvents} events and about ${totalHours} scheduled hours. Your busiest day is ${analysis.busiestDay.weekday}, and your load score is ${analysis.loadScore}/100.`,
        risks,
        studyPlan,
        recommendation:
            analysis.loadScore < 40
                ? "Use this lighter week to work ahead instead of waiting until deadlines get close."
                : "Prioritize the most important school tasks first and protect at least one recovery block.",
        provider: "fallback",
        model: "fallback",
    };
}

function buildPrompt(events: CalendarEvent[], analysis: CalendarAnalysis) {
    const eventList = events
        .map((event) => {
            return `- ${event.title} | ${event.start} - ${event.end} | category: ${event.category}${event.allDay ? " | all-day" : ""
                }`;
        })
        .join("\n");

    const freeSlots = analysis.freeSlots
        .slice(0, 8)
        .map((slot) => {
            return `- ${slot.date}: ${slot.start} - ${slot.end} (${slot.durationMinutes} minutes)`;
        })
        .join("\n");

    return `
You are WeekPilot AI, a planning assistant for students.

Analyze the calendar week and return ONLY valid JSON.
Do not use Markdown.
Do not use bullet symbols outside JSON.
Do not invent events.
Do not say the student is underprepared unless there is clear evidence.
A low load score means the week is light, not stressful.

Return exactly this JSON shape:

{
  "overview": "short overview of the week",
  "risks": ["risk 1", "risk 2"],
  "studyPlan": ["action 1", "action 2", "action 3"],
  "recommendation": "one final recommendation"
}

Calendar analysis:
- Total events: ${analysis.totalEvents}
- Total scheduled minutes: ${analysis.totalScheduledMinutes}
- Load score: ${analysis.loadScore}/100
- Busiest day: ${analysis.busiestDay.weekday}
- Free study slots found: ${analysis.freeSlots.length}

Events:
${eventList || "No events found."}

Free study slots:
${freeSlots || "No free study slots found."}
`;
}

function extractJson(raw: string) {
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const cleaned = codeBlockMatch ? codeBlockMatch[1] : raw;

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("No JSON object found");
    }

    return cleaned.slice(firstBrace, lastBrace + 1);
}

function normalizeSummary(
    rawText: string,
    provider: AiProvider,
    model: string
): StructuredAiSummary {
    const jsonText = extractJson(rawText);
    const parsed = JSON.parse(jsonText);

    return {
        overview:
            typeof parsed.overview === "string"
                ? parsed.overview
                : "WeekPilot generated an overview, but it was not formatted correctly.",
        risks: Array.isArray(parsed.risks)
            ? parsed.risks.map(String).slice(0, 4)
            : [],
        studyPlan: Array.isArray(parsed.studyPlan)
            ? parsed.studyPlan.map(String).slice(0, 5)
            : [],
        recommendation:
            typeof parsed.recommendation === "string"
                ? parsed.recommendation
                : "Review your busiest day and use your longest free slot for focused study.",
        provider,
        model,
    };
}

async function generateWithOllama(
    events: CalendarEvent[],
    analysis: CalendarAnalysis,
    model: string
) {
    const ollamaUrl = process.env.OLLAMA_URL ?? "http://localhost:11434";

    const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            prompt: buildPrompt(events, analysis),
            stream: false,
            format: "json",
            options: {
                temperature: 0.2,
            },
        }),
    });

    if (!response.ok) {
        throw new Error("Ollama request failed");
    }

    const data = await response.json();

    if (!data.response) {
        throw new Error("Ollama returned no response");
    }

    return normalizeSummary(data.response, "ollama", model);
}

async function generateWithOpenAiCompatible(
    provider: "openai" | "deepseek",
    events: CalendarEvent[],
    analysis: CalendarAnalysis,
    model: string,
    apiKey: string
) {
    const baseUrl =
        provider === "openai"
            ? "https://api.openai.com/v1"
            : "https://api.deepseek.com";

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            temperature: 0.2,
            response_format: {
                type: "json_object",
            },
            messages: [
                {
                    role: "system",
                    content:
                        "You are WeekPilot AI. Return only valid JSON. Do not use Markdown.",
                },
                {
                    role: "user",
                    content: buildPrompt(events, analysis),
                },
            ],
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`${provider} request failed: ${text}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error(`${provider} returned no content`);
    }

    return normalizeSummary(content, provider, model);
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as RequestBody;

        const provider = body.provider ?? "ollama";
        const model =
            body.model ??
            (provider === "ollama"
                ? "llama3.2"
                : provider === "openai"
                    ? "gpt-4o-mini"
                    : "deepseek-chat");

        try {
            if (provider === "ollama") {
                const summary = await generateWithOllama(
                    body.events,
                    body.analysis,
                    model
                );

                return NextResponse.json({ summary });
            }

            if (!body.apiKey) {
                return NextResponse.json(
                    { error: "API key is required for this provider." },
                    { status: 400 }
                );
            }

            if (provider === "openai" || provider === "deepseek") {
                const summary = await generateWithOpenAiCompatible(
                    provider,
                    body.events,
                    body.analysis,
                    model,
                    body.apiKey
                );

                return NextResponse.json({ summary });
            }

            throw new Error("Unsupported provider");
        } catch {
            const summary = buildFallbackSummary(body.events, body.analysis);
            return NextResponse.json({ summary });
        }
    } catch {
        return NextResponse.json(
            { error: "Could not generate AI summary" },
            { status: 500 }
        );
    }
}