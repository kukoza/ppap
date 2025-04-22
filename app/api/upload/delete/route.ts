import { NextResponse } from "next/server"
import { unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const { filePath } = await request.json()

    if (!filePath) {
      return NextResponse.json({ error: "No file path provided" }, { status: 400 })
    }

    // ตรวจสอบว่าเป็น path ที่อยู่ในโฟลเดอร์ uploads เท่านั้น
    if (!filePath.startsWith("/uploads/")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 })
    }

    // แปลง path จาก URL เป็น path ในระบบไฟล์
    const fullPath = path.join(process.cwd(), "public", filePath)

    // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
    if (!existsSync(fullPath)) {
      return NextResponse.json({ success: true, message: "File does not exist" })
    }

    // ลบไฟล์
    await unlink(fullPath)

    return NextResponse.json({ success: true, message: "File deleted successfully" })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}
