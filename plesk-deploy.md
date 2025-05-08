# คู่มือการ Deploy บน Plesk

## ขั้นตอนการ Deploy

1. **เตรียมโปรเจคก่อน Upload**
   ```bash
   # ติดตั้ง dependencies
   npm install
   
   # สร้าง production build
   npm run build
   ```

2. **อัปโหลดไฟล์ไปยัง Plesk**
   - อัปโหลดโค้ดทั้งหมดยกเว้นโฟลเดอร์ `node_modules` และ `.git`
   - ตรวจสอบว่าได้อัปโหลดไฟล์ `.htaccess` ด้วย

3. **ตั้งค่า Node.js Application ใน Plesk**
   - เข้าไปที่ Plesk Control Panel > Domains > [your-domain] > Node.js
   - เปิดใช้งาน Node.js
   - ตั้งค่าดังนี้:
     - Document root: `/` (root directory ของโปรเจค)
     - Application startup file: `start.js`
     - Application mode: `production`
     - Node.js version: เลือกเวอร์ชัน 18.x หรือสูงกว่า
     - NPM install command: `npm install --production`
     - Application URL: เลือก domain ที่ต้องการใช้

4. **สร้างฐานข้อมูล MySQL บน Plesk**
   - เข้าไปที่ Plesk Control Panel > Domains > [your-domain] > Databases
   - สร้างฐานข้อมูลใหม่ชื่อ `carbookingsystem`
   - สร้าง database user และกำหนดสิทธิ์

5. **อัปเดตไฟล์ `.env.local`**
   - แก้ไขไฟล์ `.env.local` ให้ตรงกับการตั้งค่าฐานข้อมูลบน Plesk:
   ```
   DB_HOST=localhost
   DB_USER=[plesk_db_username]
   DB_PASSWORD=[plesk_db_password]
   DB_NAME=carbookingsystem
   ```

6. **รันสคริปต์เตรียมระบบ**
   - เข้าไปที่ Plesk Control Panel > Domains > [your-domain] > Node.js
   - คลิกที่ "Run script" และรันคำสั่งต่อไปนี้ทีละคำสั่ง:
   ```
   npm run setup-db
   npm run create-upload-dirs
   ```

7. **ตรวจสอบสิทธิ์การเข้าถึงไฟล์**
   - ตรวจสอบว่าโฟลเดอร์ `public/uploads` มีสิทธิ์ในการเขียนไฟล์
   - ถ้าจำเป็น ให้รันคำสั่งต่อไปนี้:
   ```
   chmod -R 755 public/uploads
   ```

8. **รีสตาร์ท Node.js Application**
   - คลิกที่ปุ่ม "Restart" ใน Node.js Application settings

## การแก้ไขปัญหาที่พบบ่อย

1. **ปัญหาการเชื่อมต่อฐานข้อมูล**
   - ตรวจสอบว่าข้อมูลการเชื่อมต่อฐานข้อมูลใน `.env.local` ถูกต้อง
   - ตรวจสอบว่า database user มีสิทธิ์เพียงพอ

2. **ปัญหา 502 Bad Gateway**
   - ตรวจสอบ error log ของ Node.js application
   - เพิ่ม memory limit ใน Node.js settings
   - ตรวจสอบว่า application ทำงานอยู่ (ไม่ crash)

3. **ปัญหาการโหลดไฟล์ static**
   - ตรวจสอบว่า `.htaccess` ถูกอัปโหลดและทำงานถูกต้อง
   - ตรวจสอบสิทธิ์การเข้าถึงไฟล์ในโฟลเดอร์ public

4. **ปัญหา API routes ไม่ทำงาน**
   - ตรวจสอบว่า proxy settings ใน Plesk ถูกตั้งค่าให้ส่ง requests ไปยัง Node.js application

## การอัปเดตแอปพลิเคชัน

1. สร้าง build ใหม่บนเครื่องพัฒนา: `npm run build`
2. อัปโหลดไฟล์ที่อัปเดตไปยัง Plesk (ยกเว้น node_modules)
3. เข้าไปที่ Node.js settings ใน Plesk และคลิก "Restart"