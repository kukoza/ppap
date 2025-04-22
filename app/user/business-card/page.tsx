"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import html2canvas from "html2canvas"
import { ImageIcon, FileDown, Map } from "lucide-react"
import QRCode from "qrcode.react"

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

// กำหนดขนาดมาตรฐานของนามบัตร (ขนาดเดียวกับ PC)
const CARD_WIDTH = 850
const CARD_HEIGHT = 500

export default function BusinessCardPage() {
  const [businessCard, setBusinessCard] = useState<BusinessCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string>("")
  const cardRef = useRef<HTMLDivElement>(null)
  const hiddenCardRef = useRef<HTMLDivElement>(null)
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
        if (!data.branch) data.branch = "สำนักงานใหญ่"
        if (!data.company_tel) data.company_tel = "02-461-6291"
        if (!data.branch_address_th) data.branch_address_th = "168 หมู่ 2 ตำบลคลองสวน"
        if (!data.branch_address_en)
          data.branch_address_en = "168 M.2 Baanklongsuan, Phrasamutjede, Samutprakarn 10290 Thailand"

        setBusinessCard(data)

        // สร้าง URL สำหรับแชร์
        if (data.id) {
          const baseUrl = window.location.origin
          setShareUrl(`${baseUrl}/share/business-card/${data.id}`)
        }
      } catch (err) {
        console.error("Error loading business card:", err)
        setError("Failed to load business card. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinessCard()
  }, [])

  const handleSaveImage = async () => {
    if (!hiddenCardRef.current) return

    try {
      // ใช้ hidden card ที่มีขนาดคงที่สำหรับการสร้างรูปภาพ
      const canvas = await html2canvas(hiddenCardRef.current, {
        scale: 2,
        backgroundColor: null,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        windowWidth: CARD_WIDTH,
        windowHeight: CARD_HEIGHT,
      })

      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = image
      link.download = "business-card.png"
      link.click()
    } catch (err) {
      console.error("Error generating image:", err)
      alert("Failed to download business card image. Please try again.")
    }
  }

  const handleSaveVCard = () => {
    if (!businessCard) return

    try {
      const vCardData = generateVCard(businessCard)
      const blob = new Blob([vCardData], { type: "text/vcard;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${businessCard.name_en.replace(/\s+/g, "_")}.vcf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error generating vCard:", err)
      alert("Failed to download vCard. Please try again.")
    }
  }

  const handleOpenGoogleMap = () => {
    // ใช้ลิงก์ Google Maps ที่กำหนดให้
    window.open("https://maps.app.goo.gl/Tf29bSF2sKxbS7NYA", "_blank")
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

  // สร้าง vCard สำหรับ QR Code และการดาวน์โหลด - ปรับปรุงให้แสดงข้อมูลครบถ้วน
  const generateVCard = (card: BusinessCard) => {
    // กำหนดที่อยู่ที่ต้องการแสดงใน vCard
    const companyAddress =
      "Nozomi Enterprise (Thailand) Co., Ltd.382 M.4, Baanklongsuan Rd., Phrasamutjedei,Samut Prakan, Thailand 10290"

    // สร้างรายการข้อมูลที่จะรวมใน vCard
    const vCardLines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      // ชื่อ-นามสกุล
      `N:${card.name_en}`,
      `FN:${card.name_en}`,
      // ชื่อบริษัทและตำแหน่ง
      `ORG:${card.company_en}${card.department_en ? `;${card.department_en}` : ""}`,
      `TITLE:${card.position_en}`,
      // เบอร์โทรศัพท์
      `TEL;TYPE=CELL:${card.tel}`,
      `TEL;TYPE=WORK:${card.company_tel}`,
      // เบอร์แฟกซ์
      card.fax ? `TEL;TYPE=FAX:${card.fax}` : "",
      // อีเมล
      `EMAIL:${card.email}`,
      // เว็บไซต์
      card.website ? `URL:${card.website}` : "",
      // ที่อยู่บริษัท (เฉพาะที่อยู่ที่กำหนด)
      `ADR;TYPE=WORK:;;${companyAddress}`,
      // ไลน์ไอดี
      card.line_id ? `X-LINE:${card.line_id}` : "",
      // เฟซบุ๊ก
      card.facebook ? `X-FACEBOOK:${card.facebook}` : "",
      // ชื่อไทย
      card.name_th ? `X-NAME-TH:${card.name_th}` : "",
      // ตำแหน่งไทย
      card.position_th ? `X-POSITION-TH:${card.position_th}` : "",
      // บริษัทไทย
      card.company_th ? `X-COMPANY-TH:${card.company_th}` : "",
      "END:VCARD",
    ]

    // กรองเอาเฉพาะบรรทัดที่มีข้อมูล
    return vCardLines.filter((line) => line !== "").join("\n")
  }

  // ฟังก์ชันสำหรับแปลงรูปแบบเบอร์โทรศัพท์
  const formatPhoneNumber = (phone: string) => {
    // ลบ +66 ออกและแทนที่ด้วย 0
    if (phone.startsWith("+66")) {
      return "0" + phone.substring(3).replace(/\s/g, "-")
    }
    return phone.replace(/\s/g, "-")
  }

  // ฟังก์ชันสำหรับแปลงที่อยู่ให้ขึ้นบรรทัดใหม่หลังเครื่องหมาย /
  const formatAddress = (address: string) => {
    return address.replace("/", ", ")
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

  if (!businessCard) {
    return (
      <div className="text-center py-10">
        <p className="mb-4">You don't have a business card yet.</p>
        <Link href="/user/business-card/edit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Create Business Card
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-1/2">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Business Card</h2>
          <Link href="/user/business-card/edit" className="flex items-center text-blue-500 hover:text-blue-700">
            <span className="h-4 w-4 mr-1">✏️</span>
            Edit
          </Link>
        </div>

        {/* Business Card Preview - New Design */}
        <div className="relative mx-auto flex justify-center" style={{ width: "100%" }}>
          <div
            id="business-card"
            ref={cardRef}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
            style={{
              width: "380px",
              height: "240px",
              padding: "15px",
              boxSizing: "border-box",
              position: "relative",
              fontFamily: "Arial, sans-serif",
            }}
          >
            {/* Logo and Company Name */}
            <div className="flex items-center mb-2">
              <div className="w-8 h- mr-2">
                <img src="/images/nozomi-logo.png" alt="Nozomi Logo" className="w-full h-full object-contain" />
              </div>
              <div className="text-xs font-bold leading-tight">{businessCard.company_en}</div>
            </div>

            {/* Name and Position */}
            <div className="mb-2">
              <div className="text-xs font-medium">{businessCard.name_th}</div>
              <div className="text-xs font-bold text-blue-900">{businessCard.name_en}</div>
              {businessCard.position_en && <div className="text-xs italic">{businessCard.position_en}</div>}
            </div>

            {/* Contact Info */}
            <div className="text-[10px] space-y-0.5">
              <div className="flex items-start">
                <span className="font-semibold mr-1">Mobile :</span>
                <span>{formatPhoneNumber(businessCard.tel)}</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold mr-1">E-mail :</span>
                <span>{businessCard.email}</span>
              </div>
            </div>

            {/* URS Logo - ปรับตำแหน่งตามที่ต้องการ */}
            <div className="absolute right-2 top-14">
              <div className="w-20 h-14">
                <img
                  src="/images/urs-certification-new.png"
                  alt="URS Certification"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Address - ตามรูปแบบใหม่ */}
            <div className="text-[10px] mt-1">
              <div>
                <span className="font-semibold">Head Office : </span>
                <span style={{ whiteSpace: "pre-line" }}>{formatAddress(businessCard.address_en)}</span>
              </div>
              <div>
                Tel : {businessCard.company_tel} Fax : {businessCard.fax}
              </div>

              <div className="mt-1">
                <span className="font-semibold">Branch 1 : </span>
                <span style={{ whiteSpace: "pre-line" }}>{formatAddress(businessCard.branch_address_en)}</span>
              </div>
            </div>

            {/* QR Code - เปลี่ยนเป็น QR Code สำหรับแชร์นามบัตร */}
            <div className="absolute bottom-2 right-2 flex flex-col items-center">
              <QRCode value={shareUrl} size={60} renderAs="svg" includeMargin={false} />
              <div className="text-[8px] text-green-600 font-semibold mt-0.5">Scan to view</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={handleSaveImage}
              className="flex items-center justify-center p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <ImageIcon className="h-5 w-5 mr-2" />
              Save image
            </button>

            <button
              onClick={handleSaveVCard}
              className="flex items-center justify-center p-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <FileDown className="h-5 w-5 mr-2" />
              Save vCard
            </button>

            <button
              onClick={handleOpenGoogleMap}
              className="flex items-center justify-center p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              <Map className="h-5 w-5 mr-2" />
              Google Map
            </button>
          </div>

          <div className="mt-8">
            <h3 className="font-semibold mb-2">Business Card Information</h3>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Size:</span> 95mm x 60mm
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Format:</span> PNG image
            </p>
          </div>
        </div>
      </div>

      {/* Hidden card with fixed size for image generation - จะไม่แสดงบนหน้าจอ */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div
          id="hidden-business-card"
          ref={hiddenCardRef}
          className="bg-white overflow-hidden"
          style={{
            width: `${CARD_WIDTH}px`,
            height: `${CARD_HEIGHT}px`,
            padding: "30px",
            boxSizing: "border-box",
            position: "relative",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {/* Logo and Company Name */}
          <div className="flex items-center mb-4">
            <div className="w-20 h-20 mr-4">
              <img src="/images/nozomi-logo.png" alt="Nozomi Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-3xl font-bold leading-tight">{businessCard.company_en}</div>
          </div>

          {/* Name and Position */}
          <div className="mb-4">
            <div className="text-xl font-medium">{businessCard.name_th}</div>
            <div className="text-2xl font-bold text-blue-900">{businessCard.name_en}</div>
            {businessCard.position_en && <div className="text-xl italic">{businessCard.position_en}</div>}
          </div>

          {/* Contact Info */}
          <div className="text-lg space-y-2">
            <div className="flex items-start">
              <span className="font-semibold mr-2">Mobile :</span>
              <span>{formatPhoneNumber(businessCard.tel)}</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold mr-2">E-mail :</span>
              <span>{businessCard.email}</span>
            </div>
          </div>

          {/* URS Logo */}
          <div className="absolute right-4 top-28">
            <div className="w-40 h-28">
              <img
                src="/images/urs-certification-new.png"
                alt="URS Certification"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Address */}
          <div className="text-lg mt-4">
            <div>
              <span className="font-semibold">Head Office : </span>
              <span style={{ whiteSpace: "pre-line" }}>{formatAddress(businessCard.address_en)}</span>
            </div>
            <div>
              Tel : {businessCard.company_tel} Fax : {businessCard.fax}
            </div>

            <div className="mt-2">
              <span className="font-semibold">Branch 1 : </span>
              <span style={{ whiteSpace: "pre-line" }}>{formatAddress(businessCard.branch_address_en)}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="absolute bottom-4 right-4 flex flex-col items-center">
            <QRCode value={shareUrl} size={120} renderAs="svg" includeMargin={false} />
            <div className="text-base text-green-600 font-semibold mt-1">Scan to view</div>
          </div>
        </div>
      </div>
    </div>
  )
}
