"use client";

import { useEffect, useState } from "react";
import { AiProvider } from "@/lib/types";

type Props = {
    provider: AiProvider;
    model: string;
    apiKey: string;
    loading: boolean;
    onProviderChange: (provider: AiProvider) => void;
    onModelChange: (model: string) => void;
    onApiKeyChange: (apiKey: string) => void;
    onGenerate: () => void;
};

export function AiSettings({
    provider,
    model,
    apiKey,
    loading,
    onProviderChange,
    onModelChange,
    onApiKeyChange,
    onGenerate,
}: Props) {
    const [models, setModels] = useState<string[]>([]);
    const [modelLoading, setModelLoading] = useState(false);
    const [customModel, setCustomModel] = useState(false);

    const needsApiKey = provider !== "ollama";

    useEffect(() => {
        async function loadModels() {
            setModelLoading(true);
            setCustomModel(false);

            try {
                const response = await fetch(`/api/ai-models?provider=${provider}`);
                const data = await response.json();

                const loadedModels: string[] = data.models ?? [];

                setModels(loadedModels);

                if (loadedModels.length > 0 && !loadedModels.includes(model)) {
                    onModelChange(loadedModels[0]);
                }
            } catch {
                setModels([]);
            } finally {
                setModelLoading(false);
            }
        }

        loadModels();
    }, [provider, model, onModelChange]);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm">
            <div className="mb-4">
                <h2 className="text-xl font-semibold">AI model settings</h2>
                <p className="mt-1 text-sm text-slate-600">
                    Choose the AI provider and model used for your weekly planning advice.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Provider</span>

                    <select
                        value={provider}
                        onChange={(event) => onProviderChange(event.target.value as AiProvider)}
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-slate-900"
                    >
                        <option value="ollama">Ollama local</option>
                        <option value="openai">OpenAI</option>
                        <option value="deepseek">DeepSeek</option>
                    </select>
                </label>

                <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Model</span>

                    {!customModel ? (
                        <div className="mt-1 flex gap-2">
                            <select
                                value={model}
                                onChange={(event) => onModelChange(event.target.value)}
                                disabled={modelLoading || models.length === 0}
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-slate-900 disabled:bg-slate-100"
                            >
                                {modelLoading && <option>Loading models...</option>}

                                {!modelLoading &&
                                    models.map((modelName) => (
                                        <option key={modelName} value={modelName}>
                                            {modelName}
                                        </option>
                                    ))}

                                {!modelLoading && models.length === 0 && (
                                    <option value={model}>No models found</option>
                                )}
                            </select>

                            <button
                                type="button"
                                onClick={() => setCustomModel(true)}
                                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Custom
                            </button>
                        </div>
                    ) : (
                        <div className="mt-1 flex gap-2">
                            <input
                                value={model}
                                onChange={(event) => onModelChange(event.target.value)}
                                placeholder="Enter model name"
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-slate-900"
                            />

                            <button
                                type="button"
                                onClick={() => setCustomModel(false)}
                                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                List
                            </button>
                        </div>
                    )}
                </label>

                <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                        API key {needsApiKey ? "" : "(not needed)"}
                    </span>

                    <input
                        value={apiKey}
                        onChange={(event) => onApiKeyChange(event.target.value)}
                        type="password"
                        disabled={!needsApiKey}
                        placeholder={
                            needsApiKey ? "Paste API key for this session" : "Local Ollama"
                        }
                        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                    onClick={onGenerate}
                    disabled={loading || (needsApiKey && apiKey.trim().length === 0)}
                    className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                    {loading ? "Generating..." : "Generate AI summary"}
                </button>

                <p className="text-sm text-slate-600">
                    Ollama models are loaded from your local machine automatically.
                </p>
            </div>
        </div>
    );
}