import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Car } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="h-6 w-6" />
          <h1 className="text-xl font-bold">โนโซมิ เอ็นเตอร์ไพรส์</h1>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="secondary">เข้าสู่ระบบ</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">ยินดีต้อนรับสู่ระบบจองรถ โนโซมิ เอ็นเตอร์ไพรส์</h1>
          <p className="text-xl mb-8">จองรถของบริษัทสำหรับความต้องการทางธุรกิจของคุณได้อย่างง่ายดาย</p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg">เข้าสู่ระบบเพื่อจองรถ</Button>
            </Link>
          </div>
        </div>
      </main>
      <footer className="bg-muted py-6 px-6 text-center">
        <p>© {new Date().getFullYear()} โนโซมิ เอ็นเตอร์ไพรส์ สงวนลิขสิทธิ์</p>
      </footer>
    </div>
  )
}
