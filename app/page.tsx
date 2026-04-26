import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <div className="max-w-2xl rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
          WeekPilot AI
        </p>

        <h1 className="mt-3 text-5xl font-bold text-gray-900">
          Turn your calendar into a smart weekly plan.
        </h1>

        <p className="mt-5 text-lg leading-8 text-gray-600">
          WeekPilot helps students understand their week, find free study time,
          avoid overload, and stay on top of deadlines.
        </p>

        <Link
          href="/dashboard"
          className="mt-8 inline-block rounded-full bg-black px-6 py-3 font-medium text-white"
        >
          Open dashboard
        </Link>
      </div>
    </main>
  );
}