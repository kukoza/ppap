import { NextResponse } from "next/server"
import { writeFile, mkdir, unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

// กำหนดโฟลเดอร์สำหรับเก็บรูปภาพโปรไฟล์
const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/avatars")

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

// แก้ไขฟังก์ชัน POST เพื่อให้ส่งชื่อไฟล์เก่ากลับไปด้วย
export async function POST(request: Request) {
  try {
    // ตรวจสอบว่ามีโฟลเดอร์สำหรับเก็บรูปภาพหรือไม่
    const dirExists = await ensureUploadDir()
    if (!dirExists) {
      return NextResponse.json({ error: "Could not create upload directory" }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const oldFileName = formData.get("oldFileName") as string | null

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
    const fileName = `avatar-${uuidv4()}.${fileExtension}`
    const filePath = path.join(UPLOAD_DIR, fileName)

    // อ่านข้อมูลไฟล์และเขียนลงในระบบไฟล์
    const fileBuffer = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(fileBuffer))

    // ลบไฟล์เก่าถ้ามี
    if (oldFileName) {
      try {
        const oldFilePath = path.join(UPLOAD_DIR, oldFileName)
        console.log(`Attempting to delete old avatar at path: ${oldFilePath}`)

        if (existsSync(oldFilePath)) {
          await unlink(oldFilePath)
          console.log(`Deleted old avatar: ${oldFileName}`)
        } else {
          console.log(`Old avatar file not found: ${oldFileName}`)
        }
      } catch (error) {
        console.error(`Error deleting old avatar: ${oldFileName}`, error)
        // ไม่ต้อง return error เพราะการลบไฟล์เก่าไม่ควรทำให้การอัปโหลดไฟล์ใหม่ล้มเหลว
      }
    }

    // ส่งกลับ URL ของไฟล์ที่อัปโหลด (ใช้ URL แบบสัมพัทธ์)
    const fileUrl = `/uploads/avatars/${fileName}`

    console.log("Avatar uploaded successfully:", {
      fileName,
      fileUrl,
      filePath,
      absolutePath: path.resolve(filePath),
    })

    return NextResponse.json({ success: true, fileName, url: fileUrl })
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 })
  }
}
