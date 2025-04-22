import { executeQuery } from "@/lib/db"
import { NextResponse } from "next/server"

// GET: ดึงข้อมูลการซ่อมบำรุงทั้งหมด
export async function GET() {
  try {
    const result = await executeQuery(
      `
      SELECT m.id, m.carId, m.serviceDate, m.serviceType, m.description, 
             m.cost, m.mileage, m.nextServiceDate, m.nextServiceMileage, m.createdAt,
             c.name as carName, c.licensePlate,
             u.name as createdByName
      FROM Maintenance m
      JOIN Cars c ON m.carId = c.id
      LEFT JOIN Users u ON m.createdBy = u.id
      ORDER BY m.serviceDate DESC
    `,
      [],
    )

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error fetching maintenance records:", error)
    return NextResponse.json({ error: "Failed to fetch maintenance records" }, { status: 500 })
  }
}

// POST: เพิ่มข้อมูลการซ่อมบำรุงใหม่
export async function POST(request: Request) {
  try {
    const {
      carId,
      serviceDate,
      serviceType,
      description,
      cost,
      mileage,
      nextServiceDate,
      nextServiceMileage,
      createdBy,
    } = await request.json()

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!carId || !serviceDate || !serviceType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // เพิ่มข้อมูลการซ่อมบำรุงใหม่
    const result = await executeQuery(
      `
      INSERT INTO Maintenance (carId, serviceDate, serviceType, description, cost, mileage, 
                              nextServiceDate, nextServiceMileage, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      
      SELECT LAST_INSERT_ID() AS id;
    `,
      [
        carId,
        serviceDate,
        serviceType,
        description || null,
        cost || null,
        mileage || null,
        nextServiceDate || null,
        nextServiceMileage || null,
        createdBy || null,
      ],
    )

    const maintenanceId = result.recordset[0].id

    // อัปเดตข้อมูลรถ
    await executeQuery(
      `
      UPDATE Cars 
      SET lastService = ?, nextService = ?, currentMileage = ?
      WHERE id = ?
    `,
      [serviceDate, nextServiceDate || null, mileage || null, carId],
    )

    return NextResponse.json(
      {
        id: maintenanceId,
        carId,
        serviceDate,
        serviceType,
        description,
        cost,
        mileage,
        nextServiceDate,
        nextServiceMileage,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating maintenance record:", error)
    return NextResponse.json({ error: "Failed to create maintenance record" }, { status: 500 })
  }
}
