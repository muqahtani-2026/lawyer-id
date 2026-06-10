"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/actions";

interface MobileNavProps {
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
    href: "/library",
    label: "مكتبتي",
    iconPath:
      "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    href: "/profile",
    label: "المِلَفّ",
    iconPath:
      "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
];

export function MobileNav({ isAdmin }: MobileNavProps) {
  const pathname = usePathname();

  const links: NavLink[] = isAdmin
    ? [
        ...NAV_LINKS,
        {
          href: "/admin",
          label: "الإدارة",
          iconPath:
            "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
        },
      ]
    : NAV_LINKS;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0f1f3d]/95 backdrop-blur border-t border-[#1d3461] pb-[env(safe-area-inset-bottom)]"
      dir="rtl"
    >
      <div className="flex items-stretch justify-around">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");
          const isAdminLink = link.href === "/admin";
          const activeColor = isAdminLink ? "#fbbf24" : "#4a9eff";
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2.5 transition-colors"
              style={{ color: isActive ? activeColor : "#8892b0" }}
            >
              <svg
                className="w-6 h-6 flex-shrink-0"
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
              <span className="text-[10px] font-medium leading-none">
                {link.label}
              </span>
            </Link>
          );
        })}

        <form action={signOut} className="flex-1 flex">
          <button
            type="submit"
            className="flex flex-col items-center justify-center gap-1 w-full py-2.5 text-[#8892b0] hover:text-[#ef4444] transition-colors"
          >
            <svg
              className="w-6 h-6 flex-shrink-0"
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
            <span className="text-[10px] font-medium leading-none">خروج</span>
          </button>
        </form>
      </div>
    </nav>
  );
}