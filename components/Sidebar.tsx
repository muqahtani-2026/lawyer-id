"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/actions";

interface SidebarProps {
  displayName: string;
  email: string;
  isAdmin: boolean;
}

interface NavLink {
  href: string;
  label: string;
  iconPath: string;
}

const NAV_LINKS: NavLink[] = [
  {
    href: "/dashboard",
    label: "اللوحة",
    iconPath:
      "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/review",
    label: "المراجعة",
    iconPath:
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    href: "/profile",
    label: "المِلَفّ",
    iconPath:
      "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
];

export function Sidebar({ displayName, email, isAdmin }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0f1f3d] border-l border-[#1d3461] min-h-screen flex-shrink-0">
      {/* Brand */}
      <div className="p-6 border-b border-[#1d3461]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 border-2 border-[#4a9eff] rounded-md flex items-center justify-center font-mono text-lg font-bold text-[#4a9eff] flex-shrink-0">
            Li
          </div>
          <div className="min-w-0">
            <div className="text-[#e6f1ff] text-base font-semibold leading-tight">
              Lawyer ID
            </div>
            <div className="text-[9px] text-[#8892b0] tracking-[1.5px] mt-1">
              SAUDI · LEGAL · COMMERCIAL
            </div>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-5 border-b border-[#1d3461]">
        <div className="text-xs text-[#8892b0] mb-1">مرحبًا</div>
        <div className="text-[#e6f1ff] text-sm font-medium truncate">
          {displayName}
        </div>
        <div className="text-[#8892b0] text-xs truncate mt-1" dir="ltr">
          {email}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_LINKS.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all border ${
                isActive
                  ? "bg-[#4a9eff]/10 text-[#4a9eff] border-[#4a9eff]/30 font-medium"
                  : "text-[#8892b0] hover:bg-[#152a4a] hover:text-[#e6f1ff] border-transparent"
              }`}
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={link.iconPath}
                />
              </svg>
              <span className="text-sm">{link.label}</span>
            </Link>
          );
        })}

        {/* Admin-only link (yellow accent #fbbf24) */}
        {isAdmin && (
          <>
            <div className="px-4 pt-5 pb-2">
              <div className="text-[9px] text-[#8892b0] tracking-[1.5px] font-mono border-t border-[#1d3461] pt-3">
                ADMIN ONLY
              </div>
            </div>
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all border ${
                pathname.startsWith("/admin")
                  ? "bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/30 font-medium"
                  : "text-[#fbbf24]/70 hover:bg-[#fbbf24]/5 hover:text-[#fbbf24] border-transparent"
              }`}
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="text-sm">لوحة الإدارة</span>
            </Link>
          </>
        )}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-[#1d3461]">
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-[#8892b0] hover:text-[#ef4444] hover:bg-[#ef4444]/5 rounded-lg transition-colors border border-transparent hover:border-[#ef4444]/30"
          >
            <span>تسجيل الخروج</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </form>
      </div>
    </aside>
  );
}
