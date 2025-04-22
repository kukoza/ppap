import { NextResponse } from "next/server"

// Line Notify API endpoint
const LINE_NOTIFY_API = "https://notify-api.line.me/api/notify"

// ฟังก์ชันสำหรับส่งข้อความแจ้งเตือนไปยัง Line
export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    // ตรวจสอบว่ามี Line Notify Token หรือไม่
    const lineNotifyToken = process.env.LINE_NOTIFY_TOKEN

    if (!lineNotifyToken) {
      console.error("LINE_NOTIFY_TOKEN is not set")
      return NextResponse.json({ error: "LINE_NOTIFY_TOKEN is not set" }, { status: 500 })
    }

    // ส่งข้อความไปยัง Line Notify API
    const formData = new URLSearchParams()
    formData.append("message", message)

    const response = await fetch(LINE_NOTIFY_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${lineNotifyToken}`,
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Line Notify API error:", errorData)
      return NextResponse.json({ error: "Failed to send Line notification" }, { status: response.status })
    }

    return NextResponse.json({ success: true, message: "Line notification sent successfully" })
  } catch (error) {
    console.error("Error sending Line notification:", error)
    return NextResponse.json({ error: "Failed to send Line notification" }, { status: 500 })
  }
}
