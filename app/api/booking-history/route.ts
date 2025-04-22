import { executeQuery } from "@/lib/db"
import { NextResponse } from "next/server"

// GET: ดึงข้อมูลประวัติการจองทั้งหมด (เฉพาะที่เสร็จสิ้นแล้ว)
export async function GET() {
  try {
    const result = await executeQuery(
      `
      SELECT 
        b.id, b.userId, b.carId, b.startDate, b.endDate, b.startTime, b.endTime, 
        b.purpose, b.destination, b.status, b.startMileage, b.endMileage, b.mileageDiff,
        b.fuelLevel, b.fuelCost, b.notes, b.createdAt, b.approvedAt, b.approvedBy,
        u.name as userName, u.department as userDepartment, u.email as userEmail, u.phone as userPhone,
        c.name as carName, c.type as carType, c.licensePlate,
        a.name as approverName
      FROM Bookings b
      JOIN Users u ON b.userId = u.id
      JOIN Cars c ON b.carId = c.id
      LEFT JOIN Users a ON b.approvedBy = a.id
      WHERE b.status = 'เสร็จสิ้น'
      ORDER BY b.endDate DESC, b.endTime DESC
      `,
      [],
    )

    // แปลงข้อมูลให้อยู่ในรูปแบบที่เหมาะสม
    const bookingHistory = result.recordset.map((booking: any) => {
      return {
        id: booking.id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        purpose: booking.purpose,
        destination: booking.destination,
        status: booking.status,
        startMileage: booking.startMileage || 0,
        endMileage: booking.endMileage || 0,
        mileageDiff:
          booking.mileageDiff ||
          (booking.endMileage && booking.startMileage ? booking.endMileage - booking.startMileage : 0),
        fuelLevel: booking.fuelLevel || "-",
        fuelCost: booking.fuelCost || 0,
        notes: booking.notes || "",
        createdAt: booking.createdAt,
        approvedAt: booking.approvedAt,
        user: {
          name: booking.userName,
          department: booking.userDepartment,
          email: booking.userEmail,
          phone: booking.userPhone,
          avatar: "/placeholder.svg?height=40&width=40", // ใช้รูปแทนไปก่อน
        },
        car: {
          name: booking.carName,
          type: booking.carType,
          licensePlate: booking.licensePlate,
        },
        approver: booking.approverName
          ? {
              name: booking.approverName,
            }
          : null,
      }
    })

    return NextResponse.json(bookingHistory)
  } catch (error) {
    console.error("Error fetching booking history:", error)
    return NextResponse.json({ error: "Failed to fetch booking history" }, { status: 500 })
  }
}
