import { executeQuery } from "@/lib/db"
import { NextResponse } from "next/server"

// GET: ดึงข้อมูลการจองที่อนุมัติแล้วและกำลังใช้งานอยู่
export async function GET() {
  try {
    const result = await executeQuery(
      `
      SELECT 
        b.id, b.userId, b.carId, b.startDate, b.endDate, b.startTime, b.endTime, 
        b.purpose, b.destination, b.status, b.startMileage, b.createdAt,
        u.name as userName, u.department, u.email, u.phone, u.avatar as profileImage,
        c.name as carName, c.licensePlate, c.currentMileage, c.type as carTypeName
      FROM Bookings b
      JOIN Users u ON b.userId = u.id
      JOIN Cars c ON b.carId = c.id
      WHERE b.status = 'อนุมัติแล้ว' AND b.endMileage IS NULL
      ORDER BY b.startDate ASC, b.startTime ASC
      `,
      [],
    )

    console.log("Active bookings found:", result.recordset.length)

    // แปลงข้อมูลให้อยู่ในรูปแบบที่เหมาะสม
    const activeBookings = result.recordset.map((booking: any) => {
      // ตรวจสอบและแปลงค่า startMileage ให้เป็นตัวเลข
      const startMileage =
        booking.startMileage !== null && booking.startMileage !== undefined
          ? Number.parseInt(booking.startMileage, 10)
          : booking.currentMileage !== null && booking.currentMileage !== undefined
            ? Number.parseInt(booking.currentMileage, 10)
            : 0

      return {
        id: booking.id,
        userId: booking.userId,
        carId: booking.carId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        purpose: booking.purpose,
        destination: booking.destination || null,
        status: booking.status,
        startMileage: startMileage,
        user: {
          name: booking.userName,
          department: booking.department,
          email: booking.email,
          phone: booking.phone,
          avatar: booking.profileImage || `/placeholder.svg?height=40&width=40`,
        },
        car: {
          name: booking.carName,
          type: booking.carTypeName,
          licensePlate: booking.licensePlate,
          currentMileage: booking.currentMileage ? Number.parseInt(booking.currentMileage, 10) : 0,
        },
      }
    })

    return NextResponse.json(activeBookings)
  } catch (error) {
    console.error("Error fetching active bookings:", error)
    return NextResponse.json({ error: "Failed to fetch active bookings" }, { status: 500 })
  }
}
