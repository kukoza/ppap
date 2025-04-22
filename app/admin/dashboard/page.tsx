"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Car } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-mobile"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Booking {
  id: number
  startDate: string
  endDate: string
  purpose: string
  status: string
  userName: string
  userDepartment: string
  carName: string
  carType: string
}

interface CarType {
  id: number
  name: string
  type: string
  status: string
  lastUsed: string
}

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("ทั้งหมด")
  const isMobile = useMediaQuery("(max-width: 768px)")

  const [bookings, setBookings] = useState<Booking[]>([])
  const [cars, setCars] = useState<CarType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // ดึงข้อมูลการจอง
      const bookingsResponse = await fetch("/api/bookings")
      if (!bookingsResponse.ok) {
        throw new Error("Failed to fetch bookings")
      }
      const bookingsData = await bookingsResponse.json()
      setBookings(bookingsData)

      // ดึงข้อมูลรถ
      const carsResponse = await fetch("/api/cars")
      if (!carsResponse.ok) {
        throw new Error("Failed to fetch cars")
      }
      const carsData = await carsResponse.json()
      setCars(carsData)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to load data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })
  }

  // กรองการจองตามคำค้นหาและสถานะ
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.carName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.purpose.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      filterStatus === "ทั้งหมด" ||
      (filterStatus === "รออนุมัติ" && booking.status === "รออนุมัติ") ||
      (filterStatus === "อนุมัติแล้ว" && booking.status === "อนุมัติแล้ว")

    return matchesSearch && matchesStatus
  })

  // คำนวณสถิติ
  const pendingBookingsCount = bookings.filter((b) => b.status === "รออนุมัติ").length
  const availableCarsCount = cars.filter((c) => c.status === "ว่าง").length

  if (loading) {
    return <div className="p-4">กำลังโหลดข้อมูล...</div>
  }

  if (error) {
    return <div className="p-4 text-destructive">{error}</div>
  }

  return (
    <div className="p-4 pt-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">แดชบอร์ด</h1>
        <p className="text-muted-foreground">ภาพรวมของระบบจองรถ</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              การจองรออนุมัติ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingBookingsCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4" />
              รถพร้อมใช้งาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{availableCarsCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* การจองล่าสุด */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">การจองล่าสุด</h2>
          <Link href="/admin/bookings">
            <Button variant="outline" size="sm">
              ดูทั้งหมด
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {filteredBookings.slice(0, 3).map((booking) => (
            <Link href={`/admin/bookings/${booking.id}`} key={booking.id}>
              <Card className="overflow-hidden hover:bg-muted/50 transition-colors">
                <div className={`h-1 ${booking.status === "อนุมัติแล้ว" ? "bg-green-500" : "bg-yellow-500"}`}></div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{booking.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{booking.userName}</div>
                        <div className="text-xs text-muted-foreground">{booking.userDepartment}</div>
                      </div>
                    </div>
                    <Badge variant={booking.status === "อนุมัติแล้ว" ? "default" : "outline"} className="ml-auto">
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{booking.carName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatDate(booking.startDate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* รถที่ว่าง */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">รถที่พร้อมใช้งาน</h2>
          <Link href="/admin/cars">
            <Button variant="outline" size="sm">
              ดูทั้งหมด
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {cars
            .filter((car) => car.status === "ว่าง")
            .slice(0, 3)
            .map((car) => (
              <Link href={`/admin/cars/${car.id}`} key={car.id}>
                <Card className="overflow-hidden hover:bg-muted/50 transition-colors">
                  <div className="h-1 bg-green-500"></div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{car.name}</div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        พร้อมใช้งาน
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{car.type}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>
      </div>

      {/* Fixed Action Button */}
      {isMobile && (
        <Link href="/admin/bookings">
          <Button size="lg" className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-30">
            <Calendar className="h-6 w-6" />
            <span className="sr-only">การจอง</span>
          </Button>
        </Link>
      )}
    </div>
  )
}
