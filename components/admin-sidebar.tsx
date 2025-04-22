"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Car, Users, FileText, Calendar, LayoutDashboard, LogOut, Menu, RotateCcw, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import { useMediaQuery } from "@/hooks/use-mobile"

export default function AdminSidebar() {
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    {
      title: "แดชบอร์ด",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "รถ",
      href: "/admin/cars",
      icon: Car,
    },
    {
      title: "ประเภทรถ",
      href: "/admin/car-types",
      icon: FileText,
    },
    {
      title: "ผู้ใช้งาน",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "การจอง",
      href: "/admin/bookings",
      icon: Calendar,
    },
    {
      title: "รับคืนรถ",
      href: "/admin/return-car",
      icon: RotateCcw,
    },
    {
      title: "ประวัติการจอง",
      href: "/admin/booking-history",
      icon: History,
    },
  ]

  const handleLogout = () => {
    // ใช้ window.location.href เพื่อนำทางไปยังหน้าเข้าสู่ระบบโดยตรง
    window.location.href = "/login"
  }

  // Bottom navigation สำหรับมือถือ
  if (isMobile) {
    return (
      <>
        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 h-14 bg-background border-b flex items-center justify-between px-4 z-50">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">โนโซมิ แอดมิน</h1>
          </div>
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">เมนู</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] sm:w-[300px]">
              <div className="flex items-center gap-2 mb-8">
                <Car className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">โนโซมิ แอดมิน</h1>
              </div>
              <nav className="grid gap-2">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className={cn("w-full justify-start gap-2 h-12", pathname === item.href && "bg-muted")}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.title}
                    </Button>
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 h-12 mt-4 text-sm rounded-md hover:bg-accent text-left w-full"
                >
                  <LogOut className="h-5 w-5" />
                  ออกจากระบบ
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around z-40">
          {navItems.slice(0, 5).map((item) => (
            <Link key={item.href} href={item.href} className="flex-1">
              <div
                className={cn(
                  "flex flex-col items-center justify-center h-full",
                  pathname === item.href ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.title}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Spacer สำหรับ content ไม่ให้ถูกซ่อนใต้ bottom navigation */}
        <div className="pb-16 pt-16"></div>
      </>
    )
  }

  // Desktop sidebar
  return (
    <div className="flex flex-col h-screen w-64 bg-muted/40 border-r">
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <Car className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">โนโซมิ แอดมิน</h1>
      </div>
      <div className="flex-1 py-6 px-4 space-y-1 overflow-auto">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button variant="ghost" className={cn("w-full justify-start gap-2", pathname === item.href && "bg-muted")}>
              <item.icon className="h-4 w-4" />
              {item.title}
            </Button>
          </Link>
        ))}
      </div>
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent text-left"
        >
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </button>
      </div>
    </div>
  )
}

