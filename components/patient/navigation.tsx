"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, CreditCard, MessageSquare } from "lucide-react"

export default function PatientNavigation() {
  const pathname = usePathname()

  const links = [
    { href: "/patient/dashboard", label: "Home", icon: Home },
    { href: "/patient/history", label: "History", icon: FileText },
    { href: "/patient/billing", label: "Billing", icon: CreditCard },
    { href: "/patient/support", label: "Support", icon: MessageSquare },
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
