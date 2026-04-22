import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect(
      `/sign-in?${new URLSearchParams({ callbackUrl: "/" }).toString()}`,
    );
  }

  return (
    <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between bg-white px-16 py-32 dark:bg-black sm:items-start">
      <h1>User Tracker</h1>
    </main>
  );
}
