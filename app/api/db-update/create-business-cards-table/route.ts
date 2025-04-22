import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

export async function GET() {
  try {
    // ตรวจสอบว่ามีตาราง business_cards อยู่แล้วหรือไม่
    try {
      await executeQuery(`SELECT 1 FROM business_cards LIMIT 1`)
      console.log("Business cards table already exists")
      return NextResponse.json({ message: "Business cards table already exists" })
    } catch (error) {
      console.log("Table does not exist, creating now...")
      // ถ้าเกิด error แสดงว่าตารางยังไม่มี ให้สร้างตาราง
    }

    // สร้างตาราง business_cards โดยไม่มี foreign key constraint
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS business_cards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name_th VARCHAR(255),
        name_en VARCHAR(255),
        position_th VARCHAR(255),
        position_en VARCHAR(255),
        department_th VARCHAR(255),
        department_en VARCHAR(255),
        company_th VARCHAR(255),
        company_en VARCHAR(255),
        address_th TEXT,
        address_en TEXT,
        tel VARCHAR(100),
        fax VARCHAR(100),
        email VARCHAR(255),
        website VARCHAR(255),
        line_id VARCHAR(100),
        facebook VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // ไม่ต้องเพิ่ม foreign key constraint เพื่อป้องกันปัญหา

    return NextResponse.json({ message: "Business cards table created successfully" })
  } catch (error) {
    console.error("Error creating business cards table:", error)
    return NextResponse.json({ error: "Failed to create business cards table", details: error }, { status: 500 })
  }
}
