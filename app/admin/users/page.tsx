"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Pencil, Trash2, User, Mail, Building, Shield, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useMediaQuery } from "@/hooks/use-mobile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useRouter } from "next/navigation"

// ประเภทข้อมูลสำหรับผู้ใช้
interface UserType {
  id: number
  name: string
  email: string
  department: string
  role: string
  phone?: string
  employeeId?: string
  avatar?: string
}

// Mock departments
const departments = ["ฝ่ายขาย", "ฝ่ายการตลาด", "ฝ่ายการเงิน", "ฝ่ายไอที", "ฝ่ายปฏิบัติการ", "ฝ่ายทรัพยากรบุคคล", "ฝ่ายวิศวกรรม"]

// Mock roles
const roles = ["ผู้ใช้งาน", "ผู้ดูแลระบบ"]

export default function UsersManagement() {
  const router = useRouter()
  const [users, setUsers] = useState<UserType[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for add user dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    department: "",
    role: "ผู้ใช้งาน",
    password: "",
    confirmPassword: "",
    phone: "",
    employeeId: "",
    licenseNumber: "",
  })

  // State for edit user dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [editedUser, setEditedUser] = useState<UserType | null>(null)

  // State for delete user dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ดึงข้อมูลผู้ใช้ทั้งหมด
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true)
        const response = await fetch("/api/users")

        // ตรวจสอบว่า response เป็น JSON หรือไม่
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Expected JSON response but got ${contentType}`)
        }

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch users")
        }

        const data = await response.json()
        setUsers(data)
      } catch (err) {
        console.error("Error loading users:", err)
        setError(`ไม่สามารถโหลดข้อมูลผู้ใช้ได้: ${err instanceof Error ? err.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // กรองผู้ใช้ตามคำค้นหา
  const filteredUsers = users.filter((user) => {
    return (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Handle add user
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.department || !newUser.password) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
        variant: "destructive",
      })
      return
    }

    if (newUser.password !== newUser.confirmPassword) {
      toast({
        title: "รหัสผ่านไม่ตรงกัน",
        description: "กรุณาตรวจสอบรหัสผ่านและยืนยันรหัสผ่านให้ตรงกัน",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          department: newUser.department,
          role: newUser.role,
          password: newUser.password,
          phone: newUser.phone,
          employeeId: newUser.employeeId,
          licenseNumber: newUser.licenseNumber,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add user")
      }

      const addedUser = await response.json()

      // เพิ่มผู้ใช้ใหม่เข้าไปในรายการ
      setUsers([...users, addedUser])

      // รีเซ็ตฟอร์ม
      setNewUser({
        name: "",
        email: "",
        department: "",
        role: "ผู้ใช้งาน",
        password: "",
        confirmPassword: "",
        phone: "",
        employeeId: "",
        licenseNumber: "",
      })

      setIsAddDialogOpen(false)
      toast({
        title: "เพิ่มผู้ใช้สำเร็จ",
        description: "เพิ่มข้อมูลผู้ใช้ใหม่เรียบร้อยแล้ว",
      })
    } catch (error: any) {
      console.error("Error adding user:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error.message === "Email already exists"
            ? "อีเมลนี้มีอยู่ในระบบแล้ว กรุณาใช้อีเมลอื่น"
            : "ไม่สามารถเพิ่มผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit user
  const handleEditUser = async () => {
    if (!editedUser) return

    if (!editedUser.name || !editedUser.email || !editedUser.department) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/users/${editedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedUser),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update user")
      }

      const updatedUser = await response.json()

      // อัปเดตรายการผู้ใช้
      setUsers(users.map((user) => (user.id === editedUser.id ? updatedUser : user)))

      setIsEditDialogOpen(false)
      toast({
        title: "แก้ไขผู้ใช้สำเร็จ",
        description: "แก้ไขข้อมูลผู้ใช้เรียบร้อยแล้ว",
      })
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error.message === "Email already exists"
            ? "อีเมลนี้มีอยู่ในระบบแล้ว กรุณาใช้อีเมลอื่น"
            : "ไม่สามารถแก้ไขข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete user")
      }

      // ลบผู้ใช้ออกจากรายการ
      setUsers(users.filter((user) => user.id !== userToDelete.id))

      setIsDeleteDialogOpen(false)
      toast({
        title: "ลบผู้ใช้สำเร็จ",
        description: "ลบข้อมูลผู้ใช้เรียบร้อยแล้ว",
      })
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
    }
  }

  const openEditDialog = (e: React.MouseEvent, user: UserType) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedUser(user)
    setEditedUser(user)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (e: React.MouseEvent, user: UserType) => {
    e.preventDefault()
    e.stopPropagation()
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
          <h2 className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</h2>
          <p>{error}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            ลองใหม่อีกครั้ง
          </Button>
          <Button variant="outline" className="mt-4" onClick={() => window.open("/api/test-db", "_blank")}>
            ทดสอบการเชื่อมต่อฐานข้อมูล
          </Button>
          <Button variant="outline" className="mt-4" onClick={() => window.open("/api/users", "_blank")}>
            ทดสอบ API ผู้ใช้งาน
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pt-6 max-w-5xl mx-auto">
      <Toaster />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">จัดการผู้ใช้งาน</h1>
        <p className="text-muted-foreground">จัดการผู้ใช้งานทั้งหมดในระบบ</p>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาผู้ใช้..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          {/* แก้ไขส่วนนี้ โดยใช้ Button ธรรมดาแทน DialogTrigger */}
          <Button className="w-full md:w-auto" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มผู้ใช้งานใหม่
          </Button>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5" />
                เพิ่มผู้ใช้งานใหม่
              </DialogTitle>
              <DialogDescription>กรอกข้อมูลเพื่อเพิ่มผู้ใช้งานใหม่เข้าสู่ระบบ</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-3">
                <Label htmlFor="name" className="text-base">
                  ชื่อ-นามสกุล <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="กรอกชื่อ-นามสกุล"
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
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
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="กรอกอีเมล"
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="department" className="text-base">
                  แผนก <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2 border rounded-md px-3 py-1">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={newUser.department}
                    onValueChange={(value) => setNewUser({ ...newUser, department: value })}
                  >
                    <SelectTrigger className="border-0 p-0 h-9 focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="เลือกแผนก" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="role" className="text-base">
                  สิทธิ์การใช้งาน
                </Label>
                <div className="flex items-center gap-2 border rounded-md px-3 py-1">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="password" className="text-base">
                    รหัสผ่าน <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="รหัสผ่าน"
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword" className="text-base">
                    ยืนยันรหัสผ่าน <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    placeholder="ยืนยันรหัสผ่าน"
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="employeeId" className="text-base">
                  รหัสพนักงาน
                </Label>
                <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="employeeId"
                    value={newUser.employeeId}
                    onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
                    placeholder="NZ-1234"
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="phone" className="text-base">
                  เบอร์โทรศัพท์
                </Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="+66 81-234-5678"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="licenseNumber" className="text-base">
                  เลขที่ใบอนุญาตขับขี่
                </Label>
                <Input
                  id="licenseNumber"
                  value={newUser.licenseNumber}
                  onChange={(e) => setNewUser({ ...newUser, licenseNumber: e.target.value })}
                  placeholder="T123456789"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                ยกเลิก
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={
                  isSubmitting ||
                  !newUser.name ||
                  !newUser.email ||
                  !newUser.department ||
                  !newUser.password ||
                  !newUser.confirmPassword
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "เพิ่มผู้ใช้งาน"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <Card key={user.id} className="overflow-hidden hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || "/placeholder.svg?height=40&width=40"} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={user.role === "ผู้ดูแลระบบ" ? "default" : "outline"} className="whitespace-nowrap">
                      {user.role}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => openEditDialog(e, user)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">แก้ไข</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => openDeleteDialog(e, user)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">ลบ</span>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-2 ml-13">แผนก: {user.department}</div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">ไม่พบผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา</div>
        )}
      </div>

      {/* Fixed Action Button */}
      {isMobile && (
        <Button
          size="lg"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-30"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-6 w-6" />
          <span className="sr-only">เพิ่มผู้ใช้</span>
        </Button>
      )}

      {/* Dialog แก้ไขข้อมูลผู้ใช้ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Pencil className="h-5 w-5" />
              แก้ไขข้อมูลผู้ใช้งาน
            </DialogTitle>
            <DialogDescription>แก้ไขข้อมูลของผู้ใช้งานนี้</DialogDescription>
          </DialogHeader>
          {editedUser && (
            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-4 mb-2">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={editedUser.avatar || "/placeholder.svg?height=64&width=64"} alt={editedUser.name} />
                  <AvatarFallback>{editedUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-lg">{editedUser.name}</div>
                  <div className="text-sm text-muted-foreground">{editedUser.email}</div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-3">
                <Label htmlFor="edit-name" className="text-base">
                  ชื่อ-นามสกุล <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-name"
                    value={editedUser.name}
                    onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                    placeholder="กรอกชื่อ-นามสกุล"
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-email" className="text-base">
                  อีเมล <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-email"
                    type="email"
                    value={editedUser.email}
                    onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                    placeholder="กรอกอีเมล"
                    className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-department" className="text-base">
                  แผนก <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2 border rounded-md px-3 py-1">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={editedUser.department}
                    onValueChange={(value) => setEditedUser({ ...editedUser, department: value })}
                  >
                    <SelectTrigger className="border-0 p-0 h-9 focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="เลือกแผนก" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-role" className="text-base">
                  สิทธิ์การใช้งาน
                </Label>
                <div className="flex items-center gap-2 border rounded-md px-3 py-1">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={editedUser.role}
                    onValueChange={(value) => setEditedUser({ ...editedUser, role: value })}
                  >
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
                <Label htmlFor="edit-phone" className="text-base">
                  เบอร์โทรศัพท์
                </Label>
                <Input
                  id="edit-phone"
                  value={editedUser.phone || ""}
                  onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                  placeholder="+66 81-234-5678"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-employeeId" className="text-base">
                  รหัสพนักงาน
                </Label>
                <Input
                  id="edit-employeeId"
                  value={editedUser.employeeId || ""}
                  onChange={(e) => setEditedUser({ ...editedUser, employeeId: e.target.value })}
                  placeholder="NZ-1234"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleEditUser}
              disabled={isSubmitting || !editedUser?.name || !editedUser?.email || !editedUser?.department}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                "บันทึกการเปลี่ยนแปลง"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog ยืนยันการลบผู้ใช้ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <Trash2 className="h-5 w-5 text-destructive" />
              ยืนยันการลบผู้ใช้งาน
            </AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งานนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
              {userToDelete && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={userToDelete.avatar || "/placeholder.svg?height=48&width=48"}
                        alt={userToDelete.name}
                      />
                      <AvatarFallback>{userToDelete.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{userToDelete.name}</div>
                      <div className="text-sm text-muted-foreground">{userToDelete.email}</div>
                      <div className="text-sm text-muted-foreground">แผนก: {userToDelete.department}</div>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isSubmitting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ลบผู้ใช้งาน"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
