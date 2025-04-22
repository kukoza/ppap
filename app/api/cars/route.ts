import { executeQuery, executeInsert } from "@/lib/db"
import { NextResponse } from "next/server"

// GET: ดึงข้อมูลรถทั้งหมด
export async function GET(request: Request) {
  try {
    // ดึงพารามิเตอร์จาก URL
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // สร้างคำสั่ง SQL ตามเงื่อนไข
    let query = `
      SELECT c.id, c.name, c.type, c.licensePlate, c.status, 
             c.initialMileage, c.currentMileage, c.lastService, 
             c.nextService, c.image, c.fileName, c.createdAt,
             ct.name as typeName, ct.capacity
      FROM Cars c
      LEFT JOIN CarTypes ct ON c.typeId = ct.id
    `

    const params: any[] = []

    if (status) {
      query += ` WHERE c.status = ?`
      params.push(status)
    }

    query += ` ORDER BY c.name`

    const result = await executeQuery(query, params)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error fetching cars:", error)
    return NextResponse.json({ error: "Failed to fetch cars" }, { status: 500 })
  }
}

// POST: เพิ่มรถใหม่
export async function POST(request: Request) {
  try {
    const { name, type, licensePlate, initialMileage, image, fileName, typeId } = await request.json()

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !type || !licensePlate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // ตรวจสอบว่าทะเบียนรถซ้ำหรือไม่
    const existingCar = await executeQuery(
      `
      SELECT COUNT(*) as count FROM Cars WHERE licensePlate = ?
      `,
      [licensePlate],
    )

    if ((existingCar.recordset[0] as any).count > 0) {
      return NextResponse.json({ error: "License plate already exists" }, { status: 409 })
    }

    // เพิ่มรถใหม่
    const result = await executeInsert(
      `
      INSERT INTO Cars (name, type, licensePlate, initialMileage, currentMileage, status, image, fileName, typeId)
      VALUES (?, ?, ?, ?, ?, 'ว่าง', ?, ?, ?);
      `,
      [
        name,
        type,
        licensePlate,
        initialMileage || 0,
        initialMileage || 0,
        image || null,
        fileName || null,
        typeId || null,
      ],
    )

    return NextResponse.json(
      {
        id: result.insertId,
        name,
        type,
        licensePlate,
        initialMileage: initialMileage || 0,
        currentMileage: initialMileage || 0,
        status: "ว่าง",
        image,
        fileName,
        typeId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating car:", error)
    return NextResponse.json({ error: "Failed to create car" }, { status: 500 })
  }
}
