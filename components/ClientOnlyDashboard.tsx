"use client";

import dynamic from "next/dynamic";

const DashboardClient = dynamic(
    () => import("@/components/DashboardClient"),
    {
        ssr: false,
        loading: () => (
            <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-950">
                <div className="mx-auto max-w-6xl">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-bold uppercase tracking-wide text-slate-600">
                            WeekPilot AI
                        </p>
                        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                            Loading dashboard...
                        </h1>
                        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
                            Preparing your calendar, availability, and planning tools.
                        </p>
                    </div>
                </div>
            </main>
        ),
    }
);

export default function ClientOnlyDashboard() {
    return <DashboardClient />;
}