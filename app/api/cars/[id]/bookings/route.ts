import { executeQuery } from "@/lib/db"
import { NextResponse } from "next/server"

// GET: ดึงประวัติการจองของรถตาม ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const carId = params.id

    // ตรวจสอบว่ารถมีอยู่จริงหรือไม่
    const carExists = await executeQuery(
      `
      SELECT id FROM Cars WHERE id = ?
      `,
      [carId],
    )

    if ((carExists.recordset as any[]).length === 0) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 })
    }

    // ดึงประวัติการจองของรถ
    const bookings = await executeQuery(
      `
      SELECT b.id, b.startDate, b.endDate, b.purpose, b.startMileage, b.endMileage,
             u.name as userName, u.department as userDepartment
      FROM Bookings b
      JOIN Users u ON b.userId = u.id
      WHERE b.carId = ? AND b.status = 'เสร็จสิ้น'
      ORDER BY b.endDate DESC
      `,
      [carId],
    )

    return NextResponse.json(bookings.recordset)
  } catch (error) {
    console.error("Error fetching car bookings:", error)
    return NextResponse.json({ error: "Failed to fetch car bookings" }, { status: 500 })
  }
}
