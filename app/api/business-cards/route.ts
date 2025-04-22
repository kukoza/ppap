import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, executeQuerySingle, executeInsert } from "@/lib/db"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

// สร้างตาราง business_cards ถ้ายังไม่มี
async function ensureTableExists() {
  try {
    // ตรวจสอบว่ามีตาราง business_cards อยู่แล้วหรือไม่
    try {
      await executeQuery(`SELECT 1 FROM business_cards LIMIT 1`)
      return { exists: true }
    } catch (error) {
      // ถ้าเกิด error แสดงว่าตารางยังไม่มี ให้สร้างตาราง
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
          branch VARCHAR(255),
          address_th TEXT,
          address_en TEXT,
          branch_address_th TEXT,
          branch_address_en TEXT,
          tel VARCHAR(100),
          company_tel VARCHAR(100),
          fax VARCHAR(100),
          email VARCHAR(255),
          website VARCHAR(255),
          line_id VARCHAR(100),
          facebook VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `)
      return { exists: false, created: true }
    }
  } catch (err) {
    console.error("Error ensuring table exists:", err)
    throw err
  }
}

// ตรวจสอบและเพิ่มคอลัมน์ใหม่ถ้ายังไม่มี
async function ensureColumnsExist() {
  try {
    // ตรวจสอบว่ามีคอลัมน์ branch และ company_tel อยู่แล้วหรือไม่
    try {
      await executeQuery(`SELECT branch, company_tel FROM business_cards LIMIT 1`)
    } catch (error) {
      // ถ้าเกิด error แสดงว่าคอลัมน์ยังไม่มี ให้เพิ่มคอลัมน์
      try {
        await executeQuery(`
          ALTER TABLE business_cards 
          ADD COLUMN branch VARCHAR(255) AFTER company_en,
          ADD COLUMN company_tel VARCHAR(100) AFTER tel
        `)
      } catch (alterError) {
        console.error("Error adding branch and company_tel columns:", alterError)
      }
    }

    // ตรวจสอบว่ามีคอลัมน์ branch_address_th และ branch_address_en อยู่แล้วหรือไม่
    try {
      await executeQuery(`SELECT branch_address_th, branch_address_en FROM business_cards LIMIT 1`)
    } catch (error) {
      // ถ้าเกิด error แสดงว่าคอลัมน์ยังไม่มี ให้เพิ่มคอลัมน์
      try {
        await executeQuery(`
          ALTER TABLE business_cards 
          ADD COLUMN branch_address_th TEXT AFTER address_en,
          ADD COLUMN branch_address_en TEXT AFTER branch_address_th
        `)
      } catch (alterError) {
        console.error("Error adding branch_address columns:", alterError)
      }
    }

    return { success: true }
  } catch (err) {
    console.error("Error checking columns:", err)
    throw err
  }
}

// GET: ดึงข้อมูลนามบัตรของผู้ใช้ปัจจุบัน
export async function GET(request: NextRequest) {
  try {
    // สร้างตาราง business_cards ถ้ายังไม่มี
    await ensureTableExists()

    // ตรวจสอบและเพิ่มคอลัมน์ใหม่ถ้ายังไม่มี
    await ensureColumnsExist()

    const cookieStore = cookies()
    const token = cookieStore.get("auth_token")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verify(token.value, process.env.JWT_SECRET || "your-secret-key") as {
      id: number
    }
    const userId = decoded.id

    // ดึงข้อมูลนามบัตรจากฐานข้อมูล
    try {
      const result = await executeQuerySingle(`SELECT * FROM business_cards WHERE user_id = ?`, [userId])

      if (!result) {
        // ถ้ายังไม่มีนามบัตร ให้ดึงข้อมูลจากตาราง users มาสร้างนามบัตรเริ่มต้น
        const userResult = await executeQuerySingle(`SELECT name, email, phone FROM users WHERE id = ?`, [userId])

        if (!userResult) {
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const user = userResult as any

        return NextResponse.json({
          id: null,
          user_id: userId,
          name_th: user.name || "",
          name_en: "",
          position_th: "",
          position_en: "",
          department_th: "",
          department_en: "",
          company_th: "บริษัท โนโซมิ เอ็นเตอร์ไพรส์ (ประเทศไทย) จำกัด",
          company_en: "NOZOMI ENTERPRISE (THAILAND) CO., LTD.",
          branch: "สำนักงานใหญ่",
          address_th: "382 หมู่ 4 ตำบลคลองสวน",
          address_en: "382 M.4 Baanklongsuan, Phrasamutjede/Samutprakarn 10290 Thailand",
          branch_address_th: "168 หมู่ 2 ตำบลคลองสวน",
          branch_address_en: "168 M.2 Baanklongsuan, Phrasamutjede/Samutprakarn 10290 Thailand",
          tel: user.phone || "",
          company_tel: "02-461-6291",
          fax: "02-461-6292",
          email: user.email || "",
          website: "www.nozomigroup.co.th",
          line_id: "",
          facebook: "",
          created_at: null,
          updated_at: null,
        })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error("Error querying business card:", error)

      // ถ้าเกิดข้อผิดพลาดเกี่ยวกับตาราง ให้ลองสร้างตารางอีกครั้ง
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
          branch VARCHAR(255),
          address_th TEXT,
          address_en TEXT,
          branch_address_th TEXT,
          branch_address_en TEXT,
          tel VARCHAR(100),
          company_tel VARCHAR(100),
          fax VARCHAR(100),
          email VARCHAR(255),
          website VARCHAR(255),
          line_id VARCHAR(255),
          facebook VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `)

      // ดึงข้อมูลผู้ใช้เพื่อสร้างนามบัตรเริ่มต้น
      const userResult = await executeQuerySingle(`SELECT name, email, phone FROM users WHERE id = ?`, [userId])

      if (!userResult) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const user = userResult as any

      return NextResponse.json({
        id: null,
        user_id: userId,
        name_th: user.name || "",
        name_en: "",
        position_th: "",
        position_en: "",
        department_th: "",
        department_en: "",
        company_th: "บริษัท โนโซมิ เอ็นเตอร์ไพรส์ (ประเทศไทย) จำกัด",
        company_en: "NOZOMI ENTERPRISE (THAILAND) CO., LTD.",
        branch: "สำนักงานใหญ่",
        address_th: "382 หมู่ 4 ตำบลคลองสวน",
        address_en: "382 M.4 Baanklongsuan, Phrasamutjede/Samutprakarn 10290 Thailand",
        branch_address_th: "168 หมู่ 2 ตำบลคลองสวน",
        branch_address_en: "168 M.2 Baanklongsuan, Phrasamutjede/Samutprakarn 10290 Thailand",
        tel: user.phone || "",
        company_tel: "02-461-6291",
        fax: "02-461-6292",
        email: user.email || "",
        website: "www.nozomigroup.co.th",
        line_id: "",
        facebook: "",
        created_at: null,
        updated_at: null,
      })
    }
  } catch (error) {
    console.error("Error fetching business card:", error)
    return NextResponse.json({ error: "Failed to fetch business card", details: error }, { status: 500 })
  }
}

