"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CarIcon, ChevronLeft, Wrench, Clock, FileText, Pencil, Trash2, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
}

// ประเภทข้อมูลสำหรับการจอง
interface Booking {
  id: number
  startDate: string
  endDate: string
  userName: string
  userDepartment: string
  purpose: string
  startMileage: number
  endMileage: number
}

export default function CarDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [car, setCar] = useState<CarType | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("info")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // ดึงข้อมูลรถและประวัติการจอง
  useEffect(() => {
    async function fetchCarData() {
      try {
        setLoading(true)
        // ดึงข้อมูลรถ
        const carResponse = await fetch(`/api/cars/${params.id}`)

        if (!carResponse.ok) {
          throw new Error("Failed to fetch car details")
        }

        const carData = await carResponse.json()
        setCar(carData)

        // ดึงประวัติการจอง
        const bookingsResponse = await fetch(`/api/cars/${params.id}/bookings`)

        if (!bookingsResponse.ok) {
          console.warn("Could not fetch booking history, but continuing")
          setBookings([])
        } else {
          const bookingsData = await bookingsResponse.json()
          setBookings(bookingsData)
        }
      } catch (err) {
        console.error("Error loading data:", err)
        setError("ไม่สามารถโหลดข้อมูลรถได้ กรุณาลองใหม่อีกครั้ง")
      } finally {
        setLoading(false)
      }
    }

    fetchCarData()
  }, [params.id])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
  }

  const handleDeleteCar = async () => {
    if (!car) return

    try {
      setIsDeleting(true)
      // ลบข้อมูลรถจากฐานข้อมูล
      const response = await fetch(`/api/cars/${car.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete car")
      }

      setIsDeleteDialogOpen(false)
      toast({
        title: "ลบรถสำเร็จ",
        description: "ลบข้อมูลรถเรียบร้อยแล้ว",
      })

      // นำทางกลับไปยังหน้ารายการรถ
      router.push("/admin/cars")
    } catch (error: any) {
      console.error("Error deleting car:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถลบรถได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/cars")} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">กลับ</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{car.name}</h1>
            <p className="text-muted-foreground">ทะเบียน: {car.licensePlate}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/cars/${car.id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            แก้ไข
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            ลบ
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <Badge
          variant={car.status === "ว่าง" ? "default" : car.status === "มีการจอง" ? "secondary" : "destructive"}
          className="text-sm px-3 py-1"
        >
          {car.status}
        </Badge>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Wrench className="h-4 w-4" />
            <span>บันทึกการซ่อมบำรุง</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="overflow-hidden">
          <div className="aspect-video w-full overflow-hidden bg-muted">
            {car.image ? (
              <img
                src={car.image || "/placeholder.svg"}
                alt={car.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(`Failed to load image for ${car.name}:`, car.image)
                  ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=300&width=500"
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <CarIcon className="h-16 w-16 text-muted-foreground/50" />
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CarIcon className="h-4 w-4" />
              ข้อมูลทั่วไป
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">ชื่อรถ</div>
                <div className="font-medium">{car.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">ประเภทรถ</div>
                <div className="font-medium">{car.type}</div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">ทะเบียนรถ</div>
                <div className="font-medium">{car.licensePlate}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">สถานะ</div>
                <div className="font-medium">{car.status}</div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">เลขไมล์เริ่มต้น</div>
                <div className="font-medium">{car.initialMileage.toLocaleString()} กม.</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">เลขไมล์ปัจจุบัน</div>
                <div className="font-medium">{car.currentMileage.toLocaleString()} กม.</div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">วันที่ซ่อมบำรุงล่าสุด</div>
                <div className="font-medium">{formatDate(car.lastService)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">วันที่ซ่อมบำรุงครั้งถัดไป</div>
                <div className="font-medium">{formatDate(car.nextService)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="bookings">ประวัติการจอง</TabsTrigger>
          <TabsTrigger value="maintenance">ประวัติการซ่อมบำรุง</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4 mt-4">
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{booking.userName}</div>
                    <div className="text-sm text-muted-foreground">{booking.userDepartment}</div>
                  </div>
                  <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{booking.purpose}</span>
                    </div>
                  </div>
                  {booking.startMileage && booking.endMileage && (
                    <div className="mt-3 p-2 bg-muted/50 rounded-md">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">เลขไมล์ก่อนใช้:</span>{" "}
                          <span className="font-medium">{booking.startMileage.toLocaleString()} กม.</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">เลขไมล์หลังใช้:</span>{" "}
                          <span className="font-medium">{booking.endMileage.toLocaleString()} กม.</span>
                        </div>
                      </div>
                      <div className="text-sm mt-1">
                        <span className="text-muted-foreground">ระยะทางที่ใช้:</span>{" "}
                        <span className="font-medium">
                          {(booking.endMileage - booking.startMileage).toLocaleString()} กม.
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">ไม่มีประวัติการจองสำหรับรถคันนี้</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4 mt-4">
          <Card>
            <CardContent className="py-10 text-center">
              <Wrench className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">ไม่มีประวัติการซ่อมบำรุงสำหรับรถคันนี้</p>
              <Button variant="outline" className="mt-4">
                <Wrench className="mr-2 h-4 w-4" />
                เพิ่มประวัติการซ่อมบำรุง
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              <div className="mt-4 p-4 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  {car.image && (
                    <img
                      src={car.image || "/placeholder.svg"}
                      alt={car.name}
                      className="w-16 h-16 object-cover rounded-md"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=64&width=64"
                      }}
                    />
                  )}
                  <div>
                    <div className="font-medium">{car.name}</div>
                    <div className="text-sm text-muted-foreground">ทะเบียน: {car.licensePlate}</div>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCar}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ลบรถ"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
