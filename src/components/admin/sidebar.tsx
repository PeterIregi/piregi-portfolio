"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", icon2: "M9 22V12h6v10" },
  { href: "/admin/projects", label: "Projects", icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20", icon2: "M6.5 17H20", icon3: "M12.5 17V8.5", icon4: "M12.5 8.5c0-1.38 1.12-2.5 2.5-2.5" },
  { href: "/admin/experience", label: "Experience", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", icon2: "M16 3.13a4 4 0 0 1 0 7.75" },
  { href: "/admin/skills", label: "Skills", icon: "M12 2L2 7l10 5 10-5-10-5z", icon2: "M2 17l10 5 10-5", icon3: "M2 12l10 5 10-5" },
  { href: "/admin/testimonials", label: "Testimonials", icon: "M8 21h8", icon2: "M8 13h8", icon3: "M12 3v8", icon4: "M8 7h8" },
  { href: "/admin/cv", label: "CV", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", icon2: "M16 14v4", icon3: "M8 14v4", icon4: "M16 10h-8", icon5: "M8 10h8", icon6: "M16 6h-8" },
  { href: "/admin/media", label: "Media", icon: "M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14", icon2: "M17 3v4", icon3: "M7 3v4" },
  { href: "/admin/messages", label: "Messages", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { href: "/admin/settings", label: "Settings", icon: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-2 0l-.15.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72V21a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 2 0l.15-.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 2 0l.15-.08a2 2 0 0 0 2.73-.73l.22-.4a2 2 0 0 0-.73-2.73l-.15-.1z" },
];

export function AdminSidebar({ user }: { user: { id?: string; email?: string | null; name?: string | null } }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-line bg-shell flex flex-col">
      <div className="p-4 border-b border-line">
        <h1 className="font-display text-xl font-semibold text-ink">Admin</h1>
        <p className="text-sm text-graphite truncate">{user.email ?? "Unknown"}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === item.href || pathname.startsWith(item.href + "/")
                ? "bg-claret/10 text-claret"
                : "text-ink hover:bg-claret/5 hover:text-claret"
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              {item.icon2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon2} />}
              {item.icon3 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon3} />}
              {item.icon4 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon4} />}
              {item.icon5 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon5} />}
              {item.icon6 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon6} />}
            </svg>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-line">
        <form action="/api/auth/signout" method="POST">
          <Button variant="ghost" size="sm" className="w-full justify-start" type="submit">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}