import { executeQuery, executeInsert } from "@/lib/db"
import { NextResponse } from "next/server"

// GET: ดึงข้อมูลประเภทรถทั้งหมด
export async function GET() {
  try {
    const result = await executeQuery(
      `
      SELECT id, name, description, capacity, createdAt
      FROM CarTypes
      ORDER BY name
      `,
      [],
    )

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error fetching car types:", error)
    return NextResponse.json({ error: "Failed to fetch car types" }, { status: 500 })
  }
}

// POST: เพิ่มประเภทรถใหม่
export async function POST(request: Request) {
  try {
    const { name, description, capacity } = await request.json()

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !description || !capacity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // ตรวจสอบว่าชื่อประเภทรถซ้ำหรือไม่
    const existingType = await executeQuery(
      `
      SELECT COUNT(*) as count FROM CarTypes WHERE name = ?
      `,
      [name],
    )

    if ((existingType.recordset[0] as any).count > 0) {
      return NextResponse.json({ error: "Car type name already exists" }, { status: 409 })
    }

    // เพิ่มประเภทรถใหม่
    const result = await executeInsert(
      `
      INSERT INTO CarTypes (name, description, capacity)
      VALUES (?, ?, ?);
      `,
      [name, description, capacity],
    )

    const carTypeId = result.insertId

    return NextResponse.json(
      {
        id: carTypeId,
        name,
        description,
        capacity,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating car type:", error)
    return NextResponse.json({ error: "Failed to create car type" }, { status: 500 })
  }
}
