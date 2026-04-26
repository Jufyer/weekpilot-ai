import { NextResponse } from "next/server";
import { AiProvider } from "@/lib/types";

const staticModels: Record<Exclude<AiProvider, "ollama">, string[]> = {
    openai: ["gpt-4o-mini", "gpt-4o"],
    deepseek: ["deepseek-chat", "deepseek-reasoner"],
};

export async function GET(request: Request) {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider") as AiProvider | null;

    if (!provider) {
        return NextResponse.json({ models: [] });
    }

    if (provider === "ollama") {
        try {
            const ollamaUrl = process.env.OLLAMA_URL ?? "http://localhost:11434";

            const response = await fetch(`${ollamaUrl}/api/tags`, {
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error("Could not load Ollama models");
            }

            const data = await response.json();

            const models =
                data.models?.map((model: { name: string }) => model.name) ?? [];

            return NextResponse.json({ models });
        } catch {
            return NextResponse.json({
                models: ["llama3.2"],
                error: "Could not load local Ollama models",
            });
        }
    }

    if (provider === "openai" || provider === "deepseek") {
        return NextResponse.json({
            models: staticModels[provider],
        });
    }

    return NextResponse.json({ models: [] });
}