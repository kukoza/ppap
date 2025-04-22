import { executeQuery } from "@/lib/db"
import { NextResponse } from "next/server"
import { createHash } from "crypto"

// ฟังก์ชันสำหรับเข้ารหัสรหัสผ่าน
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id
    const { newPassword } = await request.json()

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = hashPassword(newPassword)

    // อัปเดตรหัสผ่านใหม่
    await executeQuery(
      `
      UPDATE Users SET password = ? WHERE id = ?
      `,
      [hashedPassword, userId],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
