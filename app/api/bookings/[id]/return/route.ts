import { executeQuery, executeQuerySingle } from "@/lib/db"
import { NextResponse } from "next/server"

// POST: บันทึกการคืนรถ
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // แปลง params.id เป็นตัวเลข
    const bookingId = Number.parseInt(params.id, 10)
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: "รหัสการจองไม่ถูกต้อง" }, { status: 400 })
    }

    // รับข้อมูลจาก request body
    const data = await request.json()
    console.log("Return car request data:", data)

    // แปลงข้อมูลให้เป็นรูปแบบที่ถูกต้อง
    const endMileage = Number.parseInt(data.endMileage, 10)
    const notes = data.notes || null
    const fuelLevel = data.fuelLevel || null
    const fuelCost = data.fuelCost ? Number.parseFloat(data.fuelCost) : null

    console.log("Parsed return car data:", { bookingId, endMileage, notes, fuelLevel, fuelCost })

    // ตรวจสอบข้อมูลที่จำเป็น
    if (isNaN(endMileage)) {
      return NextResponse.json({ error: "กรุณาระบุเลขไมล์หลังใช้งานเป็นตัวเลข" }, { status: 400 })
    }

    // ตรวจสอบว่าการจองมีอยู่จริงหรือไม่
    const booking = await executeQuerySingle(
      `
      SELECT b.id, b.carId, b.status, b.startMileage, c.currentMileage
      FROM Bookings b
      JOIN Cars c ON b.carId = c.id
      WHERE b.id = ?
      `,
      [bookingId],
    )

    if (!booking) {
      return NextResponse.json({ error: "ไม่พบข้อมูลการจอง" }, { status: 404 })
    }

    console.log("Found booking:", booking)

    // ตรวจสอบว่าการจองอยู่ในสถานะที่ถูกต้อง
    if (booking.status !== "อนุมัติแล้ว") {
      return NextResponse.json({ error: "การจองนี้ไม่อยู่ในสถานะที่สามารถคืนรถได้" }, { status: 400 })
    }

    // ตรวจสอบว่าเลขไมล์หลังใช้งานมากกว่าเลขไมล์ก่อนใช้งาน
    const startMileage = booking.startMileage || booking.currentMileage || 0
    if (endMileage <= startMileage) {
      return NextResponse.json({ error: "เลขไมล์หลังใช้งานต้องมากกว่าเลขไมล์ก่อนใช้งาน" }, { status: 400 })
    }

    // คำนวณระยะทางที่ใช้
    const mileageDiff = endMileage - startMileage

    console.log("Updating booking with return data:", {
      endMileage,
      mileageDiff,
      fuelLevel,
      fuelCost,
      notes,
    })

    // อัปเดตข้อมูลการจอง - ไม่ใช้คอลัมน์ returnedAt
    await executeQuery(
      `
      UPDATE Bookings
      SET 
        status = 'เสร็จสิ้น',
        endMileage = ?,
        mileageDiff = ?,
        notes = ?,
        fuelLevel = ?,
        fuelCost = ?
      WHERE id = ?
      `,
      [endMileage, mileageDiff, notes, fuelLevel, fuelCost, bookingId],
    )

    console.log("Updating car status and mileage:", {
      carId: booking.carId,
      endMileage,
    })

    // อัปเดตเลขไมล์ปัจจุบันของรถและสถานะรถ
    await executeQuery(
      `
      UPDATE Cars
      SET currentMileage = ?, status = 'ว่าง'
      WHERE id = ?
      `,
      [endMileage, booking.carId],
    )

    return NextResponse.json({
      success: true,
      message: "บันทึกการคืนรถเรียบร้อยแล้ว",
      data: {
        bookingId,
        endMileage,
        distanceTraveled: mileageDiff,
      },
    })
  } catch (error) {
    console.error("Error returning car:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกการคืนรถ" }, { status: 500 })
  }
}
