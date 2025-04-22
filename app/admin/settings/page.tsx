"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SettingsPage() {
  const [lineToken, setLineToken] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [testMessage, setTestMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [tokenStatus, setTokenStatus] = useState<"unknown" | "valid" | "invalid">("unknown")
  const { toast } = useToast()

  // ตรวจสอบสถานะของ Line Notify Token
  const checkTokenStatus = async () => {
    try {
      const response = await fetch("/api/line-notify/check", {
        method: "GET",
      })

      if (response.ok) {
        const data = await response.json()
        setTokenStatus(data.isValid ? "valid" : "invalid")
      } else {
        setTokenStatus("unknown")
      }
    } catch (error) {
      console.error("Error checking token status:", error)
      setTokenStatus("unknown")
    }
  }

  useEffect(() => {
    checkTokenStatus()
  }, [])

  // บันทึก Line Notify Token
  const saveLineToken = async () => {
    if (!lineToken.trim()) {
      toast({
        title: "กรุณากรอก Line Notify Token",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/settings/line-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: lineToken }),
      })

      if (response.ok) {
        toast({
          title: "บันทึก Line Notify Token สำเร็จ",
          description: "ระบบจะใช้ Token นี้ในการส่งการแจ้งเตือนผ่าน Line",
        })
        checkTokenStatus()
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถบันทึก Line Notify Token ได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving Line token:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึก Line Notify Token ได้",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // ส่งข้อความทดสอบ
  const sendTestMessage = async () => {
    if (!testMessage.trim()) {
      toast({
        title: "กรุณากรอกข้อความทดสอบ",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/line-notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: testMessage }),
      })

      if (response.ok) {
        toast({
          title: "ส่งข้อความทดสอบสำเร็จ",
          description: "ตรวจสอบการแจ้งเตือนในกลุ่ม Line ของคุณ",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "เกิดข้อผิดพลาด",
          description: errorData.error || "ไม่สามารถส่งข้อความทดสอบได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending test message:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งข้อความทดสอบได้",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="p-4 pt-6 max-w-5xl mx-auto">
      <Toaster />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ตั้งค่าระบบ</h1>
        <p className="text-muted-foreground">จัดการการตั้งค่าต่างๆ ของระบบ</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>การแจ้งเตือนผ่าน Line</CardTitle>
          <CardDescription>ตั้งค่า Line Notify เพื่อรับการแจ้งเตือนเมื่อมีการจองรถใหม่</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tokenStatus === "valid" && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Line Notify พร้อมใช้งาน</AlertTitle>
              <AlertDescription className="text-green-600">ระบบสามารถส่งการแจ้งเตือนผ่าน Line ได้</AlertDescription>
            </Alert>
          )}

          {tokenStatus === "invalid" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Line Notify Token ไม่ถูกต้อง</AlertTitle>
              <AlertDescription>กรุณาตรวจสอบและอัปเดต Line Notify Token ใหม่</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="lineToken" className="text-sm font-medium">
                Line Notify Token
              </label>
              <a
                href="https://notify-bot.line.me/th/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center"
              >
                <span>วิธีสร้าง Token</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
            <div className="flex gap-2">
              <Input
                id="lineToken"
                type="password"
                placeholder="กรอก Line Notify Token"
                value={lineToken}
                onChange={(e) => setLineToken(e.target.value)}
              />
              <Button onClick={saveLineToken} disabled={isSaving}>
                {isSaving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Token นี้จะถูกใช้ในการส่งการแจ้งเตือนไปยังกลุ่ม Line ที่คุณเพิ่ม Line Notify Bot ไว้
            </p>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-2">ทดสอบการส่งข้อความ</h3>
            <div className="flex gap-2">
              <Input placeholder="ข้อความทดสอบ" value={testMessage} onChange={(e) => setTestMessage(e.target.value)} />
              <Button onClick={sendTestMessage} disabled={isSending || tokenStatus !== "valid"}>
                {isSending ? "กำลังส่ง..." : "ส่งทดสอบ"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>วิธีตั้งค่า Line Notify</CardTitle>
          <CardDescription>ขั้นตอนการตั้งค่า Line Notify เพื่อรับการแจ้งเตือนจากระบบ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              เข้าไปที่เว็บไซต์{" "}
              <a
                href="https://notify-bot.line.me/th/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Line Notify
              </a>
            </li>
            <li>ล็อกอินด้วยบัญชี Line ของคุณ</li>
            <li>คลิกที่ "หน้าของฉัน" และเลือก "สร้าง Token"</li>
            <li>ตั้งชื่อ Token (เช่น "ระบบจองรถ") และเลือกกลุ่ม Line ที่ต้องการรับการแจ้งเตือน</li>
            <li>คลิก "สร้าง" และคัดลอก Token ที่ได้</li>
            <li>นำ Token มาใส่ในช่อง Line Notify Token ด้านบนและคลิก "บันทึก"</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
