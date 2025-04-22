import { executeQuery } from "@/lib/db"
import { NextResponse } from "next/server"

// POST: รันคำสั่ง SQL โดยตรง
export async function POST(request: Request) {
  try {
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json({ error: "Missing SQL query" }, { status: 400 })
    }

    // รันคำสั่ง SQL
    const result = await executeQuery(sql, [])

    return NextResponse.json({
      success: true,
      message: "SQL executed successfully",
      result,
    })
  } catch (error) {
    console.error("Error executing SQL:", error)
    return NextResponse.json(
      {
        error: "Failed to execute SQL",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// GET: ดึงข้อมูลโครงสร้างตาราง Bookings
export async function GET() {
  try {
    // ตรวจสอบโครงสร้างตาราง Bookings
    const columns = await executeQuery(`SHOW COLUMNS FROM Bookings`, [])

    return NextResponse.json({
      success: true,
      columns: columns.recordset,
    })
  } catch (error) {
    console.error("Error fetching table structure:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch table structure",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
