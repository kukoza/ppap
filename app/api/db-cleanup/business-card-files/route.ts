import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    // กำหนดโฟลเดอร์ที่ต้องการลบไฟล์
    const certificationsDir = path.join(process.cwd(), "public/uploads/certifications")

    // ตรวจสอบว่าโฟลเดอร์มีอยู่หรือไม่
    try {
      await fs.access(certificationsDir)

      // อ่านรายชื่อไฟล์ในโฟลเดอร์
      const files = await fs.readdir(certificationsDir)

      // ลบไฟล์ทั้งหมดในโฟลเดอร์
      for (const file of files) {
        const filePath = path.join(certificationsDir, file)
        await fs.unlink(filePath)
        console.log(`Deleted file: ${filePath}`)
      }

      return NextResponse.json({
        success: true,
        message: "ลบไฟล์นามบัตรในเครื่องเรียบร้อยแล้ว",
        filesDeleted: files.length,
      })
    } catch (error) {
      // ถ้าโฟลเดอร์ไม่มีอยู่ ให้ส่งข้อความว่าไม่มีไฟล์ที่ต้องลบ
      return NextResponse.json({
        success: true,
        message: "ไม่มีไฟล์นามบัตรที่ต้องลบ",
      })
    }
  } catch (error) {
    console.error("Error cleaning up business card files:", error)
    return NextResponse.json({ error: "ไม่สามารถลบไฟล์นามบัตรได้" }, { status: 500 })
  }
}
