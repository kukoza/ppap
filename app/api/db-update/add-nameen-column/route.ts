import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET() {
  try {
    // ตรวจสอบว่ามีคอลัมน์ nameEn ในตาราง BusinessCards หรือไม่
    try {
      await executeQuery("SHOW COLUMNS FROM BusinessCards LIKE 'nameEn'", [])
      return NextResponse.json({ message: "nameEn column already exists" })
    } catch (error) {
      // ถ้าไม่มีคอลัมน์ nameEn ให้เพิ่มคอลัมน์
      console.log("Adding nameEn column to BusinessCards table")
      try {
        await executeQuery("ALTER TABLE BusinessCards ADD COLUMN nameEn VARCHAR(255)", [])
        return NextResponse.json({ message: "nameEn column added successfully" })
      } catch (alterError) {
        console.error("Error adding nameEn column:", alterError)
        return NextResponse.json({ error: "Failed to add nameEn column" }, { status: 500 })
      }
    }
  } catch (error) {
    console.error("Error checking/adding nameEn column:", error)
    return NextResponse.json({ error: "Failed to check/add nameEn column" }, { status: 500 })
  }
}
