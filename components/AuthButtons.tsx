"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function AuthButtons() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <p className="text-sm text-gray-500">Loading session...</p>;
    }

    if (session) {
        return (
            <div className="flex items-center gap-3">
                <p className="text-sm text-gray-600">
                    Signed in as {session.user?.email}
                </p>

                <button
                    onClick={() => signOut()}
                    className="rounded-full border px-4 py-2 text-sm font-medium"
                >
                    Sign out
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => signIn("google")}
            className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white"
        >
            Connect Google Calendar
        </button>
    );
}