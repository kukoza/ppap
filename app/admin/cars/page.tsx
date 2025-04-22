"use client"

import { useEffect, useState, useRef } from "react"
import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, Search, Filter, CarIcon, Pencil, Trash2, Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-mobile"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// ประเภทข้อมูลสำหรับรถ
interface Car {
  id: number
  name: string
  type: string
  licensePlate: string
  status: string
  currentMileage: number
  initialMileage: number
  image?: string
  fileName?: string
}

// แก้ไขข้อมูล mock เพื่อเพิ่มเลขไมล์และรูปภาพให้กับรถแต่ละคัน
const initialCars = [
  {
    id: 1,
    name: "โตโยต้า คัมรี่",
    type: "รถเก๋ง",
    licensePlate: "NZ-1234",
    status: "ว่าง",
    initialMileage: 45678,
    image: "/placeholder.svg?height=200&width=300",
    currentMileage: 45678,
  },
  {
    id: 2,
    name: "ฮอนด้า ซีอาร์-วี",
    type: "รถอเนกประสงค์",
    licensePlate: "NZ-5678",
    status: "มีการจอง",
    initialMileage: 32456,
    image: "/placeholder.svg?height=200&width=300",
    currentMileage: 32456,
  },
  {
    id: 3,
    name: "โตโยต้า ไฮเอซ",
    type: "รถตู้",
    licensePlate: "NZ-9012",
    status: "ว่าง",
    initialMileage: 78901,
    image: "/placeholder.svg?height=200&width=300",
    currentMileage: 78901,
  },
  {
    id: 4,
    name: "นิสสัน เอ็กซ์-เทรล",
    type: "รถอเนกประสงค์",
    licensePlate: "NZ-3456",
    status: "ซ่อมบำรุง",
    initialMileage: 65432,
    image: "/placeholder.svg?height=200&width=300",
    currentMileage: 65432,
  },
  {
    id: 5,
    name: "โตโยต้า โคโรลล่า",
    type: "รถเก๋ง",
    licensePlate: "NZ-7890",
    status: "ว่าง",
    initialMileage: 12345,
    image: "/placeholder.svg?height=200&width=300",
    currentMileage: 12345,
  },
]

