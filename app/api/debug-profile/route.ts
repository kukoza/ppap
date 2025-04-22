import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // รับข้อมูลจาก request
    const data = await request.json()

    // บันทึกข้อมูลที่ได้รับเพื่อตรวจสอบ
    console.log("Debug Profile API received data:", data)

    // ส่งข้อมูลกลับเพื่อยืนยันการทำงาน
    return NextResponse.json({
      success: true,
      message: "Debug profile API working correctly",
      receivedData: data,
    })
  } catch (error) {
    console.error("Debug Profile API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
