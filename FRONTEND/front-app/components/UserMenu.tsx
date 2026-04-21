"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  username: string;
}

export default function UserMenu({ username }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/profile"
        className="rounded-lg bg-violet-600 px-4 py-2 text-white font-semibold hover:bg-violet-700 transition"
      >
        {username}
      </Link>
      <button
        onClick={handleLogout}
        disabled={loading}
        className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium
                   text-black-300 hover:border-red-600 hover:text-red-400 transition
                   disabled:opacity-50"
      >
        {loading ? "…" : "Logout"}
      </button>
    </div>
  );
}
