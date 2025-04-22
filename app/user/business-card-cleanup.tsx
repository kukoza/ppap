"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function BusinessCardCleanup() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const { toast } = useToast()

  const handleCleanup = async () => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบข้อมูลนามบัตรทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
      setIsLoading(true)
      try {
        const response = await fetch("/api/db-cleanup/business-cards", {
          method: "POST",
        })

        if (response.ok) {
          toast({
            title: "สำเร็จ",
            description: "ลบข้อมูลนามบัตรเรียบร้อยแล้ว",
          })
        } else {
          const error = await response.json()
          toast({
            title: "เกิดข้อผิดพลาด",
            description: error.error || "ไม่สามารถลบข้อมูลนามบัตรได้",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error cleaning up business cards:", error)
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถลบข้อมูลนามบัตรได้",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleCleanupFiles = async () => {
    if (confirm("คุณแน่ใจหรือไม่ที่จะลบไฟล์นามบัตรทั้งหมดในเครื่อง? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
      setIsLoadingFiles(true)
      try {
        const response = await fetch("/api/db-cleanup/business-card-files", {
          method: "POST",
        })

        if (response.ok) {
          const data = await response.json()
          toast({
            title: "สำเร็จ",
            description: data.message,
          })
        } else {
          const error = await response.json()
          toast({
            title: "เกิดข้อผิดพลาด",
            description: error.error || "ไม่สามารถลบไฟล์นามบัตรได้",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error cleaning up business card files:", error)
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถลบไฟล์นามบัตรได้",
          variant: "destructive",
        })
      } finally {
        setIsLoadingFiles(false)
      }
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">ลบข้อมูลนามบัตร</h1>
        <p className="mb-6 text-gray-600">
          หน้านี้ใช้สำหรับลบข้อมูลนามบัตรทั้งหมด เพื่อเริ่มต้นใหม่ทั้งหมด
          <br />
          <strong className="text-red-600">คำเตือน:</strong> การกระทำนี้ไม่สามารถย้อนกลับได้
        </p>

        <div className="space-y-4">
          <div className="p-4 border border-gray-200 rounded-md">
            <h2 className="text-lg font-semibold mb-2">1. ลบข้อมูลนามบัตรในฐานข้อมูล</h2>
            <p className="mb-4 text-sm text-gray-600">ลบข้อมูลนามบัตรทั้งหมดในฐานข้อมูล</p>
            <Button onClick={handleCleanup} disabled={isLoading} variant="destructive" className="w-full sm:w-auto">
              {isLoading ? "กำลังลบข้อมูล..." : "ลบข้อมูลนามบัตรในฐานข้อมูล"}
            </Button>
          </div>

          <div className="p-4 border border-gray-200 rounded-md">
            <h2 className="text-lg font-semibold mb-2">2. ลบไฟล์นามบัตรในเครื่อง</h2>
            <p className="mb-4 text-sm text-gray-600">ลบไฟล์รูปภาพและไฟล์อื่นๆ ที่เกี่ยวข้องกับนามบัตรในเครื่อง</p>
            <Button
              onClick={handleCleanupFiles}
              disabled={isLoadingFiles}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              {isLoadingFiles ? "กำลังลบไฟล์..." : "ลบไฟล์นามบัตรในเครื่อง"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
