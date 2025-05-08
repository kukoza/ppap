import { executeQuerySingle } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

// เพิ่ม export config เพื่อบอก Next.js ว่านี่เป็น dynamic route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // ตรวจสอบสิทธิ์การเข้าถึง
    const cookieStore = cookies()
    const token = cookieStore.get("auth_token")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ตรวจสอบความถูกต้องของ token
    const decoded = verify(token.value, process.env.JWT_SECRET || "your-secret-key") as {
      id: number
      role: string
    }

    // รับพารามิเตอร์จาก URL
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")
    const userId = searchParams.get("userId")

    if (!email || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // ตรวจสอบว่าอีเมลซ้ำหรือไม่ (ยกเว้นอีเมลของผู้ใช้คนนี้)
    const existingUser = await executeQuerySingle(
      `
      SELECT id FROM Users WHERE email = ? AND id != ?
      `,
      [email, userId],
    )

    return NextResponse.json({ exists: !!existingUser })
  } catch (error) {
    console.error("Error checking email:", error)
    return NextResponse.json({ error: "Failed to check email" }, { status: 500 })
  }
}