import { type NextRequest, NextResponse } from "next/server"
import { executeQuery, executeQuerySingle } from "@/lib/db"

// GET: ดึงข้อมูลนามบัตรตาม ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const result = await executeQuerySingle(`SELECT * FROM business_cards WHERE id = ?`, [id])

    if (!result) {
      return NextResponse.json({ error: "Business card not found" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching business card:", error)
    return NextResponse.json({ error: "Failed to fetch business card" }, { status: 500 })
  }
}

// DELETE: ลบนามบัตร
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    await executeQuery(`DELETE FROM business_cards WHERE id = ?`, [id])

    return NextResponse.json({ message: "Business card deleted successfully" })
  } catch (error) {
    console.error("Error deleting business card:", error)
    return NextResponse.json({ error: "Failed to delete business card" }, { status: 500 })
  }
}
