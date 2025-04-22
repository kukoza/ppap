"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"

export default function FixCarStatus() {
  const [isFixing, setIsFixing] = useState(false)

  const handleFixCarStatus = async () => {
    try {
      setIsFixing(true)
      const response = await fetch("/api/cars/fix-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fix car status")
      }

      const result = await response.json()
      console.log("Fix car status result:", result)

      toast({
        title: "แก้ไขสถานะรถสำเร็จ",
        description: result.message || `อัปเดตสถานะรถเรียบร้อยแล้ว ${result.updatedCars || 0} คัน`,
        variant: "default",
      })

      // รีโหลดหน้าเพื่อแสดงข้อมูลล่าสุด
      window.location.reload()
    } catch (error) {
      console.error("Error fixing car status:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขสถานะรถได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleFixCarStatus}
        disabled={isFixing}
        className="text-xs flex items-center gap-1"
      >
        <AlertCircle className="h-3 w-3" />
        {isFixing ? "กำลังแก้ไข..." : "แก้ไขสถานะรถ"}
      </Button>
      <p className="text-xs text-muted-foreground">หากพบปัญหาสถานะรถไม่ถูกต้อง กดปุ่มนี้เพื่อแก้ไข</p>
    </div>
  )
}
