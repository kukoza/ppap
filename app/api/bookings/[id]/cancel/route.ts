import { executeQuery, executeQuerySingle } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

    // ตรวจสอบว่ายังมีการจองรถคันนี้ที่มีสถานะ "อนุมัติแล้ว" หรือ "รออนุมัติ" อยู่หรือไม่
    const activeBookingsResult = await executeQuery(
      `SELECT COUNT(*) as count FROM Bookings WHERE carId = ? AND (status = 'อนุมัติแล้ว' OR status = 'รออนุมัติ')`,
      [carId],
    )

    // ตรวจสอบว่า activeBookingsResult มีค่าและมี property count หรือไม่
    let carUpdated = false

    if (activeBookingsResult && activeBookingsResult.recordset && activeBookingsResult.recordset[0]) {
      console.log(`Active bookings count for car ID ${carId}: ${activeBookingsResult.recordset[0].count}`)

      if (activeBookingsResult.recordset[0].count === 0) {
        console.log(`No active bookings found for car ID: ${carId}, updating status to "ว่าง"`)
        await executeQuery(`UPDATE Cars SET status = 'ว่าง' WHERE id = ?`, [carId])
        carUpdated = true
      }
    } else {
      // ถ้าไม่สามารถตรวจสอบการจองที่เหลืออยู่ได้ ให้อัปเดตสถานะรถเป็น "ว่าง" ทันที
      console.log(`Unable to check active bookings for car ID: ${carId}, updating status to "ว่าง" anyway`)
      await executeQuery(`UPDATE Cars SET status = 'ว่าง' WHERE id = ?`, [carId])
      carUpdated = true
    }

    // อัปเดตสถานะรถเป็น "ว่าง" ทันทีโดยไม่ต้องตรวจสอบการจองที่เหลืออยู่
    console.log(`Force updating car ID: ${carId} status to "ว่าง"`)
    await executeQuery(`UPDATE Cars SET status = 'ว่าง' WHERE id = ?`, [carId])
    carUpdated = true

    return NextResponse.json({
      success: true,
      message: "ยกเลิกการจองเรียบร้อยแล้ว",
      carUpdated: true,
    })
  } catch (error) {
    console.error("Error cancelling booking:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการยกเลิกการจอง" }, { status: 500 })
  }
}
