"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/input"
import { Label } from "@/components/label"
import { Textarea } from "@/components/textarea"

interface BusinessCard {
  id: number | null
  user_id: number
  name_th: string
  name_en: string
  position_th: string
  position_en: string
  department_th: string
  department_en: string
  company_th: string
  company_en: string
  branch: string
  address_th: string
  address_en: string
  branch_address_th: string
  branch_address_en: string
  tel: string
  company_tel: string
  fax: string
  email: string
  website: string
  line_id: string
  facebook: string
}

export default function EditBusinessCardPage() {
  const [businessCard, setBusinessCard] = useState<BusinessCard>({
    id: null,
    user_id: 0,
    name_th: "",
    name_en: "",
    position_th: "",
    position_en: "",
    department_th: "",
    department_en: "",
    company_th: "",
    company_en: "NOZOMI ENTERPRISE (THAILAND) CO., LTD.",
    branch: "Branch 1",
    address_th: "382 หมู่ 4 ตำบลคลองสวน",
    address_en: "382 M.4 Baanklongsuan,Phrasamutjede,Samutprakarn 10290 Thailand",
    branch_address_th: "168 หมู่ 2 ตำบลคลองสวน",
    branch_address_en: "168 M.2 Baanklongsuan,Phrasamutjede,Samutprakarn 10290 Thailand",
    tel: "",
    company_tel: "02-461-6291",
    fax: "02-461-6292",
    email: "",
    website: "",
    line_id: "",
    facebook: "",
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchBusinessCard = async () => {
      try {
        setLoading(true)
        setError(null)

        // สร้างตารางก่อนโดยตรง
        try {
          const createTableResponse = await fetch("/api/db-update/create-business-cards-table-direct")
          console.log("Table creation response:", await createTableResponse.json())
        } catch (err) {
          console.error("Error creating table:", err)
        }

        // เพิ่มคอลัมน์ branch และ company_tel
        try {
          const addColumnsResponse = await fetch("/api/db-update/add-branch-company-tel-columns")
          console.log("Add columns response:", await addColumnsResponse.json())
        } catch (err) {
          console.error("Error adding columns:", err)
        }

        // เพิ่มคอลัมน์ branch_address_th และ branch_address_en
        try {
          const addBranchAddressResponse = await fetch("/api/db-update/add-branch-address-columns")
          console.log("Add branch address columns response:", await addBranchAddressResponse.json())
        } catch (err) {
          console.error("Error adding branch address columns:", err)
        }

        // รอสักครู่เพื่อให้ตารางถูกสร้างเสร็จ
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const response = await fetch("/api/business-cards")
        console.log("API response status:", response.status)

        if (!response.ok) {
          const errorData = await response.json()
          console.error("API error:", errorData)
          throw new Error(errorData.error || "Failed to fetch business card")
        }

        const data = await response.json()
        console.log("Business card data:", data)

        // ถ้าข้อมูลที่ได้มาไม่มีฟิลด์ใหม่ ให้เพิ่มค่าเริ่มต้น
        if (!data.branch) data.branch = "Branch 1"
        if (!data.company_tel) data.company_tel = "02-461-6291"
        if (!data.branch_address_th) data.branch_address_th = "168 หมู่ 2 ตำบลคลองสวน"
        if (!data.address_en)
          data.address_en = "382 M.4 Baanklongsuan, Phrasamutjede,Samutprakarn 10290 Thailand"
        if (!data.branch_address_en)
          data.branch_address_en = "168 M.2 Baanklongsuan,Phrasamutjede,Samutprakarn 10290 Thailand"

        setBusinessCard(data)
      } catch (err) {
        console.error("Error loading business card:", err)
        setError("Failed to load business card. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinessCard()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBusinessCard((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/business-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(businessCard),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save business card")
      }

      router.push("/user/business-card")
    } catch (err) {
      console.error("Error saving business card:", err)
      setError("Failed to save business card. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleRetry = async () => {
    try {
      // สร้างตารางโดยตรงอีกครั้ง
      await fetch("/api/db-update/create-business-cards-table-direct")
      // รีเฟรชหน้า
      router.refresh()
    } catch (err) {
      console.error("Error retrying:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={handleRetry} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Edit Business Card</h2>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name_th">ชื่อ-นามสกุล (ไทย)</Label>
            <Input
              id="name_th"
              name="name_th"
              value={businessCard.name_th}
              onChange={handleChange}
              className="mt-1"
              placeholder="อธิจิต หงส์กิตติกุล"
            />
          </div>

          <div>
            <Label htmlFor="name_en">Name (English)</Label>
            <Input
              id="name_en"
              name="name_en"
              value={businessCard.name_en}
              onChange={handleChange}
              className="mt-1"
              placeholder="Athijit Hongkittikul"
            />
          </div>

          <div>
            <Label htmlFor="position_th">ตำแหน่ง (ไทย)</Label>
            <Input
              id="position_th"
              name="position_th"
              value={businessCard.position_th}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="position_en">Position (English)</Label>
            <Input
              id="position_en"
              name="position_en"
              value={businessCard.position_en}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="company_en">Company (English)</Label>
            <Input
              id="company_en"
              name="company_en"
              value={businessCard.company_en}
              onChange={handleChange}
              className="mt-1"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="address_en">Head Office Address (English)</Label>
            <Textarea
              id="address_en"
              name="address_en"
              value={businessCard.address_en}
              onChange={handleChange}
              className="mt-1"
              rows={2}
              placeholder="382 M.4 Baanklongsuan, Phrasamutjede,
              Samutprakarn 10290 Thailand"
            />   
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="branch_address_en">Branch Address (English)</Label>
            <Textarea
              id="branch_address_en"
              name="branch_address_en"
              value={businessCard.branch_address_en}
              onChange={handleChange}
              className="mt-1"
              rows={2}
              placeholder="168 M.2 Baanklongsuan, Phrasamutjede,
              Samutprakarn 10290 Thailand"
            />
          </div>

          <div>
            <Label htmlFor="tel">เบอร์โทรศัพท์มือถือ</Label>
            <Input
              id="tel"
              name="tel"
              value={businessCard.tel}
              onChange={handleChange}
              className="mt-1"
              placeholder="098-930-3139"
            />
          </div>

          <div>
            <Label htmlFor="company_tel">เบอร์โทรบริษัท</Label>
            <Input
              id="company_tel"
              name="company_tel"
              value={businessCard.company_tel}
              onChange={handleChange}
              className="mt-1"
              placeholder="02-461-6291"
            />
          </div>

          <div>
            <Label htmlFor="fax">แฟกซ์</Label>
            <Input
              id="fax"
              name="fax"
              value={businessCard.fax}
              onChange={handleChange}
              className="mt-1"
              placeholder="02-461-6292"
            />
          </div>

          <div>
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              name="email"
              value={businessCard.email}
              onChange={handleChange}
              className="mt-1"
              placeholder="gglike21@gmail.com"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push("/user/business-card")}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  )
}
