"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Car, Search, Filter, FileText, Loader2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMediaQuery } from "@/hooks/use-mobile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// ประเภทข้อมูลสำหรับประวัติการจอง
interface BookingHistory {
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

export default function BookingHistory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCar, setFilterCar] = useState("ทั้งหมด")
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ดึงข้อมูลประวัติการจอง
  useEffect(() => {
    async function fetchBookingHistory() {
      try {
        setLoading(true)
        const response = await fetch("/api/booking-history")

        if (!response.ok) {
          throw new Error("Failed to fetch booking history")
        }

        const data = await response.json()
        setBookingHistory(data)
      } catch (err) {
        console.error("Error loading booking history:", err)
        setError("ไม่สามารถโหลดข้อมูลประวัติการจองได้ กรุณาลองใหม่อีกครั้ง")
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลประวัติการจองได้",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBookingHistory()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })
  }

  // รายการรถทั้งหมดสำหรับตัวกรอง
  const allCars = [...new Set(bookingHistory.map((booking) => booking.car.name))]

  // กรองการจองตามคำค้นหาและรถ
  const filteredBookings = bookingHistory.filter((booking) => {
    const matchesSearch =
      booking.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.car.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.destination && booking.destination.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCar = filterCar === "ทั้งหมด" || booking.car.name === filterCar

    return matchesSearch && matchesCar
  })

  // คำนวณสถิติ
  const totalMileage = filteredBookings.reduce((sum, booking) => sum + (booking.mileageDiff || 0), 0)
  const totalBookings = filteredBookings.length

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
      <div className="p-4 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">ประวัติการจอง</h1>
          <p className="text-muted-foreground">ประวัติการจองรถที่คืนแล้วและสรุปเลขไมล์</p>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-destructive">{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                ลองใหม่อีกครั้ง
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 pt-6 max-w-5xl mx-auto">
      <Toaster />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ประวัติการจอง</h1>
        <p className="text-muted-foreground">ประวัติการจองรถที่คืนแล้วและสรุปเลขไมล์</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              จำนวนการจองทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalBookings} รายการ</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4" />
              ระยะทางรวมทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMileage.toLocaleString()} กม.</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาประวัติการจอง..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={filterCar} onValueChange={setFilterCar}>
          <SelectTrigger>
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="กรองตามรถ" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ทั้งหมด">ทั้งหมด</SelectItem>
            {allCars.map((car) => (
              <SelectItem key={car} value={car}>
                {car}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={booking.user.avatar} alt={booking.user.name} />
                      <AvatarFallback>{booking.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{booking.user.name}</div>
                      <div className="text-xs text-muted-foreground">{booking.user.department}</div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{booking.status}</Badge>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{booking.car.name}</span>
                    <span className="text-sm text-muted-foreground">({booking.car.licensePlate})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                    </span>
                  </div>
                </div>

                <Separator className="my-3" />

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

                <div className="mt-3 p-2 bg-muted/50 rounded-md">
                  <div className="text-sm font-medium">ระยะทางที่ใช้: {booking.mileageDiff.toLocaleString()} กม.</div>
                  {booking.fuelLevel && (
                    <div className="text-sm mt-1">
                      <span className="text-muted-foreground">ระดับน้ำมัน:</span> {booking.fuelLevel}
                    </div>
                  )}
                  {booking.notes && (
                    <div className="text-sm mt-1">
                      <span className="text-muted-foreground">หมายเหตุ:</span> {booking.notes}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <Link href={`/admin/booking-history/${booking.id}`}>
                    <Button variant="outline" className="w-full md:w-auto">
                      ดูรายละเอียดเพิ่มเติม
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-muted-foreground">ไม่พบประวัติการจองที่ตรงกับเงื่อนไขการค้นหา</CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  )
}
