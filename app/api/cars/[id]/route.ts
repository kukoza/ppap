import { executeQuerySingle } from "@/lib/db"
import { NextResponse } from "next/server"
import path from "path"
import { existsSync } from "fs"
import fs from "fs/promises"

// กำหนดโฟลเดอร์สำหรับเก็บรูปภาพ
const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/cars")

// GET: ดึงข้อมูลรถตาม ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const carId = params.id

    const car = await executeQuerySingle(
      `
      SELECT id, name, type, licensePlate, status, initialMileage, currentMileage, 
             lastService, nextService, image, fileName, createdAt
      FROM Cars
      WHERE id = ?
      `,
      [carId],
    )

    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 })
    }

    return NextResponse.json(car)
  } catch (error) {
    console.error("Error fetching car:", error)
    return NextResponse.json({ error: "Failed to fetch car" }, { status: 500 })
  }
}

// PUT: อัปเดตข้อมูลรถ
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const carId = params.id
    const { name, type, licensePlate, status, currentMileage, image, fileName, oldFileName } = await request.json()

    console.log(
      "Updating car:",
      carId,
      "with image:",
      image ? "Image provided" : "No image",
      "fileName:",
      fileName,
      "oldFileName:",
      oldFileName,
    )

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !type || !licensePlate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // ตรวจสอบว่ารถมีอยู่จริงหรือไม่
    const existingCar = await executeQuerySingle(`SELECT id, image, fileName FROM Cars WHERE id = ?`, [carId])

    if (!existingCar) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 })
    }

    // ตรวจสอบว่าทะเบียนรถซ้ำหรือไม่ (ยกเว้นรถคันนี้)
    const duplicatePlate = await executeQuerySingle(`SELECT id FROM Cars WHERE licensePlate = ? AND id != ?`, [
      licensePlate,
      carId,
    ])

    if (duplicatePlate) {
      return NextResponse.json({ error: "License plate already exists on another car" }, { status: 409 })
    }

    // ลบรูปภาพเก่าถ้ามีการเปลี่ยนรูปภาพ
    let oldImageDeleted = false
    if (existingCar.fileName && (fileName !== existingCar.fileName || !fileName)) {
      // มีการเปลี่ยนรูปภาพหรือลบรูปภาพ
      const oldFilePath = path.join(UPLOAD_DIR, existingCar.fileName)
      console.log("Checking for old image to delete:", oldFilePath)

      if (existsSync(oldFilePath)) {
        try {
          await fs.unlink(oldFilePath)
          console.log("Successfully deleted old image file:", oldFilePath)
          oldImageDeleted = true
        } catch (deleteError) {
          console.error("Error deleting old image file:", deleteError)
        }
      } else {
        console.log("Old image file not found:", oldFilePath)
      }
    }

    // อัปเดตข้อมูลรถ
    await executeQuerySingle(
      `
      UPDATE Cars
      SET name = ?, type = ?, licensePlate = ?, status = ?, currentMileage = ?, image = ?, fileName = ?
      WHERE id = ?
      `,
      [name, type, licensePlate, status, currentMileage, image, fileName, carId],
    )

    return NextResponse.json({
      id: Number.parseInt(carId),
      name,
      type,
      licensePlate,
      status,
      currentMileage,
      image,
      fileName,
      oldImageDeleted,
    })
  } catch (error) {
    console.error("Error updating car:", error)
    return NextResponse.json({ error: "Failed to update car" }, { status: 500 })
  }
}

// DELETE: ลบรถ
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const carId = params.id

    // ตรวจสอบว่ารถมีอยู่จริงหรือไม่และดึงชื่อไฟล์รูปภาพ
    const existingCar = await executeQuerySingle(`SELECT id, image, fileName FROM Cars WHERE id = ?`, [carId])

    if (!existingCar) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 })
    }

    // ลบรถจากฐานข้อมูล
    await executeQuerySingle(`DELETE FROM Cars WHERE id = ?`, [carId])

    // ลบไฟล์รูปภาพถ้ามี
    if (existingCar.fileName) {
      const filePath = path.join(UPLOAD_DIR, existingCar.fileName)
      console.log("Attempting to delete image file:", filePath)

      if (existsSync(filePath)) {
        try {
          await fs.unlink(filePath)
          console.log("Successfully deleted image file:", filePath)
        } catch (deleteError) {
          console.error("Error deleting image file:", deleteError)
          // ไม่ต้อง return error เพราะการลบไฟล์ไม่ใช่ขั้นตอนสำคัญ
        }
      } else {
        console.log("Image file not found:", filePath)
      }
    } else {
      console.log("No fileName found for car:", carId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting car:", error)
    return NextResponse.json({ error: "Failed to delete car" }, { status: 500 })
  }
}
