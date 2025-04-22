import { executeQuery, executeInsert } from "@/lib/db"
import { NextResponse } from "next/server"

// GET: ดึงข้อมูลการจองทั้งหมด
export async function GET() {
  try {
    const result = await executeQuery(
      `
      SELECT b.id, b.userId, b.carId, b.startDate, b.endDate, b.startTime, b.endTime, 
             b.purpose, b.status, b.createdAt, b.destination,
             u.name as userName, u.department as userDepartment, u.avatar as userAvatar,
             c.name as carName, c.type as carType, c.licensePlate
      FROM Bookings b
      JOIN Users u ON b.userId = u.id
      JOIN Cars c ON b.carId = c.id
      ORDER BY b.createdAt DESC
      `,
      [],
    )

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}

// POST: เพิ่มการจองใหม่
export async function POST(request: Request) {
  try {
    const { userId, carId, startDate, endDate, startTime, endTime, purpose, destination } = await request.json()

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!userId || !carId || !startDate || !endDate || !startTime || !endTime || !purpose) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // ตรวจสอบว่ารถว่างในช่วงเวลาที่ต้องการหรือไม่
    const conflictingBookings = await executeQuery(
      `
      SELECT COUNT(*) as count 
      FROM Bookings 
      WHERE carId = ? 
      AND status IN ('รออนุมัติ', 'อนุมัติแล้ว')
      AND (
        (startDate <= ? AND endDate >= ?) OR
        (startDate <= ? AND endDate >= ?) OR
        (startDate >= ? AND endDate <= ?)
      )
      `,
      [carId, startDate, startDate, endDate, endDate, startDate, endDate],
    )

    if ((conflictingBookings.recordset[0] as any).count > 0) {
      return NextResponse.json({ error: "Car is not available for the selected dates" }, { status: 409 })
    }

    // เพิ่มการจองใหม่
    const result = await executeInsert(
      `
      INSERT INTO Bookings (userId, carId, startDate, endDate, startTime, endTime, purpose, destination, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'รออนุมัติ');
      `,
      [userId, carId, startDate, endDate, startTime, endTime, purpose, destination || null],
    )

    const bookingId = result.insertId

    // อัปเดตสถานะรถ
    await executeQuery(
      `
      UPDATE Cars SET status = 'มีการจอง' WHERE id = ?
      `,
      [carId],
    )

    return NextResponse.json(
      {
        id: bookingId,
        userId,
        carId,
        startDate,
        endDate,
        startTime,
        endTime,
        purpose,
        destination,
        status: "รออนุมัติ",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}
