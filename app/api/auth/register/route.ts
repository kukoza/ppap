import { executeQuerySingle, executeInsert } from "@/lib/db"
import { NextResponse } from "next/server"
import { createHash } from "crypto"

// เพิ่มฟังก์ชันสำหรับเข้ารหัสรหัสผ่านด้วย SHA-256
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

export async function POST(request: Request) {
  try {
    const { name, email, password, department } = await request.json()

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !email || !password || !department) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // ตรวจสอบว่าอีเมลซ้ำหรือไม่
    const existingUser = await executeQuerySingle(`SELECT id FROM Users WHERE email = ?`, [email])

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    // เข้ารหัสรหัสผ่านก่อนบันทึกลงฐานข้อมูล
    const hashedPassword = hashPassword(password)
    console.log("Registering user with hashed password:", { email, hashedPassword })

    // เพิ่มผู้ใช้ใหม่
    const result = await executeInsert(
      `
    INSERT INTO Users (name, email, password, department, role)
    VALUES (?, ?, ?, ?, 'ผู้ใช้งาน')
    `,
      [name, email, hashedPassword, department],
    )

    return NextResponse.json(
      {
        id: result.insertId,
        name,
        email,
        department,
        role: "ผู้ใช้งาน",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 })
  }
}
