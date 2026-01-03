"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Film, FileVideo, Settings, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

const navigation = [
  { name: "Studio", href: "/", icon: LayoutDashboard },
  { name: "My Videos", href: "/videos", icon: Film },
  { name: "Templates", href: "/templates", icon: FileVideo },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    setTime(new Date().toLocaleTimeString())
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden brutalist-button bg-background"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 bg-background border-r-[5px] border-foreground
          transition-transform lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b-[5px] border-foreground">
            <h1 className="text-2xl font-bold uppercase tracking-tight">Kilig</h1>
            <p className="text-sm font-mono mt-1 text-muted-foreground">STUDIO v2.0</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase
                    border-[3px] border-foreground transition-all
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-[4px_4px_0px_0px] shadow-foreground"
                        : "bg-background hover:shadow-[4px_4px_0px_0px] hover:shadow-foreground"
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t-[5px] border-foreground">
            <div className="p-3 border-[3px] border-foreground bg-muted">
              <p className="text-xs font-mono uppercase">Status: Online</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Last sync: {time || '...'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-foreground/20 z-30 lg:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
