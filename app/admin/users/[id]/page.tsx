"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, User, Mail, Building, Shield, Save, Trash2, Key, Eye, EyeOff } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Mock data for roles
const roles = ["ผู้ใช้งาน", "ผู้ดูแลระบบ"]

export default function EditUser({ params }: { params: { id: string } }) {
  const router = useRouter()
  const userId = params.id

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    id: 0,
    name: "",
    email: "",
    department: "",
    role: "",
    avatar: "/placeholder.svg?height=40&width=40",
    phone: "",
    employeeId: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  // Load user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`)
        if (response.ok) {
          const userData = await response.json()
          setFormData({
            ...userData,
            avatar: userData.avatar || "/placeholder.svg?height=40&width=40",
          })
        } else {
          toast({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้",
            variant: "destructive",
          })
          router.push("/admin/users")
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้",
          variant: "destructive",
        })
        router.push("/admin/users")
      }
    }

    fetchUser()
  }, [userId, router])

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

    if (!formData.department) {
      newErrors.department = "กรุณาเลือกแผนก"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {}

    if (!newPassword.trim()) {
      newErrors.newPassword = "กรุณากรอกรหัสผ่านใหม่"
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "กรุณายืนยันรหัสผ่าน"
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน"
    }

    setPasswordErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update user")
      }

      toast({
        title: "บันทึกข้อมูลสำเร็จ",
        description: "ข้อมูลผู้ใช้ถูกอัปเดตเรียบร้อยแล้ว",
      })

      setTimeout(() => {
        router.push("/admin/users")
      }, 1000)
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete user")
      }

      toast({
        title: "ลบผู้ใช้สำเร็จ",
        description: "ข้อมูลผู้ใช้ถูกลบเรียบร้อยแล้ว",
      })

      setTimeout(() => {
        router.push("/admin/users")
      }, 1000)
    } catch (error: any) {
      console.error("Error deleting user:", error)

      let errorMessage = "ไม่สามารถลบผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง"

      if (error.message === "Cannot delete the last administrator") {
        errorMessage = "ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้"
      } else if (error.message === "Cannot delete user with active bookings") {
        errorMessage = "ไม่สามารถลบผู้ใช้ที่มีการจองที่ยังไม่เสร็จสิ้นได้"
      }

      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleResetPassword = async () => {
    if (!validatePasswordForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to reset password")
      }

      toast({
        title: "รีเซ็ตรหัสผ่านสำเร็จ",
        description: "รหัสผ่านของผู้ใช้ถูกเปลี่ยนเรียบร้อยแล้ว",
      })

      setNewPassword("")
      setConfirmPassword("")
      setIsResetPasswordDialogOpen(false)
    } catch (error) {
      console.error("Error resetting password:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!formData.id) {
    return <div className="p-4">กำลังโหลดข้อมูล...</div>
  }

  return (
    <div className="p-4 pb-20 max-w-3xl mx-auto">
      <Toaster />
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/users")} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">กลับ</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">แก้ไขข้อมูลผู้ใช้งาน</h1>
          <p className="text-muted-foreground">แก้ไขข้อมูลของผู้ใช้งาน ID: {userId}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={formData.avatar} alt={formData.name} />
                <AvatarFallback>{formData.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{formData.name}</CardTitle>
                <CardDescription>{formData.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Separator />

            <div className="grid gap-3">
              <Label htmlFor="name" className="text-base">
                ชื่อ-นามสกุล <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="กรอกชื่อ-นามสกุล"
                  className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="email" className="text-base">
                อีเมล <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="กรอกอีเมล"
                  className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="department" className="text-base">
                แผนก <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2 border rounded-md px-3 py-1">
                <Building className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger className="border-0 p-0 h-9 focus:ring-0 focus:ring-offset-0">
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
              </div>
              {errors.department && <p className="text-sm text-destructive">{errors.department}</p>}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="role" className="text-base">
                สิทธิ์การใช้งาน
              </Label>
              <div className="flex items-center gap-2 border rounded-md px-3 py-1">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="border-0 p-0 h-9 focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="เลือกสิทธิ์การใช้งาน" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="phone" className="text-base">
                เบอร์โทรศัพท์
              </Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="กรอกเบอร์โทรศัพท์"
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="employeeId" className="text-base">
                รหัสพนักงาน
              </Label>
              <Input
                id="employeeId"
                value={formData.employeeId || ""}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="กรอกรหัสพนักงาน"
              />
            </div>

            <Separator />

            {/* เพิ่มปุ่มรีเซ็ตรหัสผ่าน */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setIsResetPasswordDialogOpen(true)}
              >
                <Key className="h-4 w-4" />
                รีเซ็ตรหัสผ่าน
              </Button>
            </div>

            <Separator />

            <div className="flex justify-between pt-4">
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" type="button" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    ลบผู้ใช้งาน
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-xl">
                      <Trash2 className="h-5 w-5 text-destructive" />
                      ยืนยันการลบผู้ใช้งาน
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งานนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
                      <div className="mt-4 p-4 bg-muted rounded-md">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={formData.avatar} alt={formData.name} />
                            <AvatarFallback>{formData.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{formData.name}</div>
                            <div className="text-sm text-muted-foreground">{formData.email}</div>
                            <div className="text-sm text-muted-foreground">แผนก: {formData.department}</div>
                          </div>
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      ลบผู้ใช้งาน
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-3">
                <Button variant="outline" type="button" onClick={() => router.push("/admin/users")}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Dialog รีเซ็ตรหัสผ่าน */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              รีเซ็ตรหัสผ่าน
            </DialogTitle>
            <DialogDescription>กำหนดรหัสผ่านใหม่ให้กับผู้ใช้ {formData.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordErrors.newPassword && <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button onClick={handleResetPassword} disabled={isSubmitting}>
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
