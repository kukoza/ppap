import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// เพิ่ม export config เพื่อบอก Next.js ว่านี่เป็น dynamic route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    console.log("All cookies:", allCookies)

    return NextResponse.json({
      cookies: allCookies.map((cookie) => ({
        name: cookie.name,
        value: cookie.value ? "exists" : "empty",
      })),
    })
  } catch (error) {
    console.error("Error debugging cookies:", error)
    return NextResponse.json({ error: "Failed to debug cookies" }, { status: 500 })
  }
}