// POST: สร้างหรืออัปเดตนามบัตร
export async function POST(request: NextRequest) {
  try {
    // สร้างตาราง business_cards ถ้ายังไม่มี
    await ensureTableExists()

    // ตรวจสอบและเพิ่มคอลัมน์ใหม่ถ้ายังไม่มี
    await ensureColumnsExist()

    const cookieStore = cookies()
    const token = cookieStore.get("auth_token")

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verify(token.value, process.env.JWT_SECRET || "your-secret-key") as {
      id: number
    }
    const userId = decoded.id

    const data = await request.json()

    // ตรวจสอบว่ามีนามบัตรอยู่แล้วหรือไม่
    const checkResult = await executeQuerySingle(`SELECT id FROM business_cards WHERE user_id = ?`, [userId])

    if (!checkResult) {
      // สร้างนามบัตรใหม่
      const insertQuery = `
        INSERT INTO business_cards (
          user_id, name_th, name_en, position_th, position_en, 
          department_th, department_en, company_th, company_en, branch,
          address_th, address_en, branch_address_th, branch_address_en,
          tel, company_tel, fax, email, website, 
          line_id, facebook
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      const insertParams = [
        userId,
        data.name_th,
        data.name_en,
        data.position_th,
        data.position_en,
        data.department_th,
        data.department_en,
        data.company_th,
        data.company_en,
        data.branch,
        data.address_th,
        data.address_en,
        data.branch_address_th,
        data.branch_address_en,
        data.tel,
        data.company_tel,
        data.fax,
        data.email,
        data.website,
        data.line_id,
        data.facebook,
      ]

      const result = await executeInsert(insertQuery, insertParams)
      const insertId = result.insertId

      const newCard = await executeQuerySingle(`SELECT * FROM business_cards WHERE id = ?`, [insertId])
      return NextResponse.json(newCard)
    } else {
      // อัปเดตนามบัตรที่มีอยู่
      const cardId = (checkResult as any).id
      const updateQuery = `
        UPDATE business_cards SET
          name_th = ?, name_en = ?, position_th = ?, position_en = ?,
          department_th = ?, department_en = ?, company_th = ?, company_en = ?, branch = ?,
          address_th = ?, address_en = ?, branch_address_th = ?, branch_address_en = ?,
          tel = ?, company_tel = ?, fax = ?, email = ?,
          website = ?, line_id = ?, facebook = ?
        WHERE id = ?
      `
      const updateParams = [
        data.name_th,
        data.name_en,
        data.position_th,
        data.position_en,
        data.department_th,
        data.department_en,
        data.company_th,
        data.company_en,
        data.branch,
        data.address_th,
        data.address_en,
        data.branch_address_th,
        data.branch_address_en,
        data.tel,
        data.company_tel,
        data.fax,
        data.email,
        data.website,
        data.line_id,
        data.facebook,
        cardId,
      ]

      await executeQuery(updateQuery, updateParams)
      const updatedCard = await executeQuerySingle(`SELECT * FROM business_cards WHERE id = ?`, [cardId])
      return NextResponse.json(updatedCard)
    }
  } catch (error) {
    console.error("Error saving business card:", error)
    return NextResponse.json({ error: "Failed to save business card", details: error }, { status: 500 })
  }
}
