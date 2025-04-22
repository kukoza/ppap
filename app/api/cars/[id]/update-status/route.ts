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

    // รับข้อมูลสถานะใหม่จาก request body
    const { status } = await request.json()
    if (!status) {
      return NextResponse.json({ error: "ไม่ได้ระบุสถานะใหม่" }, { status: 400 })
    }

    console.log(`Updating car ID: ${carId} status to "${status}"`)

    // อัปเดตสถานะรถ
    await executeQuery(`UPDATE Cars SET status = ? WHERE id = ?`, [status, carId])

    return NextResponse.json({
      success: true,
      message: `อัปเดตสถานะรถเป็น "${status}" เรียบร้อยแล้ว`,
      status,
    })
  } catch (error) {
    console.error("Error updating car status:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปเดตสถานะรถ" }, { status: 500 })
  }
}
