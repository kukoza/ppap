"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2, Car, Users, Loader2 } from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// ประเภทข้อมูลสำหรับประเภทรถ
interface CarType {
  id: number
  name: string
  description: string
  capacity: number
}

export default function CarTypesManagement() {
  const [carTypes, setCarTypes] = useState<CarType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentCarType, setCurrentCarType] = useState<CarType | null>(null)
  const [newCarType, setNewCarType] = useState({
    name: "",
    description: "",
    capacity: 0,
  })

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentDeleteId, setCurrentDeleteId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ดึงข้อมูลประเภทรถทั้งหมด
  useEffect(() => {
    async function fetchCarTypes() {
      try {
        setLoading(true)
        const response = await fetch("/api/car-types")

        if (!response.ok) {
          throw new Error("Failed to fetch car types")
        }

        const data = await response.json()
        setCarTypes(data)
      } catch (err) {
        console.error("Error loading car types:", err)
        setError("ไม่สามารถโหลดข้อมูลประเภทรถได้ กรุณาลองใหม่อีกครั้ง")
      } finally {
        setLoading(false)
      }
    }

    fetchCarTypes()
  }, [])

  const handleAddCarType = async () => {
    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!newCarType.name || !newCarType.description || newCarType.capacity <= 0) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณากรอกชื่อประเภท คำอธิบาย และความจุ",
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)

      // ส่งข้อมูลไปยัง API
      const response = await fetch("/api/car-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCarType),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add car type")
      }

      const addedCarType = await response.json()

      // เพิ่มประเภทรถใหม่เข้าไปในรายการ
      setCarTypes([...carTypes, addedCarType])

      // รีเซ็ตฟอร์ม
      setNewCarType({
        name: "",
        description: "",
        capacity: 0,
      })

      setIsAddDialogOpen(false)
      toast({
        title: "เพิ่มประเภทรถสำเร็จ",
        description: "เพิ่มข้อมูลประเภทรถใหม่เรียบร้อยแล้ว",
      })
    } catch (error: any) {
      console.error("Error adding car type:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error.message === "Car type name already exists"
            ? "ชื่อประเภทรถนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น"
            : "ไม่สามารถเพิ่มประเภทรถได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCarType = async () => {
    if (!currentCarType) return

    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!currentCarType.name || !currentCarType.description || currentCarType.capacity <= 0) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณากรอกชื่อประเภท คำอธิบาย และความจุ",
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)

      // ส่งข้อมูลไปยัง API
      const response = await fetch(`/api/car-types/${currentCarType.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: currentCarType.name,
          description: currentCarType.description,
          capacity: currentCarType.capacity,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update car type")
      }

      const updatedCarType = await response.json()

      // อัปเดตรายการประเภทรถ
      setCarTypes(carTypes.map((type) => (type.id === currentCarType.id ? updatedCarType : type)))

      setIsEditDialogOpen(false)
      toast({
        title: "แก้ไขประเภทรถสำเร็จ",
        description: "แก้ไขข้อมูลประเภทรถเรียบร้อยแล้ว",
      })
    } catch (error: any) {
      console.error("Error updating car type:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error.message === "Car type name already exists"
            ? "ชื่อประเภทรถนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น"
            : "ไม่สามารถแก้ไขประเภทรถได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCarType = async () => {
    if (currentDeleteId === null) return

    try {
      setIsSubmitting(true)

      // ส่งคำขอลบไปยัง API
      const response = await fetch(`/api/car-types/${currentDeleteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete car type")
      }

      // ลบประเภทรถออกจากรายการ
      setCarTypes(carTypes.filter((type) => type.id !== currentDeleteId))

      setIsDeleteDialogOpen(false)
      toast({
        title: "ลบประเภทรถสำเร็จ",
        description: "ลบข้อมูลประเภทรถเรียบร้อยแล้ว",
      })
    } catch (error: any) {
      console.error("Error deleting car type:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description:
          error.message === "Cannot delete car type that is in use"
            ? "ไม่สามารถลบประเภทรถที่มีการใช้งานอยู่ได้"
            : "ไม่สามารถลบประเภทรถได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (carType: CarType) => {
    setCurrentCarType(carType)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (id: number) => {
    setCurrentDeleteId(id)
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
      <div className="p-4 text-destructive">
        <p>{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          ลองใหม่อีกครั้ง
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 pt-8">
      <Toaster />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">จัดการประเภทรถ</h1>
          <p className="text-muted-foreground">จัดการประเภทรถทั้งหมดในระบบ</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            เพิ่มประเภทรถใหม่
          </Button>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Car className="h-5 w-5" />
                เพิ่มประเภทรถใหม่
              </DialogTitle>
              <DialogDescription>กรอกรายละเอียดสำหรับประเภทรถใหม่ที่ต้องการเพิ่มในระบบ</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-3">
                <Label htmlFor="name" className="text-base">
                  ชื่อประเภท <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={newCarType.name}
                  onChange={(e) => setNewCarType({ ...newCarType, name: e.target.value })}
                  placeholder="เช่น รถเก๋ง, รถตู้"
                  className="h-10"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="description" className="text-base">
                  คำอธิบาย <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={newCarType.description}
                  onChange={(e) => setNewCarType({ ...newCarType, description: e.target.value })}
                  placeholder="อธิบายรายละเอียดของประเภทรถนี้"
                  className="min-h-[100px] resize-none"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="capacity" className="text-base">
                  ความจุ (จำนวนที่นั่ง) <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="capacity"
                    type="number"
                    value={newCarType.capacity.toString()}
                    onChange={(e) => setNewCarType({ ...newCarType, capacity: Number.parseInt(e.target.value) || 0 })}
                    placeholder="5"
                    className="h-10"
                  />
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>ที่นั่ง</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                ยกเลิก
              </Button>
              <Button
                onClick={handleAddCarType}
                disabled={isSubmitting || !newCarType.name || !newCarType.description || newCarType.capacity <= 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังเพิ่ม...
                  </>
                ) : (
                  "เพิ่มประเ��ทรถ"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>ประเภทรถทั้งหมด</CardTitle>
          <CardDescription>รายการประเภทรถที่มีในระบบทั้งหมด</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[200px]">ชื่อประเภท</TableHead>
                  <TableHead>คำอธิบาย</TableHead>
                  <TableHead className="w-[100px] text-center">ความจุ</TableHead>
                  <TableHead className="w-[120px] text-right">การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carTypes.length > 0 ? (
                  carTypes.map((carType) => (
                    <TableRow key={carType.id}>
                      <TableCell className="font-medium">{carType.name}</TableCell>
                      <TableCell className="max-w-md truncate">{carType.description}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="mx-auto">
                          {carType.capacity} ที่นั่ง
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(carType)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">แก้ไข</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(carType.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">ลบ</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      ไม่พบข้อมูลประเภทรถ
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Pencil className="h-5 w-5" />
              แก้ไขประเภทรถ
            </DialogTitle>
            <DialogDescription>อัปเดตรายละเอียดสำหรับประเภทรถนี้</DialogDescription>
          </DialogHeader>
          {currentCarType && (
            <div className="grid gap-6 py-4">
              <div className="grid gap-3">
                <Label htmlFor="edit-name" className="text-base">
                  ชื่อประเภท <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={currentCarType.name}
                  onChange={(e) => setCurrentCarType({ ...currentCarType, name: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="edit-description" className="text-base">
                  คำอธิบาย <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="edit-description"
                  value={currentCarType.description}
                  onChange={(e) => setCurrentCarType({ ...currentCarType, description: e.target.value })}
                  className="min-h-[100px] resize-none"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="edit-capacity" className="text-base">
                  ความจุ (จำนวนที่นั่ง) <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="edit-capacity"
                    type="number"
                    value={currentCarType.capacity.toString()}
                    onChange={(e) =>
                      setCurrentCarType({ ...currentCarType, capacity: Number.parseInt(e.target.value) || 0 })
                    }
                    className="h-10"
                  />
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>ที่นั่ง</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleEditCarType}
              disabled={
                isSubmitting ||
                !currentCarType?.name ||
                !currentCarType?.description ||
                (currentCarType?.capacity || 0) <= 0
              }
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
      {/* Dialog ยืนยันการลบประเภทรถ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <Trash2 className="h-5 w-5 text-destructive" />
              ยืนยันการลบประเภทรถ
            </AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบประเภทรถนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
              {currentDeleteId !== null && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <div className="font-medium text-base">
                    {carTypes.find((type) => type.id === currentDeleteId)?.name}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {carTypes.find((type) => type.id === currentDeleteId)?.description}
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline">
                      {carTypes.find((type) => type.id === currentDeleteId)?.capacity} ที่นั่ง
                    </Badge>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isSubmitting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCarType}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ลบประเภทรถ"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
