import type { ReactNode } from "react"
import UserNavbar from "@/components/user-navbar"

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <UserNavbar />
      <main className="flex-1 p-6 pt-20">{children}</main>
      <footer className="bg-muted py-6 px-6 text-center">
        <p>© {new Date().getFullYear()} Nozomi Enterprise. All rights reserved.</p>
      </footer>
    </div>
  )
}
