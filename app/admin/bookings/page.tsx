"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Car, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMediaQuery } from "@/hooks/use-mobile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Toaster } from "@/components/ui/toaster"

// ประเภทข้อมูลสำหรับการจอง
interface Booking {
  id: number
  userId: number
  carId: number
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  purpose: string
  destination?: string
  status: string
  createdAt: string
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
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("รออนุมัติ")
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ดึงข้อมูลการจองทั้งหมด
  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true)
        const response = await fetch("/api/bookings")

        if (!response.ok) {
          throw new Error("Failed to fetch bookings")
        }

        const data = await response.json()

        // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
        const formattedBookings: Booking[] = data.map((booking: any) => ({
          id: booking.id,
          userId: booking.userId,
          carId: booking.carId,
          startDate: booking.startDate,
          endDate: booking.endDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          purpose: booking.purpose,
          destination: booking.destination,
          status: booking.status,
          createdAt: booking.createdAt,
          user: {
            name: booking.userName,
            department: booking.userDepartment,
            avatar: booking.userAvatar || "/placeholder.svg?height=40&width=40", // ใช้รูปที่อัปโหลดหรือรูปแทน
          },
          car: {
            name: booking.carName,
            type: booking.carType,
            licensePlate: booking.licensePlate,
          },
        }))

        setBookings(formattedBookings)
      } catch (err) {
        console.error("Error loading bookings:", err)
        setError("ไม่สามารถโหลดข้อมูลการจองได้ กรุณาลองใหม่อีกครั้ง")
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })
  }

  // กรองการจองตามคำค้นหาและสถานะ
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.purpose.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      filterStatus === "ทั้งหมด" ||
      (filterStatus === "รออนุมัติ" && booking.status === "รออนุมัติ") ||
      (filterStatus === "ปฏิเสธ" && booking.status === "ปฏิเสธ")

    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-4 pt-6 max-w-5xl mx-auto">
      <Toaster />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">การจองรถ</h1>
        <p className="text-muted-foreground">จัดการการจองรถทั้งหมดในระบบ</p>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาการจอง..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="สถานะ" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ทั้งหมด">ทั้งหมด</SelectItem>
            <SelectItem value="รออนุมัติ">รออนุมัติ</SelectItem>
            <SelectItem value="ปฏิเสธ">ปฏิเสธ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12">กำลังโหลดข้อมูล...</div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">{error}</div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <Link href={`/admin/bookings/${booking.id}`} key={booking.id}>
                <Card className="overflow-hidden hover:bg-muted/50 transition-colors">
                  <div
                    className={`h-1 ${
                      booking.status === "อนุมัติแล้ว"
                        ? "bg-green-500"
                        : booking.status === "รออนุมัติ"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  ></div>
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
                      <Badge
                        variant={
                          booking.status === "อนุมัติแล้ว"
                            ? "default"
                            : booking.status === "รออนุมัติ"
                              ? "outline"
                              : "destructive"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <div className="text-sm mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Car className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{booking.car.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {booking.startTime} - {booking.endTime} น.
                        </span>
                      </div>
                      <div className="flex items-start gap-2 mt-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                        <span className="line-clamp-1">{booking.purpose}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">ไม่พบการจองที่ตรงกับเงื่อนไขการค้นหา</div>
          )}
        </div>
      )}
    </div>
  )
}
