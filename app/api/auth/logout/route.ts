import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// เพิ่ม export config เพื่อบอก Next.js ว่านี่เป็น dynamic route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // ลบ cookie ที่ใช้ในการเก็บ token
    cookies().delete("auth_token")
    console.log("Logout - Cookie deleted")

    // ส่ง response กลับพร้อมกับ redirect URL
    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
      redirectUrl: "/login?logout=true",
    })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // ลบ cookie ที่ใช้ในการเก็บ token
    cookies().delete("auth_token")
    console.log("Logout - Cookie deleted")

    // ส่ง response กลับพร้อมกับ redirect URL
    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
      redirectUrl: "/login?logout=true",
    })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 })
  }
}