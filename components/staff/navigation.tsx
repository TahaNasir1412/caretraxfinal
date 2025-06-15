"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Bell, Settings } from "lucide-react"

export default function StaffNavigation() {
  const pathname = usePathname()

  const links = [
    { href: "/staff/dashboard", label: "Dashboard", icon: Home },
    { href: "/staff/alerts", label: "Alerts", icon: Bell },
    { href: "/staff/settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="sticky bottom-0 border-t bg-background">
      <nav className="flex h-16">
        {links.map((link) => {
          const isActive = pathname === link.href

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <link.icon className="h-5 w-5" />
              <span className="text-xs">{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
