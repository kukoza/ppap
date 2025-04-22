import { executeQuerySingle } from "@/lib/db"
import { NextResponse } from "next/server"

// GET: ดึงข้อมูลประเภทรถตาม ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const carTypeId = params.id

    const carType = await executeQuerySingle(
      `
      SELECT id, name, description, capacity, createdAt
      FROM CarTypes
      WHERE id = ?
      `,
      [carTypeId],
    )

    if (!carType) {
      return NextResponse.json({ error: "Car type not found" }, { status: 404 })
    }

    return NextResponse.json(carType)
  } catch (error) {
    console.error("Error fetching car type:", error)
    return NextResponse.json({ error: "Failed to fetch car type" }, { status: 500 })
  }
}

// PUT: อัปเดตข้อมูลประเภทรถ
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const carTypeId = params.id
    const { name, description, capacity } = await request.json()

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !description || !capacity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // ตรวจสอบว่าประเภทรถมีอยู่จริงหรือไม่
    const existingCarType = await executeQuerySingle(`SELECT id FROM CarTypes WHERE id = ?`, [carTypeId])

    if (!existingCarType) {
      return NextResponse.json({ error: "Car type not found" }, { status: 404 })
    }

    // ตรวจสอบว่าชื่อประเภทรถซ้ำหรือไม่ (ยกเว้นประเภทรถนี้)
    const duplicateName = await executeQuerySingle(`SELECT id FROM CarTypes WHERE name = ? AND id != ?`, [
      name,
      carTypeId,
    ])

    if (duplicateName) {
      return NextResponse.json({ error: "Car type name already exists" }, { status: 409 })
    }

    // อัปเดตข้อมูลประเภทรถ
    await executeQuerySingle(
      `
      UPDATE CarTypes
      SET name = ?, description = ?, capacity = ?
      WHERE id = ?
      `,
      [name, description, capacity, carTypeId],
    )

    // ดึงข้อมูลประเภทรถที่อัปเดตแล้ว
    const updatedCarType = await executeQuerySingle(
      `
      SELECT id, name, description, capacity, createdAt
      FROM CarTypes
      WHERE id = ?
      `,
      [carTypeId],
    )

    return NextResponse.json(updatedCarType)
  } catch (error) {
    console.error("Error updating car type:", error)
    return NextResponse.json({ error: "Failed to update car type" }, { status: 500 })
  }
}

// DELETE: ลบประเภทรถ
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const carTypeId = params.id

    // ตรวจสอบว่าประเภทรถมีอยู่จริงหรือไม่
    const existingCarType = await executeQuerySingle(`SELECT id FROM CarTypes WHERE id = ?`, [carTypeId])

    if (!existingCarType) {
      return NextResponse.json({ error: "Car type not found" }, { status: 404 })
    }

    // ตรวจสอบว่ามีรถที่ใช้ประเภทรถนี้อยู่หรือไม่
    const carsUsingType = await executeQuerySingle(
      `SELECT COUNT(*) as count FROM Cars WHERE type = (SELECT name FROM CarTypes WHERE id = ?)`,
      [carTypeId],
    )

    if ((carsUsingType as any).count > 0) {
      return NextResponse.json({ error: "Cannot delete car type that is in use" }, { status: 400 })
    }

    // ลบประเภทรถ
    await executeQuerySingle(`DELETE FROM CarTypes WHERE id = ?`, [carTypeId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting car type:", error)
    return NextResponse.json({ error: "Failed to delete car type" }, { status: 500 })
  }
}
