import { NextResponse } from "next/server"

// Line Notify API endpoint for checking token status
const LINE_NOTIFY_STATUS_API = "https://notify-api.line.me/api/status"

export async function GET() {
  try {
    // ตรวจสอบว่ามี Line Notify Token หรือไม่
    const lineNotifyToken = process.env.LINE_NOTIFY_TOKEN

    if (!lineNotifyToken) {
      return NextResponse.json({ isValid: false, message: "LINE_NOTIFY_TOKEN is not set" })
    }

    // ตรวจสอบสถานะของ Token
    const response = await fetch(LINE_NOTIFY_STATUS_API, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${lineNotifyToken}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({ isValid: true, status: data })
    } else {
      return NextResponse.json({ isValid: false, status: { message: "Invalid token" } })
    }
  } catch (error) {
    console.error("Error checking Line Notify token:", error)
    return NextResponse.json({ isValid: false, error: "Failed to check token status" })
  }
}
