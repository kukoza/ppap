"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Car, ChevronLeft, User, MapPin, Check, X, Loader2 } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-mobile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
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
    email: string
    phone: string
    avatar?: string
  }
  car: {
    name: string
    type: string
    licensePlate: string
  }
}

export default function BookingDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [booking, setBooking] = useState<Booking | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ดึงข้อมูลการจอง
  useEffect(() => {
    async function fetchBookingDetails() {
      try {
        setLoading(true)
        const response = await fetch(`/api/bookings/${params.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch booking details")
        }

        const data = await response.json()
        setBooking(data)
      } catch (err) {
        console.error("Error loading booking details:", err)
        setError("ไม่สามารถโหลดข้อมูลการจองได้ กรุณาลองใหม่อีกครั้ง")
      } finally {
        setLoading(false)
      }
    }

    fetchBookingDetails()
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

  const handleApprove = async () => {
    if (!booking) return

    setIsSubmitting(true)

    try {
      // ดึงข้อมูลผู้ใช้ปัจจุบัน (ผู้ดูแลระบบ)
      const userResponse = await fetch("/api/auth/me")
      if (!userResponse.ok) {
        throw new Error("Failed to fetch user data")
      }
      const userData = await userResponse.json()

      // ส่งคำขออนุมัติไปยัง API
      const response = await fetch(`/api/bookings/${booking.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approvedBy: userData.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to approve booking")
      }

      toast({
        title: "อนุมัติการจองสำเร็จ",
        description: "การจองได้รับการอนุมัติเรียบร้อยแล้ว",
      })

      // อัปเดตสถานะการจองในหน้าจอ
      setBooking({
        ...booking,
        status: "อนุมัติแล้ว",
      })
    } catch (error: any) {
      console.error("Error approving booking:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถอนุมัติการจองได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!booking) return

    if (!rejectReason.trim()) {
      toast({
        title: "กรุณาระบุเหตุผล",
        description: "กรุณาระบุเหตุผลในการปฏิเสธการจอง",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // ส่งคำขอปฏิเสธไปยัง API
      const response = await fetch(`/api/bookings/${booking.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: rejectReason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to reject booking")
      }

      toast({
        title: "ปฏิเสธการจองสำเร็จ",
        description: "การจองได้รับการปฏิเสธเรียบร้อยแล้ว",
      })

      // อัปเดตสถานะการจองในหน้าจอ
      setBooking({
        ...booking,
        status: "ปฏิเสธ",
      })

      // ซ่อนฟอร์มปฏิเสธ
      setShowRejectForm(false)
    } catch (error: any) {
      console.error("Error rejecting booking:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถปฏิเสธการจองได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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

  if (error || !booking) {
    return (
      <div className="p-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/bookings")} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">กลับ</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">ไม่พบข้อมูลการจอง</h1>
            <p className="text-muted-foreground">{error || "ไม่พบข้อมูลการจองที่ต้องการ"}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-20 max-w-5xl mx-auto">
      <Toaster />
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/bookings")} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">กลับ</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">รายละเอียดการจอง</h1>
          <p className="text-muted-foreground">ID: {params.id}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <Badge
          variant={booking.status === "อนุมัติแล้ว" ? "default" : booking.status === "รออนุมัติ" ? "outline" : "destructive"}
          className="text-sm px-3 py-1"
        >
          {booking.status}
        </Badge>
        <p className="text-sm text-muted-foreground">สร้างเมื่อ: {formatDateTime(booking.createdAt)}</p>
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
                <AvatarImage
                  src={booking.user.avatar || "/placeholder.svg?height=48&width=48"}
                  alt={booking.user.name}
                />
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
                <Calendar className="h-4 w-4 text-muted-foreground" />
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

        {/* การดำเนินการ */}
        {booking.status === "รออนุมัติ" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">การดำเนินการ</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {!showRejectForm ? (
                <div className="flex flex-col gap-3">
                  <Button
                    className="h-12 text-base flex items-center gap-2"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                  >
                    <Check className="h-5 w-5" />
                    {isSubmitting ? "กำลังดำเนินการ..." : "อนุมัติคำขอ"}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 text-base flex items-center gap-2"
                    onClick={() => setShowRejectForm(true)}
                  >
                    <X className="h-5 w-5" />
                    ปฏิเสธคำขอ
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rejectReason">เหตุผลในการปฏิเสธ</Label>
                    <Textarea
                      id="rejectReason"
                      placeholder="ระบุเหตุผลในการปฏิเสธคำขอจองรถนี้"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="destructive"
                      className="h-12 text-base"
                      onClick={handleReject}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "กำลังดำเนินการ..." : "ยืนยันการปฏิเสธ"}
                    </Button>
                    <Button variant="outline" className="h-12 text-base" onClick={() => setShowRejectForm(false)}>
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
