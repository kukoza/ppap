"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, User, Mail, Building, Shield, Save, Phone } from "lucide-react"

export default function AddUser() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    employeeId: "",
    phone: "",
    licenseNumber: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "กรุณากรอกชื่อ-นามสกุล"
    }

    if (!formData.email.trim()) {
      newErrors.email = "กรุณากรอกอีเมล"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง"
    }

    if (!formData.password) {
      newErrors.password = "กรุณากรอกรหัสผ่าน"
    } else if (formData.password.length < 6) {
      newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน"
    }

    if (!formData.department) {
      newErrors.department = "กรุณาเลือกแผนก"
    }

    if (!formData.employeeId) {
      newErrors.employeeId = "กรุณากรอกรหัสพนักงาน"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      router.push("/admin/users")
    }, 1000)
  }

  return (
    <div className="p-4 pb-20 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/users")} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">กลับ</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">ลงทะเบียนผู้ใช้ใหม่</h1>
          <p className="text-muted-foreground">กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้ใหม่</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="name" className="text-base">
                  ชื่อ-นามสกุล <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ทานากะ ฮิโรชิ"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="email" className="text-base">
                  อีเมล <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@nozomi.com"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="password" className="text-base">
                  รหัสผ่าน <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="รหัสผ่าน"
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="confirmPassword" className="text-base">
                  ยืนยันรหัสผ่าน <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="ยืนยันรหัสผ่าน"
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="department" className="text-base">
                  แผนก <span className="text-destructive">*</span>
                </Label>
              </div>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="แผนก/ฝ่าย" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PD">PD</SelectItem>
                  <SelectItem value="DL">DL</SelectItem>
                  <SelectItem value="PU">PU</SelectItem>
                  <SelectItem value="MK">MK</SelectItem>
                  <SelectItem value="SEC">SEC</SelectItem>
                  <SelectItem value="ACC">ACC</SelectItem>
                  <SelectItem value="QA">QA</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="ST">ST</SelectItem>
                  <SelectItem value="MT">MT</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                </SelectContent>
              </Select>
              {errors.department && <p className="text-sm text-destructive">{errors.department}</p>}
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="employeeId" className="text-base">
                  รหัสพนักงาน <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="NZ-1234"
              />
              {errors.employeeId && <p className="text-sm text-destructive">{errors.employeeId}</p>}
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="phone" className="text-base">
                  เบอร์โทรศัพท์
                </Label>
              </div>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+66 81-234-5678"
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="licenseNumber" className="text-base">
                เลขที่ใบอนุญาตขับขี่
              </Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="T123456789"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={() => router.push("/admin/users")}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <Save className="h-4 w-4" />
                {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
