"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, ChevronLeft } from "lucide-react"

export default function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("กรุณากรอกอีเมล")
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("รูปแบบอีเมลไม่ถูกต้อง")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setIsSubmitted(true)
    } catch (error) {
      console.error("Reset password error:", error)
      setError("เกิดข้อผิดพลาดในการส่งอีเมล กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/login")} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">กลับ</span>
            </Button>
            <CardTitle className="text-2xl">ลืมรหัสผ่าน</CardTitle>
          </div>
          <CardDescription>
            {isSubmitted ? "เราได้ส่งอีเมลพร้อมคำแนะนำในการรีเซ็ตรหัสผ่านให้คุณแล้ว" : "กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    อีเมล
                  </div>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="กรอกอีเมลที่ใช้ลงทะเบียน"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "กำลังส่งอีเมล..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 text-green-700 p-4 rounded-md">
                <p>เราได้ส่งอีเมลพร้อมคำแนะนำในการรีเซ็ตรหัสผ่านไปที่ {email} แล้ว</p>
                <p className="mt-2 text-sm">หากคุณไม่ได้รับอีเมล โปรดตรวจสอบโฟลเดอร์สแปมหรือลองใช้อีเมลอื่น</p>
              </div>

              <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
                ลองใช้อีเมลอื่น
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            จำรหัสผ่านได้แล้ว?{" "}
            <Link href="/login" className="text-primary hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
