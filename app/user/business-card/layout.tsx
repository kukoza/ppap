import type React from "react"
export default function BusinessCardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">นามบัตร</h1>
      {children}
    </div>
  )
}
