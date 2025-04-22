import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// บันทึก Line Notify Token ลงในไฟล์ .env.local
export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // ตรวจสอบว่า Token ถูกต้องหรือไม่
    const checkResponse = await fetch("https://notify-api.line.me/api/status", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!checkResponse.ok) {
      return NextResponse.json({ error: "Invalid Line Notify Token" }, { status: 400 })
    }

    // บันทึก Token ลงในตัวแปรสภาพแวดล้อม
    process.env.LINE_NOTIFY_TOKEN = token

    // บันทึก Token ลงในไฟล์ .env.local (ถ้าทำได้)
    try {
      const envFilePath = path.join(process.cwd(), ".env.local")
      let envContent = ""

      // อ่านไฟล์ .env.local ถ้ามี
      if (fs.existsSync(envFilePath)) {
        envContent = fs.readFileSync(envFilePath, "utf8")
      }

      // ตรวจสอบว่ามีการตั้งค่า LINE_NOTIFY_TOKEN อยู่แล้วหรือไม่
      if (envContent.includes("LINE_NOTIFY_TOKEN=")) {
        // แทนที่ค่าเดิม
        envContent = envContent.replace(/LINE_NOTIFY_TOKEN=.*/g, `LINE_NOTIFY_TOKEN=${token}`)
      } else {
        // เพิ่มค่าใหม่
        envContent += `\nLINE_NOTIFY_TOKEN=${token}`
      }

      // บันทึกไฟล์
      fs.writeFileSync(envFilePath, envContent)
    } catch (error) {
      console.error("Error saving token to .env.local file:", error)
      // ไม่ return error เพราะถือว่าบันทึกในตัวแปรสภาพแวดล้อมสำเร็จแล้ว
    }

    return NextResponse.json({ success: true, message: "Line Notify Token saved successfully" })
  } catch (error) {
    console.error("Error saving Line Notify Token:", error)
    return NextResponse.json({ error: "Failed to save Line Notify Token" }, { status: 500 })
  }
}
