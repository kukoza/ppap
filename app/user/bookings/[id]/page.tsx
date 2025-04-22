"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ChevronLeft, MapPin, AlertCircle, RefreshCw } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-mobile"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
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

// เพิ่ม interface สำหรับข้อมูลผู้ใช้
interface UserData {
  id: number
  name: string
  email: string
  department: string
  role: string
  phone?: string
  avatar?: string
}

// เพิ่ม interface สำหรับข้อมูลรถ
interface CarData {
  id: number
  name: string
  type: string
  licensePlate: string
  status: string
  image?: string
}

// เพิ่ม interface สำหรับข้อมูลการจอง
interface BookingData {
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
  updatedAt: string
  user?: UserData
  car?: CarData
}

export default function BookingDetail() {
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id
  const isMobile = useMediaQuery("(max-width: 768px)")

  const [booking, setBooking] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isFixingCarStatus, setIsFixingCarStatus] = useState(false)

  // ดึงข้อมูลผู้ใช้
  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await fetch("/api/auth/me")
        if (!response.ok) {
          throw new Error("Failed to fetch user data")
        }
        const userData = await response.json()
        setUser(userData)
      } catch (error) {
        console.error("Error fetching user data:", error)
        router.push("/login")
      }
    }

    fetchUserData()
  }, [router])

  // ดึงข้อมูลการจอง
  useEffect(() => {
    async function fetchBookingData() {
      try {
        setLoading(true)
        const response = await fetch(`/api/bookings/${bookingId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch booking data")
        }
        const data = await response.json()
        setBooking(data)
      } catch (error) {
        console.error("Error fetching booking data:", error)
        setError("ไม่สามารถดึงข้อมูลการจองได้ กรุณาลองใหม่อีกครั้ง")
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) {
      fetchBookingData()
    }
  }, [bookingId])

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })
    } catch (error) {
      console.error("Error formatting date:", error, dateString)
      return dateString
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

  // ฟังก์ชันแก้ไขสถานะรถ
  const handleFixCarStatus = async () => {
    if (!booking || !booking.car) return

    setIsFixingCarStatus(true)

    try {
      // ส่งคำขอแก้ไขสถานะรถไปยัง API
      const response = await fetch(`/api/cars/${booking.car.id}/fix-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fix car status")
      }

      const result = await response.json()
      console.log("Fix car status result:", result)

      // แสดงข้อความสำเร็จ
      toast({
        title: "แก้ไขสถานะรถสำเร็จ",
        description: `สถานะรถถูกอัปเดตเป็น "${result.status}" เรียบร้อยแล้ว`,
        variant: "default",
      })

      // อัปเดตสถานะรถในหน้าปัจจุบัน
      if (booking.car) {
        setBooking({
          ...booking,
          car: {
            ...booking.car,
            status: result.status,
          },
        })
      }
    } catch (error: any) {
      console.error("Error fixing car status:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถแก้ไขสถานะรถได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsFixingCarStatus(false)
    }
  }

  // ฟังก์ชันยกเลิกการจอง
  const handleCancelBooking = async () => {
    if (!booking) return

    setIsCancelling(true)

    try {
      // ส่งคำขอยกเลิกการจองไปยัง API
      const response = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: "POST",
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

      // แก้ไขสถานะรถเป็น "ว่าง" ทันที
      if (booking.car) {
        try {
          const carResponse = await fetch(`/api/cars/${booking.car.id}/update-status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "ว่าง" }),
          })

          if (!carResponse.ok) {
            console.error("Failed to update car status, but booking was cancelled")
          } else {
            console.log("Car status updated to 'ว่าง'")
          }
        } catch (carError) {
          console.error("Error updating car status:", carError)
        }
      }

      // แสดงข้อความสำเร็จ
      toast({
        title: "ยกเลิกการจองสำเร็จ",
        description: "คำขอจองของคุณถูกยกเลิกเรียบร้อยแล้ว",
        variant: "default",
      })

      // อัปเดตสถานะการจองในหน้าปัจจุบัน
      setBooking({
        ...booking,
        status: "ยกเลิก",
      })

      // นำทางกลับไปยังหน้า dashboard หลังจาก 2 วินาที
      setTimeout(() => {
        router.push("/user/dashboard")
      }, 2000)
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

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 pt-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/user/dashboard")} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">กลับ</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">รายละเอียดการจอง</h1>
            <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="max-w-3xl mx-auto p-4 pt-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/user/dashboard")} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">กลับ</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">รายละเอียดการจอง</h1>
            <p className="text-muted-foreground">ไม่พบข้อมูลการจอง</p>
          </div>
        </div>
        <div className="py-10 text-center bg-white rounded-lg shadow">
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-muted-foreground">{error || "ไม่พบข้อมูลการจอง"}</p>
            <Button variant="outline" onClick={() => router.push("/user/dashboard")}>
              กลับไปยังหน้าหลัก
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4 pt-6 pb-20">
      <Toaster />
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/user/dashboard")} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">กลับ</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">รายละเอียดการจอง</h1>
          <p className="text-muted-foreground">ดูข้อมูลการจองรถของคุณ</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* ส่วนแสดงสถานะการจอง */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>สถานะการจอง</CardTitle>
              <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-secondary">
                <img
                  src={user?.avatar || "/placeholder.svg?height=40&width=40"}
                  alt={user?.name || "User"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=40&width=40"
                  }}
                />
              </div>
              <div>
                <div className="font-medium">{user?.name}</div>
                <div className="text-sm text-muted-foreground">{user?.department}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">วันที่จอง</p>
                  <p>
                    {formatDate(booking.startDate)}
                    {booking.startDate !== booking.endDate && <> - {formatDate(booking.endDate)}</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">เวลา</p>
                  <p>
                    {booking.startTime} - {booking.endTime} น.
                  </p>
                </div>
              </div>
              {booking.destination && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">สถานที่ปลายทาง</p>
                    <p>{booking.destination}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">วัตถุประสงค์</p>
                  <p>{booking.purpose}</p>
                </div>
              </div>
            </div>

            {booking.status === "รออนุมัติ" && (
              <div className="mt-6">
                <Button variant="destructive" className="w-full" onClick={() => setIsCancelDialogOpen(true)}>
                  ยกเลิกการจอง
                </Button>
              </div>
            )}

            {booking.status === "ปฏิเสธ" && booking.notes && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md">
                <p className="font-medium">เหตุผลที่ปฏิเสธ:</p>
                <p>{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ส่วนแสดงข้อมูลรถ */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>ข้อมูลรถ</CardTitle>
              {booking.car && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFixCarStatus}
                  disabled={isFixingCarStatus}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isFixingCarStatus ? "animate-spin" : ""}`} />
                  <span>แก้ไขสถานะรถ</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {booking.car ? (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-24 h-16 rounded-md overflow-hidden bg-muted">
                    <img
                      src={booking.car.image || "/placeholder.svg?height=64&width=96"}
                      alt={booking.car.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=64&width=96"
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">{booking.car.name}</h3>
                    <p className="text-sm text-muted-foreground">{booking.car.type}</p>
                    <p className="text-sm text-muted-foreground">ทะเบียน: {booking.car.licensePlate}</p>
                    <p className="text-sm mt-1">
                      สถานะปัจจุบัน:{" "}
                      <Badge variant={booking.car.status === "ว่าง" ? "default" : "secondary"}>
                        {booking.car.status}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">ไม่พบข้อมูลรถ</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Booking Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการยกเลิกการจอง</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองรถคันนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
              {booking && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <div className="font-medium">{booking.car?.name || "รถที่จอง"}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {booking.startTime} - {booking.endTime} น.
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
