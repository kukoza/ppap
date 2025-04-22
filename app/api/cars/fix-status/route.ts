import { executeQuery } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("Starting car status fix process")

    // 1. ดึงข้อมูลรถทั้งหมด
    const cars = await executeQuery(`SELECT id, status FROM Cars`)
    console.log(`Found ${cars.length} cars to check`)

    let updatedCars = 0

    // 2. ตรวจสอบและแก้ไขสถานะรถแต่ละคัน
    for (const car of cars) {
      // ตรวจสอบว่ามีการจองที่มีสถานะ "อนุมัติแล้ว" หรือ "รออนุมัติ" สำหรับรถคันนี้หรือไม่
      const activeBookings = await executeQuery(
        `SELECT COUNT(*) as count FROM Bookings WHERE carId = ? AND (status = 'อนุมัติแล้ว' OR status = 'รออนุมัติ')`,
        [car.id],
      )

      const hasActiveBookings =
        activeBookings &&
        activeBookings.recordset &&
        activeBookings.recordset[0] &&
        activeBookings.recordset[0].count > 0
      console.log(`Car ID: ${car.id}, Status: ${car.status}, Has active bookings: ${hasActiveBookings}`)

      // ถ้ารถมีสถานะ "ไม่ว่าง" แต่ไม่มีการจองที่มีสถานะ "อนุมัติแล้ว" หรือ "รออนุมัติ"
      if (car.status === "ไม่ว่าง" && !hasActiveBookings) {
        console.log(`Updating car ID: ${car.id} from "ไม่ว่าง" to "ว่าง"`)
        await executeQuery(`UPDATE Cars SET status = 'ว่าง' WHERE id = ?`, [car.id])
        updatedCars++
      }

      // ถ้ารถมีสถานะ "ว่าง" แต่มีการจองที่มีสถานะ "อนุมัติแล้ว" หรือ "รออนุมัติ"
      else if (car.status === "ว่าง" && hasActiveBookings) {
        console.log(`Updating car ID: ${car.id} from "ว่าง" to "ไม่ว่าง"`)
        await executeQuery(`UPDATE Cars SET status = 'ไม่ว่าง' WHERE id = ?`, [car.id])
        updatedCars++
      }
    }

    console.log(`Fixed status for ${updatedCars} cars`)

    return NextResponse.json({
      success: true,
      message: `อัปเดตสถานะรถเรียบร้อยแล้ว ${updatedCars} คัน`,
      updatedCars,
    })
  } catch (error) {
    console.error("Error fixing car statuses:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการแก้ไขสถานะรถ" }, { status: 500 })
  }
}
