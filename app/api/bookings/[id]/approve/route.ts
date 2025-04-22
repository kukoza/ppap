import { executeQuery } from "@/lib/db"
import { NextResponse } from "next/server"

// POST: อนุมัติการจอง
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { approvedBy } = await request.json()
    const bookingId = params.id

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!approvedBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // ตรวจสอบว่าการจองมีอยู่จริงหรือไม่
    const checkBooking = await executeQuery(
      `
      SELECT b.id, b.carId, b.status, c.currentMileage
      FROM Bookings b
      JOIN Cars c ON b.carId = c.id
      WHERE b.id = ?
    `,
      [bookingId],
    )

    if (checkBooking.recordset.length === 0) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const booking = checkBooking.recordset[0]

    // ตรวจสอบว่าการจองอยู่ในสถานะรออนุมัติหรือไม่
    if (booking.status !== "รออนุมัติ") {
      return NextResponse.json({ error: "Booking is not in pending status" }, { status: 400 })
    }

    // อัปเดตสถานะการจองและบันทึกเลขไมล์เริ่มต้น
    await executeQuery(
      `
      UPDATE Bookings 
      SET status = 'อนุมัติแล้ว', 
          approvedAt = CURRENT_TIMESTAMP, 
          approvedBy = ?,
          startMileage = ?
      WHERE id = ?
    `,
      [approvedBy, booking.currentMileage, bookingId],
    )

    // อัปเดตสถานะรถ
    await executeQuery(
      `
      UPDATE Cars SET status = 'มีการจอง' WHERE id = ?
    `,
      [booking.carId],
    )

    return NextResponse.json({
      success: true,
      message: "Booking approved successfully",
      data: {
        startMileage: booking.currentMileage,
      },
    })
  } catch (error) {
    console.error("Error approving booking:", error)
    return NextResponse.json({ error: "Failed to approve booking" }, { status: 500 })
  }
}
