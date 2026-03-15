"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  provider: "credentials" | "google";
  createdAt: string;
}

interface LoginRecord {
  userId: string;
  username: string;
  email: string;
  provider: "credentials" | "google";
  timestamp: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [history, setHistory] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"history" | "users">("history");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.replace("/");
      return;
    }
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setHistory(data.loginHistory || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <svg
          className="animate-spin h-8 w-8 text-[#8B5CF6]"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#8B5CF6]/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[#8B5CF6] text-2xl">
                admin_panel_settings
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Monitor users and login activity
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
              Total Users
            </p>
            <p className="text-3xl font-bold text-white">{users.length}</p>
          </div>
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
              Total Logins
            </p>
            <p className="text-3xl font-bold text-white">{history.length}</p>
          </div>
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
              Google SSO Users
            </p>
            <p className="text-3xl font-bold text-white">
              {users.filter((u) => u.provider === "google").length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#18181b] border border-[#27272a] rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab("history")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "history"
                ? "bg-[#8B5CF6] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Login History
          </button>
          <button
            onClick={() => setTab("users")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "users"
                ? "bg-[#8B5CF6] text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Registered Users
          </button>
        </div>

        {/* Login History Table */}
        {tab === "history" && (
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
            {history.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                <span className="material-symbols-outlined text-4xl mb-2 block">
                  history
                </span>
                No login activity yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#27272a]">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record, i) => (
                      <tr
                        key={i}
                        className="border-b border-[#27272a]/50 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-3 text-white font-medium">
                          {record.username}
                        </td>
                        <td className="px-5 py-3 text-gray-400">
                          {record.email}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              record.provider === "google"
                                ? "bg-blue-500/10 text-blue-400"
                                : "bg-green-500/10 text-green-400"
                            }`}
                          >
                            {record.provider === "google" ? (
                              <>
                                <svg className="w-3 h-3" viewBox="0 0 24 24">
                                  <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                  />
                                </svg>
                                Google
                              </>
                            ) : (
                              "Password"
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-400">
                          {formatDate(record.timestamp)}
                        </td>
                        <td className="px-5 py-3 text-gray-400">
                          {formatTime(record.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Users Table */}
        {tab === "users" && (
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#27272a]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[#27272a]/50 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3 text-white font-medium">
                        {user.username}
                      </td>
                      <td className="px-5 py-3 text-gray-400">{user.email}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-[#8B5CF6]/10 text-[#8B5CF6]"
                              : "bg-gray-500/10 text-gray-400"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 capitalize">
                        {user.provider}
                      </td>
                      <td className="px-5 py-3 text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
