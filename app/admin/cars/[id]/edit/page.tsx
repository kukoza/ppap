"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, CarIcon, Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// ประเภทข้อมูลสำหรับรถ
interface CarType {
  id: number
  name: string
  type: string
  licensePlate: string
  status: string
  initialMileage: number
  currentMileage: number
  lastService: string | null
  nextService: string | null
  image: string | null
  fileName: string | null
  imageFile?: File | null
  originalFileName?: string | null
}

// แก้ไขส่วนที่กำหนดค่า carTypes แบบ hardcode
// จากเดิม:
// const carTypes = ["รถเก๋ง", "รถอเนกประสงค์", "รถตู้", "รถกระบะ", "รถมินิบัส"]

// เปลี่ยนเป็นการดึงข้อมูลจาก API
// เพิ่ม state สำหรับเก็บข้อมูลประเภทรถ
const [carTypeOptions, setCarTypeOptions] = useState<{ id: number; name: string }[]>([])

// Mock data for car types
// const carTypes = ["รถเก๋ง", "รถอเนกประสงค์", "รถตู้", "รถกระบะ", "รถมินิบัส"]

export default function EditCar({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [car, setCar] = useState<CarType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [carTypesLoading, setCarTypesLoading] = useState(true)
  const [carTypesError, setCarTypesError] = useState<string | null>(null)

  // ดึงข้อมูลรถ
  useEffect(() => {
    async function fetchCarData() {
      try {
        setLoading(true)
        const response = await fetch(`/api/cars/${params.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch car details")
        }

        const carData = await response.json()
        setCar({
          ...carData,
          originalFileName: carData.fileName,
        })
      } catch (err) {
        console.error("Error loading data:", err)
        setError("ไม่สามารถโหลดข้อมูลรถได้ กรุณาลองใหม่อีกครั้ง")
      } finally {
        setLoading(false)
      }
    }

    fetchCarData()
  }, [params.id])

  // เพิ่ม useEffect เพื่อดึงข้อมูลประเภทรถ
  useEffect(() => {
    async function fetchCarTypes() {
      try {
        setCarTypesLoading(true)
        const response = await fetch("/api/car-types")
        if (!response.ok) {
          throw new Error("Failed to fetch car types")
        }
        const data = await response.json()
        setCarTypeOptions(data)
      } catch (err) {
        console.error("Error loading car types:", err)
        setCarTypesError("ไม่สามารถโหลดข้อมูลประเภทรถได้")
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลประเภทรถได้",
          variant: "destructive",
        })
      } finally {
        setCarTypesLoading(false)
      }
    }

    fetchCarTypes()
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !car) return

    // อ่านไฟล์เพื่อแสดงตัวอย่าง
    const reader = new FileReader()
    reader.onload = () => {
      setCar({
        ...car,
        image: reader.result as string,
        imageFile: file,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    if (!car) return

    setCar({
      ...car,
      image: "",
      fileName: "",
      imageFile: null,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSave = async () => {
    if (!car) return

    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!car.name || !car.type || !car.licensePlate) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณากรอกชื่อรถ ประเภทรถ และทะเบียนรถ",
          variant: "destructive",
        })
        return
      }

      setIsSaving(true)
      let fileName = car.fileName || ""
      let imageUrl = car.image || ""
      const oldFileName = car.originalFileName || ""

      // อัปโหลดรูปภาพใหม่ถ้ามี
      if (car.imageFile) {
        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", car.imageFile)

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
          setIsSaving(false)
          return
        }
        setIsUploading(false)
      }

      // สร้างข้อมูลรถที่จะอัปเดต
      const carData = {
        name: car.name,
        type: car.type,
        licensePlate: car.licensePlate,
        status: car.status,
        currentMileage: car.currentMileage,
        image: imageUrl,
        fileName: fileName,
        oldFileName: oldFileName,
      }

      console.log("Updating car data:", carData)

      // อัปเดตข้อมูลในฐานข้อมูล
      const response = await fetch(`/api/cars/${car.id}`, {
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

      toast({
        title: "แก้ไขรถสำเร็จ",
        description: "แก้ไขข้อมูลรถเรียบร้อยแล้ว",
      })

      // นำทางกลับไปยังหน้ารายละเอียดรถ
      router.push(`/admin/cars/${car.id}`)
    } catch (error: any) {
      console.error("Error updating car:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถแก้ไขข้อมูลรถได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
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

  if (error || !car) {
    return (
      <div className="p-4 text-destructive">
        <p>{error || "ไม่พบข้อมูลรถ"}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/cars")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          กลับไปยังรายการรถ
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <Toaster />
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/cars/${car.id}`)} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">กลับ</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">แก้ไขข้อมูลรถ</h1>
          <p className="text-muted-foreground">{car.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CarIcon className="h-4 w-4" />
            ข้อมูลรถ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3">
            <Label htmlFor="car-image" className="text-base">
              รูปภาพรถ
            </Label>
            <div className="flex flex-col items-center gap-4">
              {car.image ? (
                <div className="relative w-full max-w-[300px] h-[200px] mx-auto">
                  <img
                    src={car.image || "/placeholder.svg"}
                    alt="รูปภาพรถ"
                    className="w-full h-full object-cover rounded-md border"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=300"
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={handleRemoveImage}
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
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {!car.image && (
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
              value={car.name}
              onChange={(e) => setCar({ ...car, name: e.target.value })}
              placeholder="โตโยต้า คัมรี่"
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="type" className="text-base">
              ประเภทรถ <span className="text-destructive">*</span>
            </Label>
            <Select
              value={car.type}
              onValueChange={(value) => setCar({ ...car, type: value })}
              disabled={carTypesLoading}
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
            {carTypesError && <p className="text-sm text-destructive">{carTypesError}</p>}
          </div>
          <div className="grid gap-3">
            <Label htmlFor="licensePlate" className="text-base">
              ทะเบียนรถ <span className="text-destructive">*</span>
            </Label>
            <Input
              id="licensePlate"
              value={car.licensePlate}
              onChange={(e) => setCar({ ...car, licensePlate: e.target.value })}
              placeholder="NZ-1234"
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="currentMileage" className="text-base">
              เลขไมล์ล่าสุด <span className="text-destructive">*</span>
            </Label>
            <Input
              id="currentMileage"
              type="number"
              value={car.currentMileage.toString()}
              onChange={(e) => setCar({ ...car, currentMileage: Number.parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="status" className="text-base">
              สถานะ <span className="text-destructive">*</span>
            </Label>
            <Select value={car.status} onValueChange={(value) => setCar({ ...car, status: value })}>
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

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => router.push(`/admin/cars/${car.id}`)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                "บันทึกการเปลี่ยนแปลง"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
