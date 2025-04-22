import { executeQuerySingle } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

export async function GET() {
  try {
    // ดึง token จาก cookie
    const cookieStore = cookies()
    const token = cookieStore.get("auth_token")

    console.log("ME API - Token found:", token ? "Yes" : "No")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ตรวจสอบความถูกต้องของ token
    const decoded = verify(token.value, process.env.JWT_SECRET || "your-secret-key") as {
      id: number
    }

    console.log("ME API - Token verified, user ID:", decoded.id)

    // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
    const user = await executeQuerySingle(
      `
      SELECT id, name, email, department, role, phone, employeeId, avatar
      FROM Users
      WHERE id = ?
      `,
      [decoded.id],
    )

    console.log("ME API - User found:", user ? "Yes" : "No")

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }
}
