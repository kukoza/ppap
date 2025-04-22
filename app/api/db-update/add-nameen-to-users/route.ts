import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET() {
  try {
    // ตรวจสอบว่ามีคอลัมน์ nameEn ในตาราง users หรือไม่
    try {
      await executeQuery("SHOW COLUMNS FROM users LIKE 'nameEn'", [])
      return NextResponse.json({ message: "nameEn column already exists in users table" })
    } catch (error) {
      // ถ้าไม่มีคอลัมน์ nameEn ให้เพิ่มคอลัมน์
      console.log("Adding nameEn column to users table")
      try {
        await executeQuery("ALTER TABLE users ADD COLUMN nameEn VARCHAR(255)", [])
        return NextResponse.json({ message: "nameEn column added successfully to users table" })
      } catch (alterError) {
        console.error("Error adding nameEn column to users table:", alterError)
        return NextResponse.json({ error: "Failed to add nameEn column to users table" }, { status: 500 })
      }
    }
  } catch (error) {
    console.error("Error checking/adding nameEn column to users table:", error)
    return NextResponse.json({ error: "Failed to check/add nameEn column to users table" }, { status: 500 })
  }
}