export default function CarsManagement() {
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("ทั้งหมด")
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [selectedCar, setSelectedCar] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  // ย้าย state สำหรับเก็บข้อมูลประเภทรถมาไว้ในฟังก์ชัน component
  const [carTypeOptions, setCarTypeOptions] = useState<{ id: number; name: string }[]>([])

  // แก้ไขส่วน newCar state เพื่อเพิ่ม image
  const [newCar, setNewCar] = useState({
    name: "",
    type: "",
    licensePlate: "",
    status: "ว่าง",
    initialMileage: 0,
    image: "",
    fileName: "",
    imageFile: null as File | null,
    currentMileage: 0,
  })

  // ดึงข้อมูลรถทั้งหมด
  useEffect(() => {
    async function fetchCars() {
      try {
        setLoading(true)
        const response = await fetch("/api/cars")

        if (!response.ok) {
          throw new Error("Failed to fetch cars")
        }

        const data = await response.json()
        setCars(data)
      } catch (err) {
        setError("Error loading cars. Please try again.")
        console.error(err)
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลรถได้ กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCars()
  }, [])

  // เพิ่ม useEffect เพื่อดึงข้อมูลประเภทรถ
  useEffect(() => {
    async function fetchCarTypes() {
      try {
        const response = await fetch("/api/car-types")
        if (!response.ok) {
          throw new Error("Failed to fetch car types")
        }
        const data = await response.json()
        setCarTypeOptions(data)
      } catch (err) {
        console.error("Error loading car types:", err)
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลประเภทรถได้",
          variant: "destructive",
        })
      }
    }

    fetchCarTypes()
  }, [])

  // ฟังก์ชันอัปโหลดไฟล์
  const uploadFile = async (file: File): Promise<{ success: boolean; fileName?: string; url?: string }> => {
    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload file")
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
      return { success: false }
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    // อ่านไฟล์เพื่อแสดงตัวอย่าง
    const reader = new FileReader()
    reader.onload = () => {
      if (isEdit && selectedCar) {
        setSelectedCar({
          ...selectedCar,
          image: reader.result as string,
          imageFile: file,
        })
      } else {
        setNewCar({
          ...newCar,
          image: reader.result as string,
          imageFile: file,
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = (isEdit = false) => {
    if (isEdit && selectedCar) {
      setSelectedCar({
        ...selectedCar,
        image: "",
        fileName: "",
        imageFile: null,
      })
      if (editFileInputRef.current) {
        editFileInputRef.current.value = ""
      }
    } else {
      setNewCar({
        ...newCar,
        image: "",
        fileName: "",
        imageFile: null,
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleAddCar = async () => {
    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!newCar.name || !newCar.type || !newCar.licensePlate) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณากรอกชื่อรถ ประเภทรถ และทะเบียนรถ",
          variant: "destructive",
        })
        return
      }

      let fileName = ""
      let imageUrl = ""

      // อัปโหลดรูปภาพถ้ามี
      if (newCar.imageFile) {
        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", newCar.imageFile)

        try {
          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json()
            throw new Error(errorData.error || "Failed to upload image")
          }

          const uploadResult = await uploadResponse.json()
          if (uploadResult.success && uploadResult.fileName && uploadResult.url) {
            fileName = uploadResult.fileName
            imageUrl = uploadResult.url
            console.log("Image uploaded successfully:", imageUrl)
          } else {
            throw new Error("Failed to upload image")
          }
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError)
          toast({
            title: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
            description: "ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง",
            variant: "destructive",
          })
          setIsUploading(false)
          return
        }
        setIsUploading(false)
      }

      // สร้างข้อมูลรถใหม่
      const carData = {
        name: newCar.name,
        type: newCar.type,
        licensePlate: newCar.licensePlate,
        initialMileage: newCar.initialMileage,
        image: imageUrl,
        fileName: fileName,
      }

      console.log("Saving car data:", carData)

      // บันทึกข้อมูลลงฐานข้อมูล
      const response = await fetch("/api/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(carData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add car")
      }

      const newCarData = await response.json()
      console.log("Car added successfully:", newCarData)

      // เพิ่มรถใหม่เข้าไปในรายการ
      setCars([...cars, newCarData])

      // รีเซ็ตฟอร์ม
      setNewCar({
        name: "",
        type: "",
        licensePlate: "",
        status: "ว่าง",
        initialMileage: 0,
        image: "",
        fileName: "",
        imageFile: null,
        currentMileage: 0,
      })

      setIsAddDialogOpen(false)
      toast({
        title: "เพิ่มรถสำเร็จ",
        description: "เพิ่มข้อมูลรถใหม่เรียบร้อยแล้ว",
      })
    } catch (error: any) {
      console.error("Error adding car:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถเพิ่มรถได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    }
  }

  const handleEditCar = async () => {
    if (!selectedCar) return

    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!selectedCar.name || !selectedCar.type || !selectedCar.licensePlate) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณากรอกชื่อรถ ประเภทรถ และทะเบียนรถ",
          variant: "destructive",
        })
        return
      }

      let fileName = selectedCar.fileName || ""
      let imageUrl = selectedCar.image || ""
      // เก็บชื่อไฟล์เก่าเพื่อส่งไปให้ API ลบไฟล์เก่า
      const oldFileName = selectedCar.originalFileName || selectedCar.fileName || ""

      // อัปโหลดรูปภาพใหม่ถ้ามี
      if (selectedCar.imageFile) {
        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", selectedCar.imageFile)

        try {
          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json()
            throw new Error(errorData.error || "Failed to upload image")
          }

          const uploadResult = await uploadResponse.json()
          if (uploadResult.success && uploadResult.fileName && uploadResult.url) {
            fileName = uploadResult.fileName
            imageUrl = uploadResult.url
            console.log("Image uploaded successfully:", imageUrl)
          } else {
            throw new Error("Failed to upload image")
          }
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError)
          toast({
            title: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
            description: "ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง",
            variant: "destructive",
          })
          setIsUploading(false)
          return
        }
        setIsUploading(false)
      }

      // สร้างข้อมูลรถที่จะอัปเดต
      const carData = {
        name: selectedCar.name,
        type: selectedCar.type,
        licensePlate: selectedCar.licensePlate,
        status: selectedCar.status,
        currentMileage: selectedCar.currentMileage,
        image: imageUrl,
        fileName: fileName,
        oldFileName: oldFileName,
      }

      console.log("Updating car data:", carData)

      // อัปเดตข้อมูลในฐานข้อมูล
      const response = await fetch(`/api/cars/${selectedCar.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(carData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update car")
      }

      const updatedCarData = await response.json()
      console.log("Car updated successfully:", updatedCarData)

      // อัปเดตรายการรถ
      setCars(cars.map((car) => (car.id === selectedCar.id ? updatedCarData : car)))

      setIsEditDialogOpen(false)
      toast({
        title: "แก้ไขรถสำเร็จ",
        description: "แก้ไขข้อมูลรถเรียบร้อยแล้ว",
      })
    } catch (error: any) {
      console.error("Error updating car:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถแก้ไขข้อมูลรถได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCar = async () => {
    if (!selectedCar) return

    try {
      // ลบข้อมูลรถจากฐานข้อมูล
      const response = await fetch(`/api/cars/${selectedCar.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete car")
      }

      // ลบรถออกจากรายการ
      setCars(cars.filter((car) => car.id !== selectedCar.id))

      setIsDeleteDialogOpen(false)
      toast({
        title: "ลบรถสำเร็จ",
        description: "ลบข้อมูลรถเรียบร้อยแล้ว",
      })
    } catch (error: any) {
      console.error("Error deleting car:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถลบรถได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (e: React.MouseEvent, car: any) => {
    e.preventDefault()
    e.stopPropagation()
    // เก็บข้อมูลไฟล์เดิมไว้เพื่อใช้ในการลบไฟล์เก่า
    setSelectedCar({
      ...car,
      originalFileName: car.fileName,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (e: React.MouseEvent, car: any) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedCar(car)
    setIsDeleteDialogOpen(true)
  }

  // กรองรถตามคำค้นหาและประเภท
  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "ทั้งหมด" || car.type === filterType

    return matchesSearch && matchesType
  })

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

  return (
    <div className="p-4 pt-6 max-w-5xl mx-auto">
      <Toaster />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">จัดการรถ</h1>
        <p className="text-muted-foreground">จัดการรถทั้งหมดในระบบ</p>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหารถ..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType} className="flex-1">
            <SelectTrigger>
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="ประเภทรถ" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ทั้งหมด">ทั้งหมด</SelectItem>
              {carTypeOptions.map((type) => (
                <SelectItem key={type.id} value={type.name}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* แก้ไขส่วนนี้ โดยแยก Dialog และ Button ออกจากกัน */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มรถ
            </Button>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <CarIcon className="h-5 w-5" />
                  เพิ่มรถใหม่
                </DialogTitle>
                <DialogDescription>กรอกรายละเอียดสำหรับรถคันใหม่</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-3">
                  <Label htmlFor="car-image" className="text-base">
                    รูปภาพรถ
                  </Label>
                  <div className="flex flex-col items-center gap-4">
                    {newCar.image ? (
                      <div className="relative w-full max-w-[300px] h-[200px] mx-auto">
                        <img
                          src={newCar.image || "/placeholder.svg"}
                          alt="รูปภาพรถ"
                          className="w-full h-full object-cover rounded-md border"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full"
                          onClick={() => handleRemoveImage()}
                          disabled={isUploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="w-full max-w-[300px] h-[200px] border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">คลิกเพื่ออัปโหลดรูปภาพรถ</p>
                        <p className="text-xs text-muted-foreground">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="car-image"
                      accept="image/jpeg, image/png"
                      className="hidden"
                      onChange={(e) => handleFileChange(e)}
                      disabled={isUploading}
                    />
                    {!newCar.image && (
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full max-w-[300px]"
                        disabled={isUploading}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        เลือกรูปภาพ
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid gap-3">
                  <Label htmlFor="name" className="text-base">
                    ชื่อรถ <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={newCar.name}
                    onChange={(e) => setNewCar({ ...newCar, name: e.target.value })}
                    placeholder="โตโยต้า คัมรี่"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="type" className="text-base">
                    ประเภทรถ <span className="text-destructive">*</span>
                  </Label>
                  <Select value={newCar.type} onValueChange={(value) => setNewCar({ ...newCar, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภทรถ" />
                    </SelectTrigger>
                    <SelectContent>
                      {carTypeOptions.length > 0 ? (
                        carTypeOptions.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          ไม่พบข้อมูลประเภทรถ
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="licensePlate" className="text-base">
                    ทะเบียนรถ <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="licensePlate"
                    value={newCar.licensePlate}
                    onChange={(e) => setNewCar({ ...newCar, licensePlate: e.target.value })}
                    placeholder="NZ-1234"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="initialMileage" className="text-base">
                    เลขไมล์เริ่มต้น <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="initialMileage"
                    type="number"
                    value={newCar.initialMileage.toString()}
                    onChange={(e) => setNewCar({ ...newCar, initialMileage: Number.parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isUploading}>
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleAddCar}
                  disabled={!newCar.name || !newCar.type || !newCar.licensePlate || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังอัปโหลด...
                    </>
                  ) : (
                    "เพิ่มรถ"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCars.length > 0 ? (
          filteredCars.map((car) => (
            <Link href={`/admin/cars/${car.id}`} key={car.id}>
              <Card className="overflow-hidden hover:bg-muted/50 transition-colors h-full">
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  {car.image ? (
                    <img
                      src={car.image || "/placeholder.svg"}
                      alt={car.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error(`Failed to load image for ${car.name}:`, car.image)
                        // ถ้าโหลดรูปไม่สำเร็จ ให้แสดงรูป placeholder แทน
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=300"
                      }}
                    />
                  ) : (
                    <img
                      src="/placeholder.svg?height=200&width=300"
                      alt={car.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <CarIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{car.name}</div>
                        <div className="text-xs text-muted-foreground">{car.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          car.status === "ว่าง" ? "default" : car.status === "มีการจอง" ? "secondary" : "destructive"
                        }
                      >
                        {car.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => openEditDialog(e, car)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">แก้ไข</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => openDeleteDialog(e, car)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">ลบ</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">ทะเบียน: {car.licensePlate}</div>
                  {car.initialMileage !== undefined && (
                    <div className="text-sm text-muted-foreground mt-1">
                      เลขไมล์ล่าสุด: {car.currentMileage.toLocaleString()} กม.
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">ไม่พบรถที่ตรงกับเงื่อนไขการค้นหา</div>
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
          <span className="sr-only">เพิ่มรถ</span>
        </Button>
      )}

      {/* Dialog แก้ไขข้อมูลรถ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Pencil className="h-5 w-5" />
              แก้ไขข้อมูลรถ
            </DialogTitle>
            <DialogDescription>แก้ไขรายละเอียดของรถคันนี้</DialogDescription>
          </DialogHeader>
          {selectedCar && (
            <div className="grid gap-6 py-4">
              <div className="grid gap-3">
                <Label htmlFor="edit-car-image" className="text-base">
                  รูปภาพรถ
                </Label>
                <div className="flex flex-col items-center gap-4">
                  {selectedCar.image ? (
                    <div className="relative w-full max-w-[300px] h-[200px] mx-auto">
                      <img
                        src={selectedCar.image || "/placeholder.svg"}
                        alt="รูปภาพรถ"
                        className="w-full h-full object-cover rounded-md border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={() => handleRemoveImage(true)}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="w-full max-w-[300px] h-[200px] border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => editFileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">คลิกเพื่ออัปโหลดรูปภาพรถ</p>
                      <p className="text-xs text-muted-foreground">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
                    </div>
                  )}
                  <input
                    ref={editFileInputRef}
                    type="file"
                    id="edit-car-image"
                    accept="image/jpeg, image/png"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, true)}
                    disabled={isUploading}
                  />
                  {!selectedCar.image && (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="w-full max-w-[300px]"
                      disabled={isUploading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      เลือกรูปภาพ
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid gap-3">
                <Label htmlFor="edit-name" className="text-base">
                  ชื่อรถ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={selectedCar.name}
                  onChange={(e) => setSelectedCar({ ...selectedCar, name: e.target.value })}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="edit-type" className="text-base">
                  ประเภทรถ <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedCar.type}
                  onValueChange={(value) => setSelectedCar({ ...selectedCar, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภทรถ" />
                  </SelectTrigger>
                  <SelectContent>
                    {carTypeOptions.length > 0 ? (
                      carTypeOptions.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        ไม่พบข้อมูลประเภทรถ
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="edit-licensePlate" className="text-base">
                  ทะเบียนรถ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-licensePlate"
                  value={selectedCar.licensePlate}
                  onChange={(e) => setSelectedCar({ ...selectedCar, licensePlate: e.target.value })}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="edit-currentMileage" className="text-base">
                  เลขไมล์ล่าสุด <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-currentMileage"
                  type="number"
                  value={selectedCar.currentMileage.toString()}
                  onChange={(e) =>
                    setSelectedCar({ ...selectedCar, currentMileage: Number.parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="edit-status" className="text-base">
                  สถานะ <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedCar.status}
                  onValueChange={(value) => setSelectedCar({ ...selectedCar, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ว่าง">ว่าง</SelectItem>
                    <SelectItem value="มีการจอง">มีการจอง</SelectItem>
                    <SelectItem value="ซ่อมบำรุง">ซ่อมบำรุง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUploading}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleEditCar}
              disabled={!selectedCar?.name || !selectedCar?.type || !selectedCar?.licensePlate || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังอัปโหลด...
                </>
              ) : (
                "บันทึกการเปลี่ยนแปลง"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog ยืนยันการลบรถ */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <Trash2 className="h-5 w-5 text-destructive" />
              ยืนยันการลบรถ
            </AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบรถคันนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
              {selectedCar && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <div className="flex items-center gap-3">
                    {selectedCar.image && (
                      <img
                        src={selectedCar.image || "/placeholder.svg"}
                        alt={selectedCar.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    )}
                    <div>
                      <div className="font-medium">{selectedCar.name}</div>
                      <div className="text-sm text-muted-foreground">ทะเบียน: {selectedCar.licensePlate}</div>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบรถ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
