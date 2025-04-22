import { type NextRequest, NextResponse } from "next/server"
import { executeQuerySingle } from "@/lib/db"

// GET: ดึงข้อมูลนามบัตรตาม ID สำหรับการแชร์ (ไม่ต้องล็อกอิน)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const result = await executeQuerySingle(`SELECT * FROM business_cards WHERE id = ?`, [id])

    if (!result) {
      return NextResponse.json({ error: "Business card not found" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching shared business card:", error)
    return NextResponse.json({ error: "Failed to fetch business card" }, { status: 500 })
  }
}
