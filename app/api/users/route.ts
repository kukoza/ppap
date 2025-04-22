import { executeQuery, executeInsert, executeQuerySingle } from "@/lib/db"
import { NextResponse } from "next/server"
import { createHash } from "crypto"

// แก้ไขฟังก์ชัน hashPassword ให้ตรงกับที่ใช้ในการลงทะเบียนและเข้าสู่ระบบ
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

// แก้ไขฟังก์ชัน verifyPassword ให้ตรงกับที่ใช้ในการเข้าสู่ระบบ
function verifyPassword(password: string, hashedPassword: string): boolean {
  const hashed = hashPassword(password)
  return hashed === hashedPassword
}

// GET: ดึงข้อมูลผู้ใช้ทั้งหมด
export async function GET() {
  try {
    console.log("Fetching all users")

    // ตรวจสอบการเชื่อมต่อฐานข้อมูลก่อน
    try {
      const testQuery = await executeQuery("SELECT 1 as test", [])
      console.log("Database connection test:", testQuery)
    } catch (dbError) {
      console.error("Database connection test failed:", dbError)
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 },
      )
    }

    const result = await executeQuery(
      `
      SELECT id, name, email, department, role, phone, employeeId, avatar, createdAt
      FROM Users
      ORDER BY name
      `,
      [],
    )

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("Error fetching users:", error)
    // ส่งคืน error ในรูปแบบ JSON แทนที่จะปล่อยให้เป็น uncaught exception
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

// POST: เพิ่มผู้ใช้ใหม่
export async function POST(request: Request) {
  try {
    const { name, email, department, role, password, phone, employeeId, licenseNumber } = await request.json()

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !email || !department || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // ตรวจสอบว่าอีเมลซ้ำหรือไม่
    const existingUser = await executeQuerySingle(
      `
      SELECT COUNT(*) as count FROM Users WHERE email = ?
      `,
      [email],
    )

    if ((existingUser as any).count > 0) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    // เข้ารหัสรหัสผ่านด้วย SHA-256 แทน bcrypt
    const hashedPassword = hashPassword(password)

    // เพิ่มผู้ใช้ใหม่
    const result = await executeInsert(
      `
      INSERT INTO Users (name, email, department, role, password, phone, employeeId, licenseNumber)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        name,
        email,
        department,
        role || "ผู้ใช้งาน",
        hashedPassword,
        phone || null,
        employeeId || null,
        licenseNumber || null,
      ],
    )

    return NextResponse.json(
      {
        id: result.insertId,
        name,
        email,
        department,
        role: role || "ผู้ใช้งาน",
        phone,
        employeeId,
        licenseNumber,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      {
        error: "Failed to create user",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
