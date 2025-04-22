import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET() {
  try {
    // ตรวจสอบว่ามีคอลัมน์ branch_address_th และ branch_address_en อยู่แล้วหรือไม่
    try {
      await executeQuery(`SELECT branch_address_th, branch_address_en FROM business_cards LIMIT 1`)
      return NextResponse.json({ success: true, message: "Columns already exist" })
    } catch (error) {
      // ถ้าเกิด error แสดงว่าคอลัมน์ยังไม่มี ให้เพิ่มคอลัมน์
      try {
        await executeQuery(`
          ALTER TABLE business_cards 
          ADD COLUMN branch_address_th TEXT AFTER address_en,
          ADD COLUMN branch_address_en TEXT AFTER branch_address_th
        `)
        return NextResponse.json({ success: true, message: "Columns added successfully" })
      } catch (alterError) {
        console.error("Error adding branch_address columns:", alterError)
        return NextResponse.json({ success: false, error: alterError }, { status: 500 })
      }
    }
  } catch (err) {
    console.error("Error checking or adding columns:", err)
    return NextResponse.json({ success: false, error: err }, { status: 500 })
  }
}
