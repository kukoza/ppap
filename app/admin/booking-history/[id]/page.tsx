"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Car, ChevronLeft, User, MapPin, FileText, Loader2, AlertCircle } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-mobile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// ประเภทข้อมูลสำหรับประวัติการจอง
interface BookingDetail {
  id: number
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  purpose: string
  destination?: string
  status: string
  startMileage: number
  endMileage: number
  mileageDiff: number
  fuelLevel?: string
  fuelCost?: number
  notes?: string
  createdAt: string
  approvedAt?: string
  user: {
    name: string
    department: string
    email: string
    phone: string
    avatar?: string
  }
  car: {
    name: string
    type: string
    licensePlate: string
  }
  approver?: {
    name: string
  }
}

export default function BookingHistoryDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ดึงข้อมูลประวัติการจอง
  useEffect(() => {
    async function fetchBookingDetail() {
      try {
        setLoading(true)
        const response = await fetch(`/api/booking-history/${params.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch booking detail")
        }

        const data = await response.json()
        setBooking(data)
      } catch (err) {
        console.error("Error loading booking detail:", err)
        setError("ไม่สามารถโหลดข้อมูลรายละเอียดการจองได้ กรุณาลองใหม่อีกครั้ง")
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลรายละเอียดการจองได้",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBookingDetail()
  }, [params.id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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

  if (error || !booking) {
    return (
      <div className="p-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/booking-history")} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">กลับ</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">รายละเอียดประวัติการจอง</h1>
            <p className="text-muted-foreground">ID: {params.id}</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-destructive">{error || "ไม่พบข้อมูลการจอง"}</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/booking-history")}>
                กลับไปยังหน้าประวัติการจอง
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <Toaster />
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/booking-history")} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">กลับ</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">รายละเอียดประวัติการจอง</h1>
          <p className="text-muted-foreground">ID: {params.id}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 text-sm px-3 py-1">{booking.status}</Badge>
        <p className="text-sm text-muted-foreground">คืนรถเมื่อ: {formatDateTime(booking.endDate)}</p>
      </div>

      <div className="space-y-6">
        {/* ข้อมูลผู้จอง */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              ข้อมูลผู้จอง
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={booking.user.avatar} alt={booking.user.name} />
                <AvatarFallback>{booking.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-lg">{booking.user.name}</div>
                <div className="text-sm text-muted-foreground">{booking.user.department}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">อีเมล</div>
                <div>{booking.user.email}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">เบอร์โทรศัพท์</div>
                <div>{booking.user.phone || "-"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ข้อมูลการจอง */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-4 w-4" />
              ข้อมูลการจอง
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">รถ</div>
              <div className="font-medium">
                {booking.car.name} ({booking.car.type})
              </div>
              <div className="text-sm text-muted-foreground">ทะเบียน: {booking.car.licensePlate}</div>
            </div>

            <Separator />

            <div>
              <div className="text-sm text-muted-foreground mb-1">วันที่</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                </span>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">เวลา</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {booking.startTime} - {booking.endTime} น.
                </span>
              </div>
            </div>

            {booking.destination && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">สถานที่</div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.destination}</span>
                </div>
              </div>
            )}

            <Separator />

            <div>
              <div className="text-sm text-muted-foreground mb-1">วัตถุประสงค์</div>
              <p>{booking.purpose}</p>
            </div>
          </CardContent>
        </Card>

        {/* ข้อมูลการใช้งาน */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4" />
              ข้อมูลการใช้งาน
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">เลขไมล์เริ่มต้น</div>
                <div className="font-medium">{booking.startMileage.toLocaleString()} กม.</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">เลขไมล์สิ้นสุด</div>
                <div className="font-medium">{booking.endMileage.toLocaleString()} กม.</div>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-md">
              <div className="font-medium">ระยะทางที่ใช้: {booking.mileageDiff.toLocaleString()} กม.</div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">ระดับน้ำมันเมื่อคืนรถ</div>
                <div className="font-medium">{booking.fuelLevel}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">ค่าน้ำมัน</div>
                <div className="font-medium">{booking.fuelCost ? booking.fuelCost.toLocaleString() : "-"} บาท</div>
              </div>
            </div>

            {booking.notes && (
              <>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground mb-1">หมายเหตุ</div>
                  <p>{booking.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ข้อมูลการอนุมัติ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4" />
              ข้อมูลการอนุมัติ
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">วันที่สร้างคำขอ</div>
                <div>{formatDateTime(booking.createdAt)}</div>
              </div>
              {booking.approvedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">วันที่อนุมัติ</div>
                  <div>{formatDateTime(booking.approvedAt)}</div>
                </div>
              )}
            </div>

            {booking.approver && (
              <div>
                <div className="text-sm text-muted-foreground">อนุมัติโดย</div>
                <div className="font-medium">{booking.approver.name}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ปุ่มพิมพ์รายงาน */}
        <div className="flex justify-center">
          <Button className="w-full md:w-auto">
            <FileText className="mr-2 h-4 w-4" />
            พิมพ์รายงานการใช้รถ
          </Button>
        </div>
      </div>
    </div>
  )
}
