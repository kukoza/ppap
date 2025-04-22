"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Car, AlertCircle, MapPin } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-mobile"
import { useRouter } from "next/navigation"
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
import FixCarStatus from "./fix-car-status"

// เพิ่ม interface สำหรับข้อมูลผู้ใช้
interface UserData {
  id: number
  name: string
  email: string
  department: string
  role: string
  avatar?: string
}

// เพิ่ม interface สำหรับข้อมูลการจอง
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
  notes?: string
  createdAt: string
  car?: {
    id: number
    name: string
    type: string
    licensePlate: string
  }
  carName?: string
  carType?: string
}

export default function UserDashboard() {
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [userBookings, setUserBookings] = useState<Booking[]>([])

  // State for cancel booking dialog
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // เพิ่มส่วนของ state ในฟังก์ชัน UserDashboard
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  // เพิ่ม useEffect เพื่อดึงข้อมูลผู้ใช้
  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await fetch("/api/auth/me")
        if (!response.ok) {
          throw new Error("Failed to fetch user data")
        }
        const userData = await response.json()
        setUser(userData)
        console.log("User data:", userData)
      } catch (error) {
        console.error("Error fetching user data:", error)
        // หากไม่สามารถดึงข้อมูลผู้ใช้ได้ ให้นำทางกลับไปยังหน้าเข้าสู่ระบบ
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  // แก้ไขส่วนของการดึงข้อมูลการจอง
  useEffect(() => {
    async function fetchBookings() {
      try {
        if (!user) return

        setIsLoading(true)
        setError(null)

        // ดึงข้อมูลการจองของผู้ใช้
        console.log(`Fetching bookings for user ID: ${user.id}`)
        const bookingsResponse = await fetch(`/api/users/${user.id}/bookings`)

        if (!bookingsResponse.ok) {
          throw new Error(`Failed to fetch bookings: ${bookingsResponse.status} ${bookingsResponse.statusText}`)
        }

        const bookingsData = await bookingsResponse.json()
        console.log("Bookings data:", bookingsData)

        if (!Array.isArray(bookingsData)) {
          console.error("Bookings data is not an array:", bookingsData)
          setUserBookings([])
          return
        }

        // แปลงข้อมูลให้ตรงกับ interface Booking
        const formattedBookings = bookingsData.map((booking: any) => {
          // ตรวจสอบว่ามี car object หรือไม่
          if (!booking.car && booking.carName) {
            booking.car = {
              id: booking.carId || 0,
              name: booking.carName || "ไม่ระบุ",
              type: booking.carType || "ไม่ระบุ",
              licensePlate: booking.licensePlate || "ไม่ระบุ",
            }
          }
          return booking
        })

        console.log("Formatted bookings:", formattedBookings)
        setUserBookings(formattedBookings)
      } catch (err) {
        console.error("Error fetching bookings:", err)
        setError("ไม่สามารถดึงข้อมูลการจองได้ กรุณาลองใหม่อีกครั้ง")
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลการจองได้ กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchBookings()
    }
  }, [user])

  // Check for new booking from localStorage
  useEffect(() => {
    // ตรวจสอบว่าอยู่ในฝั่ง client ก่อนใช้ localStorage
    if (typeof window !== "undefined") {
      const newBooking = localStorage.getItem("newBooking")
      if (newBooking) {
        try {
          console.log("Found new booking in localStorage:", newBooking)
          const bookingData = JSON.parse(newBooking)

          // สร้างการจองชั่วคราวเพื่อแสดงทันที
          const tempBooking: Booking = {
            id: Date.now(), // ใช้ timestamp เป็น ID ชั่วคราว
            userId: user?.id || 0,
            carId: bookingData.carId || 0,
            startDate: bookingData.startDate || new Date().toISOString().split("T")[0],
            endDate: bookingData.endDate || new Date().toISOString().split("T")[0],
            startTime: bookingData.startTime || "00:00",
            endTime: bookingData.endTime || "00:00",
            purpose: bookingData.purpose || "",
            status: "รออนุมัติ",
            createdAt: new Date().toISOString(),
            car: {
              id: bookingData.carId || 0,
              name: bookingData.carName || "รถที่จอง",
              type: bookingData.carType || "ประเภทรถ",
              licensePlate: bookingData.licensePlate || "",
            },
          }

          console.log("Created temporary booking:", tempBooking)
          setUserBookings((prev) => [tempBooking, ...prev])

          // ดึงข้อมูลการจองใหม่จาก API
          if (user) {
            setTimeout(() => {
              fetch(`/api/users/${user.id}/bookings`)
                .then((response) => {
                  if (!response.ok) {
                    throw new Error(`Failed to fetch updated bookings: ${response.status}`)
                  }
                  return response.json()
                })
                .then((bookings) => {
                  console.log("Updated bookings:", bookings)
                  // ค้นหาการจองล่าสุด
                  if (Array.isArray(bookings) && bookings.length > 0) {
                    const latestBooking = bookings.sort(
                      (a: Booking, b: Booking) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                    )[0]

                    if (latestBooking) {
                      // ดึงข้อมูลรายละเอียดของการจองล่าสุด
                      fetch(`/api/bookings/${latestBooking.id}`)
                        .then((response) => {
                          if (!response.ok) {
                            throw new Error(`Failed to fetch latest booking details: ${response.status}`)
                          }
                          return response.json()
                        })
                        .then((bookingDetail) => {
                          console.log("Latest booking details:", bookingDetail)
                          setUserBookings((prev) => [
                            bookingDetail,
                            ...prev.filter((b) => b.id !== tempBooking.id && b.id !== bookingDetail.id),
                          ])
                        })
                        .catch((error) => console.error("Error fetching latest booking details:", error))
                    }
                  }
                })
                .catch((error) => console.error("Error fetching updated bookings:", error))
            }, 1000) // รอ 1 วินาทีก่อนดึงข้อมูลจริง
          }

          // Clear the localStorage
          localStorage.removeItem("newBooking")

          // Show success toast
          toast({
            title: "ส่งคำขอจองสำเร็จ",
            description: "คำขอจองของคุณถูกส่งไปยังผู้ดูแลระบบเพื่อรออนุมัติ",
          })
        } catch (error) {
          console.error("Error parsing booking data:", error)
        }
      }
    }
  }, [user])

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })
    } catch (error) {
      console.error("Error formatting date:", error, dateString)
      return dateString
    }
  }

  // กรองเฉพาะการจองที่ยังไม่หมดอายุ
  const activeBookings = userBookings.filter((booking) => {
    // ตรวจสอบว่ามีสถานะหรือไม่ ถ้าไม่มีให้กำหนดเป็น "รออนุมัติ"
    if (!booking.status) {
      booking.status = "รออนุมัติ"
    }

    // ตรวจสอบว่ามีวันที่สิ้นสุดหรือไม่
    if (!booking.endDate) {
      return true // ถ้าไม่มีวันที่สิ้นสุด ให้แสดงทุกรายการ
    }

    try {
      // แสดงทุกรายการโดยไม่กรองตามวันที่
      return true
      // เดิม: return new Date(booking.endDate) >= new Date()
    } catch (error) {
      console.error("Error comparing dates:", error, booking)
      return true // ถ้ามีข้อผิดพลาดในการเปรียบเทียบวันที่ ให้แสดงรายการนั้น
    }
  })

  console.log("Active bookings:", activeBookings)

  // Handle cancel booking
  const openCancelDialog = (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation() // ป้องกันการนำทางไปยังหน้ารายละเอียด
    setBookingToCancel(booking)
    setIsCancelDialogOpen(true)
  }

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return

    setIsCancelling(true)

    try {
      // ส่งคำขอลบการจองไปยัง API
      const response = await fetch(`/api/bookings/${bookingToCancel.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to cancel booking")
      }

      const result = await response.json()
      console.log("Cancel booking result:", result)

      // ลบการจองออกจากรายการ
      setUserBookings(userBookings.filter((booking) => booking.id !== bookingToCancel.id))

      // แสดงข้อความสำเร็จ
      toast({
        title: "ยกเลิกการจองสำเร็จ",
        description: result.carUpdated
          ? `คำขอจองของคุณถูกยกเลิกเรียบร้อยแล้ว และสถานะรถถูกอัปเดตเป็น 'ว่าง'`
          : "คำขอจองของคุณถูกยกเลิกเรียบร้อยแล้ว",
        variant: "default",
      })

      // รีเฟรชข้อมูลการจองหลังจากยกเลิก
      if (user) {
        setTimeout(async () => {
          try {
            const refreshResponse = await fetch(`/api/users/${user.id}/bookings`)
            if (!refreshResponse.ok) {
              throw new Error("Failed to refresh bookings")
            }
            const refreshedBookings = await refreshResponse.json()
            setUserBookings(refreshedBookings)
          } catch (refreshError) {
            console.error("Error refreshing bookings:", refreshError)
          }
        }, 500)
      }
    } catch (error: any) {
      console.error("Error cancelling booking:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถยกเลิกการจองได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
      setIsCancelDialogOpen(false)
    }
  }

  // ฟังก์ชันสำหรับกำหนดสีตามสถานะ
  const getStatusColor = (status: string) => {
    switch (status) {
      case "อนุมัติแล้ว":
        return "bg-green-500"
      case "รออนุมัติ":
        return "bg-yellow-500"
      case "ปฏิเสธ":
        return "bg-red-500"
      case "ยกเลิก":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  // ฟังก์ชันสำหรับกำหนด variant ของ Badge ตามสถานะ
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "อนุมัติแล้ว":
        return "default"
      case "รออนุมัติ":
        return "secondary"
      case "ปฏิเสธ":
        return "destructive"
      case "ยกเลิก":
        return "outline"
      default:
        return "outline"
    }
  }

  // ฟังก์ชันนำทางไปยังหน้ารายละเอียดการจอง
  const navigateToBookingDetail = (bookingId: number) => {
    router.push(`/user/bookings/${bookingId}`)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 pt-6">
      <Toaster />
      <div className="mt-4">
        {loading ? (
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">กำลังโหลดข้อมูล...</h1>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-secondary">
              <img
                src={user?.avatar || "/placeholder.svg?height=48&width=48"}
                alt={user?.name || "User"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=48&width=48"
                }}
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">ยินดีต้อนรับ, {user?.name || "ผู้ใช้"}</h1>
              <p className="text-muted-foreground">จัดการการจองรถของคุณและทำการจองใหม่</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions - แสดงเป็นปุ่มใหญ่บนมือถือ */}
      <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
        {isMobile ? (
          <div className="flex flex-col gap-3">
            <Link href="/user/book" className="w-full">
              <Button className="w-full h-14 text-lg flex items-center justify-center gap-2">
                <Car className="h-5 w-5" />
                จองรถ
              </Button>
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <Card className="flex flex-col items-center justify-center p-4">
                <p className="text-sm text-muted-foreground">การจองของคุณ</p>
                <p className="text-2xl font-bold">{userBookings.length}</p>
              </Card>
              <Card className="flex flex-col items-center justify-center p-4">
                <p className="text-sm text-muted-foreground">รออนุมัติ</p>
                <p className="text-2xl font-bold">
                  {userBookings.filter((booking) => booking.status === "รออนุมัติ").length}
                </p>
              </Card>
            </div>
          </div>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">การจองของคุณ</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userBookings.length}</div>
                <p className="text-xs text-muted-foreground">
                  {userBookings.filter((booking) => booking.status === "รออนุมัติ").length} รายการรออนุมัติ
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">สถานะการจอง</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">อนุมัติแล้ว: {userBookings.filter((b) => b.status === "อนุมัติแล้ว").length}</Badge>
                  <Badge variant="secondary">รออนุมัติ: {userBookings.filter((b) => b.status === "รออนุมัติ").length}</Badge>
                  <Badge variant="destructive">ปฏิเสธ: {userBookings.filter((b) => b.status === "ปฏิเสธ").length}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">การดำเนินการด่วน</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-col gap-2">
                  <Link href="/user/book">
                    <Button className="w-full">จองรถ</Button>
                  </Link>
                  <Link href="/user/profile">
                    <Button variant="outline" className="w-full">
                      ดูโปรไฟล์
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* แสดงปุ่มแก้ไขสถานะรถ */}
      <div className="mt-2">
        <FixCarStatus />
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">การจองของฉัน</h2>

        {isLoading ? (
          <div className="py-10 text-center bg-white rounded-lg shadow">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-muted-foreground">กำลังโหลดข้อมูลการจอง...</p>
            </div>
          </div>
        ) : error ? (
          <div className="py-10 text-center bg-white rounded-lg shadow">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                onClick={() => {
                  if (user) {
                    setIsLoading(true)
                    fetch(`/api/users/${user.id}/bookings`)
                      .then((res) => res.json())
                      .then((data) => {
                        setUserBookings(data)
                        setError(null)
                      })
                      .catch((err) => {
                        console.error("Error refreshing bookings:", err)
                        setError("ไม่สามารถดึงข้อมูลการจองได้ กรุณาลองใหม่อีกครั้ง")
                      })
                      .finally(() => setIsLoading(false))
                  }
                }}
              >
                ลองใหม่
              </Button>
            </div>
          </div>
        ) : userBookings.length > 0 ? (
          <div className="space-y-4">
            {userBookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-lg overflow-hidden border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigateToBookingDetail(booking.id)}
              >
                <div className={`border-t-4 ${getStatusColor(booking.status)}`}></div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-2">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-secondary">
                        <img
                          src={user?.avatar || "/placeholder.svg?height=32&width=32"}
                          alt={user?.name || "User"}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=32&width=32"
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-medium">{user?.name || "ผู้ใช้"}</div>
                        <div className="text-sm text-muted-foreground">{user?.department || "ฝ่ายงาน"}</div>
                      </div>
                      <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                    </div>
                    {booking.status === "รออนุมัติ" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive"
                        onClick={(e) => openCancelDialog(booking, e)}
                      >
                        ยกเลิกคำขอ
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.car?.name || booking.carName || "รถที่จอง"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(booking.startDate)}</span>
                      {booking.startDate !== booking.endDate && <> - {formatDate(booking.endDate)}</>}
                    </div>
                    {(booking.startTime || booking.endTime) && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {booking.startTime} - {booking.endTime} น.
                        </span>
                      </div>
                    )}
                    {booking.purpose && (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{booking.purpose}</span>
                      </div>
                    )}
                    {booking.destination && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{booking.destination}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`border-b-4 ${getStatusColor(booking.status)}`}></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center bg-white rounded-lg shadow">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">คุณไม่มีการจองในขณะนี้</p>
            </div>
            <div className="mt-4">
              <Link href="/user/book">
                <Button>จองรถตอนนี้</Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Action Button สำหรับมือถือ */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-10">
          <Link href="/user/book">
            <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
              <Car className="h-6 w-6" />
              <span className="sr-only">จองรถ</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Cancel Booking Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการยกเลิกการจอง</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองรถคันนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
              {bookingToCancel && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <div className="font-medium">{bookingToCancel.car?.name || bookingToCancel.carName || "รถที่จอง"}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(bookingToCancel.startDate)} - {formatDate(bookingToCancel.endDate)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {bookingToCancel.startTime} - {bookingToCancel.endTime} น.
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? "กำลังยกเลิก..." : "ยืนยันการยกเลิก"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
