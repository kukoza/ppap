import { executeQuery } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    const userId = Number.parseInt(params.id)

    // ตรวจสอบว่าผู้ใช้กำลังดูข้อมูลของตัวเองหรือเป็นผู้ดูแลระบบ
    if (decoded.id !== userId && decoded.role !== "ผู้ดูแลระบบ") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // ดึงข้อมูลการจองของผู้ใช้
    const result = await executeQuery(
      `
      SELECT b.id, b.userId, b.carId, b.startDate, b.endDate, b.startTime, b.endTime, 
           b.purpose, b.status, b.createdAt, b.destination,
           c.id as carId, c.name as carName, c.type as carType
      FROM Bookings b
      JOIN Cars c ON b.carId = c.id
      WHERE b.userId = ?
      ORDER BY b.createdAt DESC
      `,
      [userId],
    )

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error fetching user bookings:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}
