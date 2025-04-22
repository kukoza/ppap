import { NextResponse } from "next/server"
import { unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

// กำหนดโฟลเดอร์สำหรับเก็บรูปภาพโปรไฟล์
const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/avatars")

export async function POST(request: Request) {
  try {
    const { fileName } = await request.json()

    if (!fileName) {
      return NextResponse.json({ error: "No file name provided" }, { status: 400 })
    }

    console.log(`Received delete request for file: ${fileName}`)

    // ตรวจสอบว่าชื่อไฟล์ไม่มีการพยายามเข้าถึงไดเรกทอรีอื่น
    if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
      console.error(`Invalid file name: ${fileName}`)
      return NextResponse.json({ error: "Invalid file name" }, { status: 400 })
    }

    const filePath = path.join(UPLOAD_DIR, fileName)
    console.log(`Full file path to delete: ${filePath}`)

    // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`)
      return NextResponse.json({ error: "File not found", path: filePath }, { status: 404 })
    }

    // ลบไฟล์
    try {
      await unlink(filePath)
      console.log(`Successfully deleted file: ${filePath}`)
      return NextResponse.json({ success: true, message: "File deleted successfully" })
    } catch (err) {
      console.error(`Error during file deletion: ${filePath}`, err)
      return NextResponse.json({ error: "Failed to delete file", details: err }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in delete avatar API:", error)
    return NextResponse.json({ error: "Failed to delete avatar", details: error }, { status: 500 })
  }
}
