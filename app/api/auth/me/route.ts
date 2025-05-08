import { executeQuerySingle } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify, JsonWebTokenError, TokenExpiredError } from "jsonwebtoken"

// กำหนดค่า secret key สำหรับ JWT แบบ hardcode
const JWT_SECRET = "your-secret-key"

// เพิ่ม export config เพื่อบอก Next.js ว่านี่เป็น dynamic route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // ดึง token จาก cookie
    const cookieStore = cookies()
    const token = cookieStore.get("auth_token")

    console.log("ME API - Token found:", token ? "Yes" : "No")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized", message: "No authentication token found" }, { status: 401 })
    }

    try {
      // ตรวจสอบความถูกต้องของ token โดยใช้ค่า hardcode แทน environment variable
      const decoded = verify(token.value, JWT_SECRET) as {
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
        return NextResponse.json({ error: "User not found", message: "User account no longer exists" }, { status: 404 })
      }

      return NextResponse.json(user)
    } catch (tokenError) {
      console.error("Token verification error:", tokenError)
      
      // จัดการกรณี token หมดอายุหรือไม่ถูกต้อง
      if (tokenError instanceof TokenExpiredError) {
        return NextResponse.json({ error: "Token expired", message: "Your session has expired, please login again" }, { status: 401 })
      } else if (tokenError instanceof JsonWebTokenError) {
        return NextResponse.json({ error: "Invalid token", message: "Authentication token is invalid" }, { status: 401 })
      }
      
      throw tokenError // ส่งต่อข้อผิดพลาดอื่นๆ ไปยัง catch block ด้านนอก
    }
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ error: "Authentication failed", message: "Could not authenticate user" }, { status: 401 })
  }
}