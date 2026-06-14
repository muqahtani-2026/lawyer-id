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
  { href: "/dashboard", label: "اللوحة", iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/review", label: "المحتوى", iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { href: "/my-articles", label: "مقالاتي", iconPath: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
  { href: "/leads", label: "طلبات", iconPath: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
];

export function MobileNav({ isAdmin }: MobileNavProps) {
  const pathname = usePathname();

  const links: NavLink[] = isAdmin
    ? [...NAV_LINKS, { href: "/admin", label: "الإدارة", iconPath: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" }]
    : NAV_LINKS;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0f1f3d]/95 backdrop-blur border-t border-[#1d3461] pb-[env(safe-area-inset-bottom)]"
      dir="rtl"
    >
      <div className="flex items-stretch justify-around">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          const isAdminLink = link.href === "/admin";
          const activeColor = isAdminLink ? "#fbbf24" : "#4a9eff";
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 py-2.5 transition-colors"
              style={{ color: isActive ? activeColor : "#8892b0" }}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.iconPath} />
              </svg>
              <span className="text-[10px] font-medium leading-none">{link.label}</span>
            </Link>
          );
        })}

        <form action={signOut} className="flex-1 flex">
          <button
            type="submit"
            className="flex flex-col items-center justify-center gap-1 w-full py-2.5 text-[#8892b0] hover:text-[#ef4444] transition-colors"
          >
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-[10px] font-medium leading-none">خروج</span>
          </button>
        </form>
      </div>
    </nav>
  );
}
