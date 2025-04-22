import { executeQuery, executeQuerySingle } from "@/lib/db"
import { NextResponse } from "next/server"

// GET: ทดสอบการเชื่อมต่อกับฐานข้อมูลและโครงสร้างตาราง
export async function GET(request: Request) {
  try {
    // ตรวจสอบโครงสร้างตาราง Bookings
    const bookingsColumns = await executeQuery(`SHOW COLUMNS FROM Bookings`, [])

    // ตรวจสอบโครงสร้างตาราง Cars
    const carsColumns = await executeQuery(`SHOW COLUMNS FROM Cars`, [])

    // ดึงข้อมูลการจองที่อนุมัติแล้ว
    const activeBookings = await executeQuery(
      `
      SELECT 
        b.id, b.status, b.startMileage, b.endMileage, b.mileageDiff, b.fuelLevel, b.fuelCost,
        c.id as carId, c.name as carName, c.licensePlate, c.currentMileage
      FROM Bookings b
      JOIN Cars c ON b.carId = c.id
      WHERE b.status = 'อนุมัติแล้ว' AND b.endMileage IS NULL
      LIMIT 5
      `,
      [],
    )

    return NextResponse.json({
      success: true,
      bookingsColumns: bookingsColumns.recordset,
      carsColumns: carsColumns.recordset,
      activeBookings: activeBookings.recordset,
      message: "Database connection test successful",
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      {
        error: "Database test failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// POST: ทดสอบการอัปเดตข้อมูล
export async function POST(request: Request) {
  try {
    const { bookingId, endMileage, notes, fuelLevel, fuelCost } = await request.json()

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!bookingId || !endMileage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // ดึงข้อมูลการจอง
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
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // คำนวณระยะทางที่ใช้
    const startMileage = booking.startMileage || booking.currentMileage || 0
    const mileageDiff = endMileage - startMileage

    // ทดสอบการอัปเดตข้อมูล (ไม่ได้อัปเดตจริง)
    return NextResponse.json({
      success: true,
      message: "Test successful",
      data: {
        bookingId,
        endMileage,
        startMileage,
        mileageDiff,
        notes,
        fuelLevel,
        fuelCost,
        booking,
      },
    })
  } catch (error) {
    console.error("Test update error:", error)
    return NextResponse.json(
      {
        error: "Test update failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
