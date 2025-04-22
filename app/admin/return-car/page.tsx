"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Car, Search, Check, AlertCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useMediaQuery } from "@/hooks/use-mobile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

// ประเภทข้อมูลสำหรับการจองที่กำลังใช้งาน
interface ActiveBooking {
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
  startMileage: number
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
    currentMileage: number
  }
}

export default function ReturnCar() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<ActiveBooking | null>(null)
  const [endMileage, setEndMileage] = useState("")
  const [notes, setNotes] = useState("")
  const [fuelLevel, setFuelLevel] = useState("เต็มถัง")
  const [fuelCost, setFuelCost] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // ดึงข้อมูลการจองที่กำลังใช้งาน
  useEffect(() => {
    async function fetchActiveBookings() {
      try {
        setLoading(true)
        const response = await fetch("/api/bookings/active")

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch active bookings")
        }

        const data = await response.json()
        setActiveBookings(data)
        setFetchError(null)
      } catch (err) {
        console.error("Error loading active bookings:", err)
        setFetchError("ไม่สามารถโหลดข้อมูลการจองที่กำลังใช้งานได้ กรุณาลองใหม่อีกครั้ง")
        setActiveBookings([]) // เพิ่มบรรทัดนี้เพื่อให้แน่ใจว่า activeBookings เป็นอาร์เรย์ว่าง
      } finally {
        setLoading(false)
      }
    }

    fetchActiveBookings()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })
  }

  // กรองการจองตามคำค้นหา
  const filteredBookings = activeBookings.filter((booking) => {
    return (
      booking.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.car.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleOpenReturnDialog = (booking: ActiveBooking) => {
    setSelectedBooking(booking)
    setEndMileage("")
    setNotes("")
    setFuelLevel("เต็มถัง")
    setFuelCost("")
    setError("")
    setIsReturnDialogOpen(true)
  }

  const handleReturnCar = async () => {
    // ตรวจสอบว่าเลขไมล์ถูกต้อง
    if (!endMileage) {
      setError("กรุณาระบุเลขไมล์หลังใช้งาน")
      return
    }

    const endMileageNum = Number.parseInt(endMileage)
    if (isNaN(endMileageNum)) {
      setError("เลขไมล์ต้องเป็นตัวเลขเท่านั้น")
      return
    }

    if (!selectedBooking) return

    if (endMileageNum <= selectedBooking.startMileage) {
      setError("เลขไมล์หลังใช้งานต้องมากกว่าเลขไมล์ก่อนใช้งาน")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      console.log("Sending return car data:", {
        bookingId: selectedBooking.id,
        endMileage: endMileageNum,
        notes,
        fuelLevel,
        fuelCost,
      })

      // ส่งข้อมูลการคืนรถไปยัง API
      const response = await fetch(`/api/bookings/${selectedBooking.id}/return`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endMileage: endMileageNum,
          notes,
          fuelLevel,
          fuelCost: fuelCost ? fuelCost : null,
        }),
      })

      const responseData = await response.json()
      console.log("Return car response:", responseData)

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to return car")
      }

      // ลบการจองที่คืนรถแล้วออกจากรายการ
      setActiveBookings(activeBookings.filter((booking) => booking.id !== selectedBooking.id))

      setIsReturnDialogOpen(false)

      toast({
        title: "บันทึกการคืนรถสำเร็จ",
        description: "บันทึกข้อมูลการคืนรถเรียบร้อยแล้ว",
      })
    } catch (error: any) {
      console.error("Error returning car:", error)
      setError(error.message || "ไม่สามารถบันทึกการคืนรถได้ กรุณาลองใหม่อีกครั้ง")
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกการคืนรถได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-4 pt-6 max-w-5xl mx-auto">
      <Toaster />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">รับคืนรถ</h1>
        <p className="text-muted-foreground">บันทึกการคืนรถและเลขไมล์หลังใช้งาน</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ค้นหาการจอง, ชื่อผู้ใช้, ทะเบียนรถ..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      ) : fetchError ? (
        <Card>
          <CardContent className="py-10 text-center">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-destructive">{fetchError}</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                ลองใหม่อีกครั้ง
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
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
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">กำลังใช้งาน</Badge>
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

                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        เลขไมล์เริ่มต้น: <span className="font-medium">{booking.startMileage.toLocaleString()} กม.</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button className="w-full md:w-auto" onClick={() => handleOpenReturnDialog(booking)}>
                      <Check className="mr-2 h-4 w-4" />
                      บันทึกการคืนรถ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-muted-foreground flex flex-col items-center gap-2">
                  <AlertCircle className="h-8 w-8" />
                  ไม่พบรถที่อยู่ระหว่างการใช้งาน
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">ไม่มีรถที่ต้องรับคืนในขณะนี้</CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dialog สำหรับบันทึกการคืนรถ */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>บันทึกการคืนรถ</DialogTitle>
            <DialogDescription>กรุณาระบุเลขไมล์หลังใช้งานและบันทึกหมายเหตุ (ถ้ามี)</DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <div className="font-medium">{selectedBooking.car.name}</div>
                <div className="text-sm text-muted-foreground">ทะเบียน: {selectedBooking.car.licensePlate}</div>
                <div className="text-sm text-muted-foreground">
                  ผู้ใช้งาน: {selectedBooking.user.name} ({selectedBooking.user.department})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>เลขไมล์ก่อนใช้งาน</Label>
                  <Input value={selectedBooking.startMileage.toLocaleString()} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endMileage">
                    เลขไมล์หลังใช้งาน <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endMileage"
                    placeholder="ระบุเลขไมล์"
                    value={endMileage}
                    onChange={(e) => setEndMileage(e.target.value)}
                    className={error ? "border-destructive" : ""}
                  />
                </div>
              </div>

              {error && <div className="text-sm text-destructive">{error}</div>}

              {endMileage &&
                !isNaN(Number.parseInt(endMileage)) &&
                Number.parseInt(endMileage) > selectedBooking.startMileage && (
                  <div className="text-sm">
                    ระยะทางที่ใช้:{" "}
                    <span className="font-medium">
                      {(Number.parseInt(endMileage) - selectedBooking.startMileage).toLocaleString()} กม.
                    </span>
                  </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="fuelLevel">ระดับน้ำมันเมื่อคืนรถ</Label>
                <select
                  id="fuelLevel"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={fuelLevel}
                  onChange={(e) => setFuelLevel(e.target.value)}
                >
                  <option value="เต็มถัง">เต็มถัง</option>
                  <option value="3/4">3/4 ถัง</option>
                  <option value="1/2">1/2 ถัง</option>
                  <option value="1/4">1/4 ถัง</option>
                  <option value="ใกล้หมด">ใกล้หมด</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelCost">ค่าน้ำมัน (บาท)</Label>
                <Input
                  id="fuelCost"
                  placeholder="ระบุค่าน้ำมัน (ถ้ามี)"
                  value={fuelCost}
                  onChange={(e) => setFuelCost(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Textarea
                  id="notes"
                  placeholder="บันทึกสภาพรถหรือหมายเหตุอื่นๆ (ถ้ามี)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button onClick={handleReturnCar} disabled={isSubmitting}>
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกการคืนรถ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
