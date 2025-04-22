import { executeQuery, executeQuerySingle } from "@/lib/db"
import { NextResponse } from "next/server"

// DELETE - ลบการจอง (ยกเลิกการจอง)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const bookingId = Number.parseInt(params.id, 10)
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: "รหัสการจองไม่ถูกต้อง" }, { status: 400 })
    }

    console.log(`Cancelling booking ID: ${bookingId}`)

    // ตรวจสอบว่าการจองมีอยู่จริงหรือไม่
    const booking = await executeQuerySingle(`SELECT b.id, b.carId, b.status FROM Bookings b WHERE b.id = ?`, [
      bookingId,
    ])

    if (!booking) {
      return NextResponse.json({ error: "ไม่พบข้อมูลการจอง" }, { status: 404 })
    }

    // ตรวจสอบว่าการจองอยู่ในสถานะที่สามารถยกเลิกได้หรือไม่
    if (booking.status !== "รออนุมัติ" && booking.status !== "อนุมัติแล้ว") {
      return NextResponse.json({ error: "ไม่สามารถยกเลิกการจองที่ไม่ได้อยู่ในสถานะรออนุมัติหรืออนุมัติแล้ว" }, { status: 400 })
    }

    const carId = booking.carId

    // ลบข้อมูลการจองออกจากฐานข้อมูล
    await executeQuery(`DELETE FROM Bookings WHERE id = ?`, [bookingId])
    console.log(`Deleted booking ID: ${bookingId}`)

    // อัปเดตสถานะรถเป็น "ว่าง" ทันทีโดยไม่ต้องตรวจสอบการจองที่เหลืออยู่
    console.log(`Force updating car ID: ${carId} status to "ว่าง"`)
    await executeQuery(`UPDATE Cars SET status = 'ว่าง' WHERE id = ?`, [carId])

    return NextResponse.json({
      success: true,
      message: "ยกเลิกการจองเรียบร้อยแล้ว",
      carUpdated: true,
      carStatus: "ว่าง",
    })
  } catch (error) {
    console.error("Error cancelling booking:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการยกเลิกการจอง" }, { status: 500 })
  }
}

// GET - ดึงข้อมูลการจอง
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const bookingId = Number.parseInt(params.id, 10)
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: "รหัสการจองไม่ถูกต้อง" }, { status: 400 })
    }

    // ดึงข้อมูลการจองพร้อมข้อมูลรถและผู้ใช้
    const booking = await executeQuerySingle(
      `
      SELECT b.*, 
             c.name as carName, c.type as carType, c.licensePlate, c.status as carStatus,
             u.name as userName, u.department, u.email, u.phone
      FROM Bookings b
      LEFT JOIN Cars c ON b.carId = c.id
      LEFT JOIN Users u ON b.userId = u.id
      WHERE b.id = ?
      `,
      [bookingId],
    )

    if (!booking) {
      return NextResponse.json({ error: "ไม่พบข้อมูลการจอง" }, { status: 404 })
    }

    // จัดรูปแบบข้อมูลให้เหมาะสม
    const formattedBooking = {
      id: booking.id,
      userId: booking.userId,
      carId: booking.carId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      purpose: booking.purpose,
      destination: booking.destination,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt,
      car: {
        id: booking.carId,
        name: booking.carName,
        type: booking.carType,
        licensePlate: booking.licensePlate,
        status: booking.carStatus,
      },
      user: {
        id: booking.userId,
        name: booking.userName,
        department: booking.department,
        email: booking.email,
        phone: booking.phone,
      },
    }

    return NextResponse.json(formattedBooking)
  } catch (error) {
    console.error("Error fetching booking:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลการจอง" }, { status: 500 })
  }
}
