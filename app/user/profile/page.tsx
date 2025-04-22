"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertCircle, Camera, Loader2, CheckCircle, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [removeAvatar, setRemoveAvatar] = useState(false)

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true)
        setError(null)

        // ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่
        const meResponse = await fetch("/api/auth/me")
        if (!meResponse.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลผู้ใช้ได้")
        }

        const meData = await meResponse.json()
        if (!meData.id) {
          router.push("/login")
          return
        }

        // ดึงข้อมูลผู้ใช้แบบละเอียด
        const userResponse = await fetch(`/api/users/${meData.id}`)
        if (!userResponse.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลผู้ใช้ได้")
        }

        const userData = await userResponse.json()
        setUser(userData)
        console.log("User data loaded:", userData)
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUser((prev: any) => ({
      ...prev,
      [name]: value,
    }))
    // เมื่อมีการเปลี่ยนแปลงข้อมูล ให้ซ่อนข้อความบันทึกสำเร็จ
    setSaveSuccess(false)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "ไฟล์มีขนาดใหญ่เกินไป",
          description: "กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB",
          variant: "destructive",
        })
        return
      }

      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith("image/")) {
        toast({
          title: "ประเภทไฟล์ไม่ถูกต้อง",
          description: "กรุณาเลือกไฟล์รูปภาพเท่านั้น",
          variant: "destructive",
        })
        return
      }

      setAvatarFile(file)
      setRemoveAvatar(false)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // เมื่อมีการเปลี่ยนแปลงรูปภาพ ให้ซ่อนข้อความบันทึกสำเร็จ
      setSaveSuccess(false)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(true)
    setSaveSuccess(false)
  }

  const deleteOldAvatar = async (avatarUrl: string): Promise<boolean> => {
    if (!avatarUrl) return true

    try {
      // ดึงชื่อไฟล์จาก URL
      const fileName = avatarUrl.split("/").pop()
      if (!fileName) {
        console.error("Could not extract filename from URL:", avatarUrl)
        return false
      }

      console.log("Attempting to delete old avatar:", fileName)

      const response = await fetch("/api/upload/avatar/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("Failed to delete old avatar:", fileName, result)
        return false
      }

      console.log("Old avatar deleted successfully:", fileName, result)
      return true
    } catch (error) {
      console.error("Error deleting old avatar:", error)
      return false
    }
  }

  const uploadAvatar = async (): Promise<string | null> => {
    // ถ้าต้องการลบรูปเก่า
    if (removeAvatar) {
      if (user?.avatar) {
        console.log("Removing old avatar without uploading new one:", user.avatar)
        await deleteOldAvatar(user.avatar)
      }
      return null
    }

    // ถ้าไม่มีไฟล์ใหม่และไม่ต้องการลบรูปเก่า
    if (!avatarFile) {
      return user?.avatar || null
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // เตรียมข้อมูลสำหรับอัปโหลด
      const formData = new FormData()
      formData.append("file", avatarFile)

      // ส่งชื่อไฟล์เก่าเพื่อลบ (ถ้ามี)
      if (user?.avatar) {
        const oldFileName = user.avatar.split("/").pop()
        if (oldFileName) {
          formData.append("oldFileName", oldFileName)
          console.log("Sending old filename for deletion:", oldFileName)
        }
      }

      // อัปโหลดไฟล์ใหม่
      console.log("Uploading new avatar...")
      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ")
      }

      const data = await response.json()
      setUploadProgress(100)
      console.log("Upload successful, new avatar URL:", data.url)
      return data.url
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์",
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveChanges = async () => {
    try {
      setSaving(true)
      setError(null)
      setSaveSuccess(false)

      console.log("Starting save process...")

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!user.name || !user.email || !user.department) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณากรอกชื่อ อีเมล และแผนกให้ครบถ้วน",
          variant: "destructive",
        })
        setSaving(false)
        return
      }

      // จัดการรูปโปรไฟล์ (อัปโหลดใหม่หรือลบเก่า)
      let avatarUrl = user.avatar

      if (avatarFile || removeAvatar) {
        console.log("Processing avatar changes...")
        avatarUrl = await uploadAvatar()

        if (avatarFile && !avatarUrl) {
          // ถ้าอัปโหลดไม่สำเร็จและมีการเลือกไฟล์ใหม่ ให้หยุดการบันทึก
          toast({
            title: "บันทึกข้อมูลไม่สำเร็จ",
            description: "ไม่สามารถอัปโหลดรูปโปรไฟล์ได้",
            variant: "destructive",
          })
          setSaving(false)
          return
        }
      }

      // สร้างข้อมูลที่จะส่งไปอัปเดต
      const userData = {
        ...user,
        avatar: avatarUrl,
      }

      console.log("Sending user data to API:", userData)

      // ส่งข้อมูลไปอัปเดต
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      console.log("API response status:", response.status)

      const responseData = await response.json()
      console.log("API response data:", responseData)

      if (!response.ok) {
        throw new Error(responseData.error || "บันทึกข้อมูลไม่สำเร็จ")
      }

      // อัปเดตข้อมูลผู้ใช้ในหน้าเว็บ
      setUser(responseData)
      setRemoveAvatar(false)

      // แสดงข้อความบันทึกสำเร็จ
      setSaveSuccess(true)

      toast({
        title: "บันทึกข้อมูลสำเร็จ",
        description: "ข้อมูลของคุณถูกอัปเดตเรียบร้อยแล้ว",
      })
    } catch (err) {
      console.error("Error saving user data:", err)
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล")
      toast({
        title: "บันทึกข้อมูลไม่สำเร็จ",
        description: err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      setIsChangingPassword(true)
      setPasswordError(null)

      // ตรวจสอบรหัสผ่านใหม่
      if (newPassword !== confirmPassword) {
        setPasswordError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน")
        return
      }

      if (newPassword.length < 6) {
        setPasswordError("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร")
        return
      }

      // ส่งคำขอเปลี่ยนรหัสผ่าน
      const response = await fetch(`/api/users/${user.id}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ")
      }

      // รีเซ็ตฟอร์ม
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setIsPasswordDialogOpen(false)

      toast({
        title: "เปลี่ยนรหัสผ่านสำเร็จ",
        description: "รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว",
      })
    } catch (err) {
      console.error("Error changing password:", err)
      setPasswordError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน")
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">กำลังโหลดข้อมูล...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.refresh()}>ลองใหม่</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Toaster />
      <h1 className="text-2xl font-bold mb-6">ข้อมูลส่วนตัว</h1>

      <Tabs defaultValue="profile">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">ข้อมูลทั่วไป</TabsTrigger>
          <TabsTrigger value="security">ความปลอดภัย</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลส่วนตัว</CardTitle>
              <CardDescription>จัดการข้อมูลส่วนตัวของคุณ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* แสดงข้อความบันทึกสำเร็จ */}
              {saveSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-600">บันทึกสำเร็จ</AlertTitle>
                  <AlertDescription className="text-green-600">ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว</AlertDescription>
                </Alert>
              )}

              {/* รูปโปรไฟล์ */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || (removeAvatar ? undefined : user?.avatar)} />
                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 flex gap-1">
                    <div className="bg-primary text-primary-foreground rounded-full p-1 cursor-pointer">
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                        <Camera className="h-4 w-4" />
                        <input
                          id="avatar-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarChange}
                        />
                      </label>
                    </div>
                    {(avatarPreview || (!removeAvatar && user?.avatar)) && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="bg-destructive text-destructive-foreground rounded-full p-1"
                        aria-label="ลบรูปโปรไฟล์"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{user?.name}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-sm text-muted-foreground">{user?.department}</p>
                  <p className="text-sm text-muted-foreground">{user?.role}</p>
                </div>
              </div>

              <Separator />

              {/* ข้อมูลส่วนตัว */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                  <Input id="name" name="name" value={user?.name || ""} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input id="email" name="email" type="email" value={user?.email || ""} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">แผนก/ฝ่าย</Label>
                  <Select
                    value={user?.department || ""}
                    onValueChange={(value) => handleInputChange({ target: { name: "department", value } } as any)}
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                  <Input id="phone" name="phone" value={user?.phone || ""} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeId">รหัสพนักงาน</Label>
                  <Input
                    id="employeeId"
                    name="employeeId"
                    value={user?.employeeId || ""}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">เลขที่ใบขับขี่</Label>
                  <Input
                    id="licenseNumber"
                    name="licenseNumber"
                    value={user?.licenseNumber || ""}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.back()}>
                ยกเลิก
              </Button>
              <Button onClick={handleSaveChanges} disabled={saving || isUploading}>
                {saving || isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกข้อมูล"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>ความปลอดภัย</CardTitle>
              <CardDescription>จัดการการตั้งค่าความปลอดภัยของบัญชีของคุณ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">รหัสผ่าน</h3>
                <p className="text-sm text-muted-foreground">
                  คุณสามารถเปลี่ยนรหัสผ่านของคุณได้ตลอดเวลา แนะนำให้ใช้รหัสผ่านที่ซับซ้อนและไม่ซ้ำกับบัญชีอื่น
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button>เปลี่ยนรหัสผ่าน</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
                    <DialogDescription>กรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่ของคุณ</DialogDescription>
                  </DialogHeader>

                  {passwordError && (
                    <Alert variant="destructive" className="my-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
                      <AlertDescription>{passwordError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                      ยกเลิก
                    </Button>
                    <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          กำลังบันทึก...
                        </>
                      ) : (
                        "บันทึก"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
