import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

// กำหนดโฟลเดอร์สำหรับเก็บรูปภาพ
const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/cars")

// ตรวจสอบและสร้างโฟลเดอร์ถ้ายังไม่มี
async function ensureUploadDir() {
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
      console.log(`Created directory: ${UPLOAD_DIR}`)
    }
    return true
  } catch (error) {
    console.error("Error creating upload directory:", error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    // ตรวจสอบว่ามีโฟลเดอร์สำหรับเก็บรูปภาพหรือไม่
    const dirExists = await ensureUploadDir()
    if (!dirExists) {
      return NextResponse.json({ error: "Could not create upload directory" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // ตรวจสอบประเภทไฟล์
    const fileType = file.type
    if (!fileType.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // สร้างชื่อไฟล์ที่ไม่ซ้ำกันโดยใช้ UUID
    const fileExtension = fileType.split("/")[1]
    const fileName = `${uuidv4()}.${fileExtension}`
    const filePath = path.join(UPLOAD_DIR, fileName)

    // อ่านข้อมูลไฟล์และเขียนลงในระบบไฟล์
    const fileBuffer = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(fileBuffer))

    // ส่งกลับ URL ของไฟล์ที่อัปโหลด (ใช้ URL แบบสัมพัทธ์)
    const fileUrl = `/uploads/cars/${fileName}`

    console.log("File uploaded successfully:", {
      fileName,
      fileUrl,
      filePath,
      absolutePath: path.resolve(filePath),
    })

    return NextResponse.json({ success: true, fileName, url: fileUrl })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}

// ฟังก์ชันสำหรับลบไฟล์รูปภาพ
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get("fileName")

    if (!fileName) {
      return NextResponse.json({ error: "File name is required" }, { status: 400 })
    }

    const filePath = path.join(UPLOAD_DIR, fileName)

    // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
    if (existsSync(filePath)) {
      // ใช้ fs/promises แทน
      const fs = require("fs/promises")
      await fs.unlink(filePath)
      return NextResponse.json({ success: true, message: "File deleted successfully" })
    } else {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 })
  }
}
