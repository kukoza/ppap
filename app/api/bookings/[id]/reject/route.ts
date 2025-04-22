import { executeQuery } from "@/lib/db"
import { NextResponse } from "next/server"

// POST: ปฏิเสธการจอง
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { reason } = await request.json()
    const bookingId = params.id

    // ตรวจสอบว่าการจองมีอยู่จริงหรือไม่
    const checkBooking = await executeQuery(
      `
      SELECT id, carId, status FROM Bookings WHERE id = ?
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

    // อัปเดตสถานะการจอง
    await executeQuery(
      `
      UPDATE Bookings 
      SET status = 'ปฏิเสธ', notes = ?
      WHERE id = ?
    `,
      [reason || null, bookingId],
    )

    // ตรวจสอบว่ารถคันนี้มีการจองอื่นที่อนุมัติแล้วหรือไม่
    const checkOtherBookings = await executeQuery(
      `
      SELECT COUNT(*) as count 
      FROM Bookings 
      WHERE carId = ? AND status = 'อนุมัติแล้ว'
    `,
      [booking.carId],
    )

    // ถ้าไม่มีการจองอื่นที่อนุมัติแล้ว ให้อัปเดตสถานะรถเป็น 'ว่าง'
    if (checkOtherBookings.recordset[0].count === 0) {
      await executeQuery(
        `
        UPDATE Cars SET status = 'ว่าง' WHERE id = ?
      `,
        [booking.carId],
      )
    }

    return NextResponse.json({ success: true, message: "Booking rejected successfully" })
  } catch (error) {
    console.error("Error rejecting booking:", error)
    return NextResponse.json({ error: "Failed to reject booking" }, { status: 500 })
  }
}
