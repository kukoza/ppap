import { executeQuerySingle } from "@/lib/db"
import { NextResponse } from "next/server"

// GET: ดึงข้อมูลผู้ใช้ตาม ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    const user = await executeQuerySingle(
      `
      SELECT id, name, email, department, role, phone, employeeId, licenseNumber, avatar
      FROM Users
      WHERE id = ?
      `,
      [userId],
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

// PUT: อัปเดตข้อมูลผู้ใช้
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    // รับข้อมูลจาก request
    const requestBody = await request.text()
    console.log("Raw request body:", requestBody)

    let userData
    try {
      userData = JSON.parse(requestBody)
      console.log("Parsed user data:", userData)
    } catch (e) {
      console.error("Error parsing request body:", e)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    console.log("Received update request for user ID:", userId)

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!userData.name || !userData.email || !userData.department) {
      console.error("Missing required fields")
      return NextResponse.json(
        {
          error: "Missing required fields",
          received: userData,
        },
        { status: 400 },
      )
    }

    // ตรวจสอบว่าผู้ใช้มีอยู่จริงหรือไม่
    const existingUser = await executeQuerySingle(`SELECT id FROM Users WHERE id = ?`, [userId])

    if (!existingUser) {
      console.error("User not found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // ตรวจสอบว่าอีเมลซ้ำหรือไม่ (ยกเว้นผู้ใช้คนนี้)
    const duplicateEmail = await executeQuerySingle(`SELECT id FROM Users WHERE email = ? AND id != ?`, [
      userData.email,
      userId,
    ])

    if (duplicateEmail) {
      console.error("Email already exists")
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    // อัปเดตข้อมูลผู้ใช้
    console.log("Updating user data in database")

    // สร้างคำสั่ง SQL และพารามิเตอร์
    const updateQuery = `
      UPDATE Users
      SET name = ?, email = ?, department = ?, role = ?, phone = ?, employeeId = ?, licenseNumber = ?, avatar = ?
      WHERE id = ?
    `

    const updateParams = [
      userData.name,
      userData.email,
      userData.department,
      userData.role,
      userData.phone || null,
      userData.employeeId || null,
      userData.licenseNumber || null,
      userData.avatar || null,
      userId,
    ]

    console.log("Update query:", updateQuery)
    console.log("Update params:", updateParams)

    try {
      await executeQuerySingle(updateQuery, updateParams)
      console.log("User data updated successfully")
    } catch (dbError) {
      console.error("Database error during update:", dbError)
      return NextResponse.json(
        {
          error: "Database error during update",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
        },
        { status: 500 },
      )
    }

    // ดึงข้อมูลผู้ใช้ที่อัปเดตแล้ว
    const updatedUser = await executeQuerySingle(
      `
      SELECT id, name, email, department, role, phone, employeeId, licenseNumber, avatar
      FROM Users
      WHERE id = ?
      `,
      [userId],
    )

    console.log("Updated user data:", updatedUser)

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      {
        error: "Failed to update user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE: ลบผู้ใช้
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    // ตรวจสอบว่าผู้ใช้มีอยู่จริงหรือไม่
    const existingUser = await executeQuerySingle(`SELECT id, role, avatar FROM Users WHERE id = ?`, [userId])

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // ตรวจสอบว่าเป็นผู้ดูแลระบบคนสุดท้ายหรือไม่
    if ((existingUser as any).role === "ผู้ดูแลระบบ") {
      const adminCount = await executeQuerySingle(`SELECT COUNT(*) as count FROM Users WHERE role = 'ผู้ดูแลระบบ'`, [])

      if ((adminCount as any).count <= 1) {
        return NextResponse.json({ error: "Cannot delete the last administrator" }, { status: 400 })
      }
    }

    // ตรวจสอบว่ามีการจองที่เกี่ยวข้องกับผู้ใช้นี้หรือไม่
    const bookingCount = await executeQuerySingle(
      `SELECT COUNT(*) as count FROM Bookings WHERE userId = ? AND status != 'ยกเลิก'`,
      [userId],
    )

    if ((bookingCount as any).count > 0) {
      return NextResponse.json({ error: "Cannot delete user with active bookings" }, { status: 400 })
    }

    // ลบรูปโปรไฟล์ถ้ามี
    if ((existingUser as any).avatar) {
      try {
        // ดึงชื่อไฟล์จาก URL
        const avatarUrl = (existingUser as any).avatar
        if (avatarUrl && typeof avatarUrl === "string") {
          const fileName = avatarUrl.split("/").pop()
          if (fileName) {
            await fetch("/api/upload/avatar/delete", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ fileName }),
            })
          }
        }
      } catch (error) {
        console.error("Error deleting avatar file:", error)
        // ไม่ต้องหยุดการลบผู้ใช้ถ้าลบไฟล์ไม่สำเร็จ
      }
    }

    // ลบผู้ใช้
    await executeQuerySingle(`DELETE FROM Users WHERE id = ?`, [userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
