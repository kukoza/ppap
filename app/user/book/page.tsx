"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Car, ChevronLeft, Info, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-mobile"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Input } from "@/components/ui/input"

// ประเภทข้อมูลสำหรับรถ
interface CarType {
  id: number
  name: string
  type: string
  licensePlate: string
  status: string
  initialMileage: number
  currentMileage: number
  image?: string
}

// ประเภทข้อมูลสำหรับผู้ใช้
interface UserType {
  id: number
  name: string
  email: string
  department: string
  role: string
}

// ประเภทข้อมูลสำหรับประเภทรถ
interface CarTypeData {
  id: number
  name: string
  description: string
  capacity: number
}

export default function BookCar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useMediaQuery("(max-width: 768px)")

  const [selectedCar, setSelectedCar] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [purpose, setPurpose] = useState("")
  const [destination, setDestination] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [availableCars, setAvailableCars] = useState<CarType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserType | null>(null)
  const [carTypes, setCarTypes] = useState<CarTypeData[]>([])
  const [loadingCarTypes, setLoadingCarTypes] = useState(true)

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

  // ดึงข้อมูลประเภทรถ
  useEffect(() => {
    async function fetchCarTypes() {
      try {
        setLoadingCarTypes(true)
        const response = await fetch("/api/car-types")
        if (!response.ok) {
          throw new Error("Failed to fetch car types")
        }
        const data = await response.json()
        setCarTypes(data)
      } catch (err) {
        console.error("Error loading car types:", err)
        // ใช้ค่าเริ่มต้นหากไม่สามารถดึงข้อมูลได้
        setCarTypes([])
      } finally {
        setLoadingCarTypes(false)
      }
    }

    fetchCarTypes()
  }, [])

  // ดึงข้อมูลรถที่ว่าง
  useEffect(() => {
    async function fetchAvailableCars() {
      try {
        setLoading(true)
        const response = await fetch("/api/cars?status=ว่าง")
        if (!response.ok) {
          throw new Error("Failed to fetch available cars")
        }
        const data = await response.json()
        setAvailableCars(data)
      } catch (err) {
        console.error("Error loading cars:", err)
        setError("ไม่สามารถโหลดข้อมูลรถได้ กรุณาลองใหม่อีกครั้ง")
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableCars()
  }, [])

  // ดึงค่า car ID จาก URL query parameter (ถ้ามี)
  useEffect(() => {
    const carId = searchParams.get("car")
    if (carId) {
      setSelectedCar(carId)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!selectedCar || !startDate || !endDate || !startTime || !endTime || !purpose) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({
        title: "ไม่พบข้อมูลผู้ใช้",
        description: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    setIsSubmitting(true)

    try {
      // สร้างข้อมูลการจอง
      const bookingData = {
        userId: user.id,
        carId: Number.parseInt(selectedCar),
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        startTime,
        endTime,
        purpose,
        destination: destination || null,
      }

      // ส่งข้อมูลไปบันทึกในฐานข้อมูล
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create booking")
      }

      const responseData = await response.json()

      // ดึงข้อมูลรถที่เลือก
      const selectedCarDetails = availableCars.find((car) => car.id.toString() === selectedCar)

      // สร้างข้อมูลการจองเพื่อแสดงในหน้า dashboard
      const newBookingForDisplay = {
        id: responseData.id,
        car: selectedCarDetails?.name || "รถที่เลือก",
        carType: selectedCarDetails?.type || "ประเภทรถ",
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        startTime,
        endTime,
        purpose,
        status: "รออนุมัติ",
      }

      // บันทึกข้อมูลการจองใหม่ลงใน localStorage เพื่อแสดงในหน้า dashboard
      localStorage.setItem("newBooking", JSON.stringify(newBookingForDisplay))

      // แสดงข้อความสำเร็จ
      toast({
        title: "ส่งคำขอจองสำเร็จ",
        description: "คำขอจองของคุณถูกส่งไปยังผู้ดูแลระบบเพื่อรออนุมัติ",
      })

      // นำทางกลับไปยังหน้า dashboard และเลือกแท็บ "การจองของฉัน"
      router.push("/user/dashboard")
    } catch (error: any) {
      console.error("Error creating booking:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถสร้างการจองได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // กรองรถตามประเภท
  const filteredCars =
    activeTab === "all"
      ? availableCars
      : availableCars.filter((car) => {
          // ใช้ activeTab เป็น ID ของประเภทรถหรือชื่อประเภทรถ
          return car.type === activeTab || car.type === getCarTypeName(activeTab)
        })

  // ฟังก์ชันสำหรับแปลง ID เป็นชื่อประเภทรถ
  function getCarTypeName(typeId: string): string {
    const carType = carTypes.find((type) => type.id.toString() === typeId)
    return carType ? carType.name : ""
  }

  // ดึงข้อมูลรถที่เลือก
  const selectedCarDetails = availableCars.find((car) => car.id.toString() === selectedCar)

  // ใช้รถทั้งหมดในโหมด desktop
  const carsToDisplay = isMobile ? filteredCars : availableCars

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 pb-20 pt-6">
      <Toaster />
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/user/dashboard")} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">กลับ</span>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">จองรถ</h1>
          <p className="text-muted-foreground">จองรถของบริษัทสำหรับความต้องการทางธุรกิจของคุณ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* ส่วนเลือกรถ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">เลือกรถ</CardTitle>
              <CardDescription>เลือกรถที่ตรงกับความต้องการของคุณ</CardDescription>
            </CardHeader>
            <CardContent>
              {loading || loadingCarTypes ? (
                <div className="text-center py-4">กำลังโหลดข้อมูล...</div>
              ) : error ? (
                <div className="text-center py-4 text-destructive">{error}</div>
              ) : (
                <>
                  {isMobile ? (
                    <>
                      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full mb-4">
                        <TabsList
                          className="w-full grid"
                          style={{ gridTemplateColumns: `repeat(${carTypes.length + 1}, 1fr)` }}
                        >
                          <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
                          {carTypes.map((type) => (
                            <TabsTrigger key={type.id} value={type.name}>
                              {type.name}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>

                      <div className="space-y-4">
                        {filteredCars.length > 0 ? (
                          filteredCars.map((car) => (
                            <div
                              key={car.id}
                              className={`border rounded-lg p-3 flex gap-3 cursor-pointer transition-colors ${
                                selectedCar === car.id.toString() ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                              }`}
                              onClick={() => setSelectedCar(car.id.toString())}
                            >
                              <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                                <img
                                  src={car.image || "/placeholder.svg?height=80&width=80"}
                                  alt={car.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=80&width=80"
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium">{car.name}</h3>
                                <p className="text-sm text-muted-foreground">{car.type}</p>
                                <p className="text-sm text-muted-foreground">ทะเบียน: {car.licensePlate}</p>
                              </div>
                              <div className="flex items-center">
                                <div
                                  className={`w-5 h-5 rounded-full border-2 ${
                                    selectedCar === car.id.toString()
                                      ? "border-primary bg-primary"
                                      : "border-muted-foreground"
                                  }`}
                                ></div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">ไม่พบรถที่ว่างในขณะนี้</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="car">เลือกรถ</Label>
                      <Select value={selectedCar} onValueChange={setSelectedCar} required>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกรถ" />
                        </SelectTrigger>
                        <SelectContent>
                          {carsToDisplay.length > 0 ? (
                            carsToDisplay.map((car) => (
                              <SelectItem key={car.id} value={car.id.toString()}>
                                {car.name} ({car.type}) - {car.licensePlate}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-cars" disabled>
                              ไม่พบรถที่ว่างในขณะนี้
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>

                      {selectedCarDetails && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg flex gap-3">
                          <div className="w-24 h-16 rounded-md overflow-hidden flex-shrink-0">
                            <img
                              src={selectedCarDetails.image || "/placeholder.svg?height=64&width=96"}
                              alt={selectedCarDetails.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=64&width=96"
                              }}
                            />
                          </div>
                          <div>
                            <h3 className="font-medium">{selectedCarDetails.name}</h3>
                            <p className="text-sm text-muted-foreground">{selectedCarDetails.type}</p>
                            <p className="text-sm text-muted-foreground">ทะเบียน: {selectedCarDetails.licensePlate}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ส่วนเลือกวันที่ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">เลือกวันที่</CardTitle>
              <CardDescription>ระบุวันที่เริ่มต้นและสิ้นสุดการจอง</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-2 gap-4"}`}>
                <div className="space-y-2">
                  <Label>วันที่เริ่มต้น</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "เลือกวันที่"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        disabled={(date) => {
                          // ตรวจสอบเฉพาะวันที่ในอดีตโดยเปรียบเทียบเฉพาะวัน เดือน ปี (ไม่รวมเวลา)
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          date.setHours(0, 0, 0, 0)
                          return date < today
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>วันที่สิ้นสุด</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "เลือกวันที่"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={(date) => {
                          // ตรวจสอบเฉพาะวันที่ในอดีตโดยเปรียบเทียบเฉพาะวัน เดือน ปี (ไม่รวมเวลา)
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          date.setHours(0, 0, 0, 0)
                          return (
                            date < today ||
                            (startDate ? date.setHours(0, 0, 0, 0) < startDate.setHours(0, 0, 0, 0) : false)
                          )
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* ส่วนเลือกเวลา */}
              <div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-2 gap-4"} mt-4`}>
                <div className="space-y-2">
                  <Label>เวลาเริ่มต้น (รูปแบบ 24 ชม.)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startTime && "text-muted-foreground",
                        )}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {startTime ? startTime : "เลือกเวลา"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3">
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">ชั่วโมง</Label>
                              <Select
                                value={startTime.split(":")[0] || ""}
                                onValueChange={(value) => {
                                  const minutes = startTime.split(":")[1] || "00"
                                  setStartTime(`${value}:${minutes}`)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="ชั่วโมง" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }).map((_, i) => (
                                    <SelectItem key={i} value={i.toString().padStart(2, "0")}>
                                      {i.toString().padStart(2, "0")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">นาที</Label>
                              <Select
                                value={startTime.split(":")[1] || ""}
                                onValueChange={(value) => {
                                  const hours = startTime.split(":")[0] || "00"
                                  setStartTime(`${hours}:${value}`)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="นาที" />
                                </SelectTrigger>
                                <SelectContent>
                                  {["00", "15", "30", "45"].map((minute) => (
                                    <SelectItem key={minute} value={minute}>
                                      {minute}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>เวลาสิ้นสุด (รูปแบบ 24 ชม.)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endTime && "text-muted-foreground",
                        )}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {endTime ? endTime : "เลือกเวลา"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3">
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">ชั่วโมง</Label>
                              <Select
                                value={endTime.split(":")[0] || ""}
                                onValueChange={(value) => {
                                  const minutes = endTime.split(":")[1] || "00"
                                  setEndTime(`${value}:${minutes}`)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="ชั่วโมง" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }).map((_, i) => (
                                    <SelectItem key={i} value={i.toString().padStart(2, "0")}>
                                      {i.toString().padStart(2, "0")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">นาที</Label>
                              <Select
                                value={endTime.split(":")[1] || ""}
                                onValueChange={(value) => {
                                  const hours = endTime.split(":")[0] || "00"
                                  setEndTime(`${hours}:${value}`)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="นาที" />
                                </SelectTrigger>
                                <SelectContent>
                                  {["00", "15", "30", "45"].map((minute) => (
                                    <SelectItem key={minute} value={minute}>
                                      {minute}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ส่วนวัตถุประสงค์ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">วัตถุประสงค์การจอง</CardTitle>
              <CardDescription>อธิบายเหตุผลที่คุณต้องการใช้รถ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="purpose">วัตถุประสงค์</Label>
                  <Textarea
                    id="purpose"
                    placeholder="อธิบายสั้นๆ ว่าทำไมคุณต้องการใช้รถ"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    required
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">สถานที่ปลายทาง</Label>
                  <Input
                    id="destination"
                    placeholder="ระบุสถานที่ปลายทาง (ถ้ามี)"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* แนวทางการจองรถ */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="guidelines">
              <AccordionTrigger className="text-base font-medium">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  แนวทางการจองรถ
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 py-2">
                  <div className="flex items-start gap-2">
                    <Car className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">สามารถจองรถภายในวันได้</p>
                      <p className="text-sm text-muted-foreground">คุณสามารถจองรถและใช้งานได้ทันทีในวันเดียวกัน</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Car className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">กระบวนการอนุมัติ</p>
                      <p className="text-sm text-muted-foreground">การจองทั้งหมดต้องได้รับการอนุมัติจากผู้จัดการแผนกของคุณ</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Car className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">นโยบายการคืนรถ</p>
                      <p className="text-sm text-muted-foreground">กรุณาคืนรถพร้อมน้ำมันเต็มถังและในสภาพที่สะอาด</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* ปุ่มส่งคำขอ */}
          <div className={`${isMobile ? "fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-10" : ""}`}>
            <div className="flex gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push("/user/dashboard")}
                className={isMobile ? "flex-1" : ""}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={!selectedCar || !startDate || !endDate || !startTime || !endTime || !purpose || isSubmitting}
                className={isMobile ? "flex-1" : ""}
              >
                {isSubmitting ? "กำลังส่งคำขอ..." : "ส่งคำขอจอง"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
