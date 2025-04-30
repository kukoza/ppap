import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET() {
  try {
    // ตรวจสอบว่ามีคอลัมน์ name_en ในตาราง business_cards หรือไม่
    try {
      await executeQuery("SHOW COLUMNS FROM business_cards LIKE 'name_en'", [])
      return NextResponse.json({ message: "name_en column already exists" })
    } catch (error) {
      // ถ้าไม่มีคอลัมน์ name_en ให้เพิ่มคอลัมน์
      console.log("Adding name_en column to business_cards table")
      try {
        await executeQuery("ALTER TABLE business_cards ADD COLUMN name_en VARCHAR(255)", [])
        return NextResponse.json({ message: "name_en column added successfully" })
      } catch (alterError) {
        console.error("Error adding name_en column:", alterError)
        return NextResponse.json({ error: "Failed to add name_en column" }, { status: 500 })
      }
    }
  } catch (error) {
    console.error("Error checking/adding name_en column:", error)
    return NextResponse.json({ error: "Failed to check/add name_en column" }, { status: 500 })
  }
}
