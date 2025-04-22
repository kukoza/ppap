import { executeQuerySingle } from "@/lib/db"
import { NextResponse } from "next/server"
import { createHash } from "crypto"

// ฟังก์ชันสำหรับเข้ารหัสรหัสผ่าน
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

// ฟังก์ชันสำหรับตรวจสอบรหัสผ่าน
function verifyPassword(password: string, hashedPassword: string): boolean {
  const hashed = createHash("sha256").update(password).digest("hex")
  return hashed === hashedPassword
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    const { currentPassword, newPassword } = await request.json()

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // ดึงรหัสผ่านปัจจุบันของผู้ใช้
    const user = await executeQuerySingle(
      `
      SELECT password FROM Users WHERE id = ?
      `,
      [userId],
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // ตรวจสอบรหัสผ่านปัจจุบัน
    const passwordMatch = verifyPassword(currentPassword, (user as any).password)
    if (!passwordMatch) {
      return NextResponse.json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 401 })
    }

    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = hashPassword(newPassword)

    // อัปเดตรหัสผ่านใหม่
    await executeQuerySingle(
      `
      UPDATE Users SET password = ? WHERE id = ?
      `,
      [hashedPassword, userId],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
