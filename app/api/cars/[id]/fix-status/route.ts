import { executeQuery, executeQuerySingle } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const carId = Number.parseInt(params.id, 10)
    if (isNaN(carId)) {
      return NextResponse.json({ error: "รหัสรถไม่ถูกต้อง" }, { status: 400 })
    }

    // ตรวจสอบว่ารถมีอยู่จริงหรือไม่
    const car = await executeQuerySingle(`SELECT id, status FROM Cars WHERE id = ?`, [carId])
    if (!car) {
      return NextResponse.json({ error: "ไม่พบข้อมูลรถ" }, { status: 404 })
    }

    console.log(`Fixing status for car ID: ${carId}, current status: ${car.status}`)

    // ตรวจสอบว่ามีการจองที่มีสถานะ "อนุมัติแล้ว" หรือ "รออนุมัติ" สำหรับรถคันนี้หรือไม่
    const activeBookingsResult = await executeQuery(
      `SELECT COUNT(*) as count FROM Bookings WHERE carId = ? AND (status = 'อนุมัติแล้ว' OR status = 'รออนุมัติ')`,
      [carId],
    )

    let newStatus = "ว่าง"
    let hasActiveBookings = false

    if (activeBookingsResult && activeBookingsResult.recordset && activeBookingsResult.recordset[0]) {
      const activeBookingsCount = activeBookingsResult.recordset[0].count
      console.log(`Active bookings count for car ID ${carId}: ${activeBookingsCount}`)

      if (activeBookingsCount > 0) {
        newStatus = "ไม่ว่าง"
        hasActiveBookings = true
      }
    }

    // อัปเดตสถานะรถตามผลการตรวจสอบ
    await executeQuery(`UPDATE Cars SET status = ? WHERE id = ?`, [newStatus, carId])
    console.log(`Updated car ID: ${carId} status to "${newStatus}"`)

    return NextResponse.json({
      success: true,
      message: `อัปเดตสถานะรถเป็น "${newStatus}" เรียบร้อยแล้ว`,
      status: newStatus,
      hasActiveBookings,
    })
  } catch (error) {
    console.error("Error fixing car status:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการแก้ไขสถานะรถ" }, { status: 500 })
  }
}
