import type { ReactNode } from "react"
import AdminSidebar from "@/components/admin-sidebar"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto pt-16">{children}</main>
    </div>
  )
}
