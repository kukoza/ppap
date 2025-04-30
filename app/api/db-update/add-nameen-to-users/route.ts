import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET() {
  try {
    // ตรวจสอบว่ามีคอลัมน์ name_en ในตาราง users หรือไม่
    try {
      await executeQuery("SHOW COLUMNS FROM users LIKE 'name_en'", [])
      return NextResponse.json({ message: "name_en column already exists in users table" })
    } catch (error) {
      // ถ้าไม่มีคอลัมน์ name_en ให้เพิ่มคอลัมน์
      console.log("Adding name_en column to users table")
      try {
        await executeQuery("ALTER TABLE users ADD COLUMN name_en VARCHAR(255)", [])
        return NextResponse.json({ message: "name_en column added successfully to users table" })
      } catch (alterError) {
        console.error("Error adding name_en column to users table:", alterError)
        return NextResponse.json({ error: "Failed to add name_en column to users table" }, { status: 500 })
      }
    }
  } catch (error) {
    console.error("Error checking/adding name_en column to users table:", error)
    return NextResponse.json({ error: "Failed to check/add name_en column to users table" }, { status: 500 })
  }
}
