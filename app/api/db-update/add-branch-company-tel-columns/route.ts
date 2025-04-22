import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET() {
  try {
    // ตรวจสอบว่ามีคอลัมน์ branch และ company_tel อยู่แล้วหรือไม่
    try {
      await executeQuery(`SELECT branch, company_tel FROM business_cards LIMIT 1`)
      console.log("Branch and company_tel columns already exist")
      return NextResponse.json({ message: "Branch and company_tel columns already exist" })
    } catch (error) {
      console.log("Columns do not exist, adding now...")
      // ถ้าเกิด error แสดงว่าคอลัมน์ยังไม่มี ให้เพิ่มคอลัมน์
    }

    // เพิ่มคอลัมน์ branch และ company_tel ในตาราง business_cards
    await executeQuery(`
      ALTER TABLE business_cards 
      ADD COLUMN branch VARCHAR(255) AFTER company_en,
      ADD COLUMN company_tel VARCHAR(100) AFTER tel
    `)

    return NextResponse.json({ message: "Branch and company_tel columns added successfully" })
  } catch (error) {
    console.error("Error adding columns:", error)
    return NextResponse.json({ error: "Failed to add columns", details: error }, { status: 500 })
  }
}
