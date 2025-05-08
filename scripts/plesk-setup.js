/**
 * Plesk Setup Script
 * 
 * สคริปต์นี้จะทำการตั้งค่าที่จำเป็นสำหรับการ deploy บน Plesk
 * - ตรวจสอบการเชื่อมต่อฐานข้อมูล
 * - สร้างโฟลเดอร์ที่จำเป็น
 * - ตั้งค่าสิทธิ์การเข้าถึงไฟล์
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { execSync } = require('child_process');

// ฟังก์ชันสำหรับการแสดงข้อความ
function log(message) {
  console.log(`[PLESK SETUP] ${message}`);
}

// ฟังก์ชันสำหรับการแสดงข้อผิดพลาด
function error(message) {
  console.error(`[PLESK SETUP ERROR] ${message}`);
}

// ตรวจสอบการเชื่อมต่อฐานข้อมูล
async function checkDatabaseConnection() {
  log('ตรวจสอบการเชื่อมต่อฐานข้อมูล...');
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'carbookingsystem',
  };
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('SELECT 1');
    await connection.end();
    log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');
    return true;
  } catch (err) {
    error(`❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ${err.message}`);
    return false;
  }
}

// สร้างโฟลเดอร์ที่จำเป็น
function createRequiredDirectories() {
  log('สร้างโฟลเดอร์ที่จำเป็น...');
  
  const directories = [
    path.join(process.cwd(), 'public', 'uploads'),
    path.join(process.cwd(), 'public', 'uploads', 'avatars'),
    path.join(process.cwd(), 'public', 'uploads', 'cars'),
    path.join(process.cwd(), 'public', 'uploads', 'temp')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        log(`✅ สร้างโฟลเดอร์ ${dir} สำเร็จ`);
      } catch (err) {
        error(`❌ ไม่สามารถสร้างโฟลเดอร์ ${dir} ได้: ${err.message}`);
      }
    } else {
      log(`ℹ️ โฟลเดอร์ ${dir} มีอยู่แล้ว`);
    }
  });
}

// ตั้งค่าสิทธิ์การเข้าถึงไฟล์
function setFilePermissions() {
  log('ตั้งค่าสิทธิ์การเข้าถึงไฟล์...');
  
  try {
    // ตรวจสอบว่าเป็น Windows หรือไม่
    const isWindows = process.platform === 'win32';
    
    if (!isWindows) {
      // ตั้งค่าสิทธิ์สำหรับโฟลเดอร์ uploads
      execSync('chmod -R 755 public/uploads');
      log('✅ ตั้งค่าสิทธิ์สำหรับโฟลเดอร์ uploads สำเร็จ');
      
      // ตั้งค่าสิทธิ์สำหรับไฟล์ .htaccess
      if (fs.existsSync('.htaccess')) {
        execSync('chmod 644 .htaccess');
        log('✅ ตั้งค่าสิทธิ์สำหรับไฟล์ .htaccess สำเร็จ');
      }
    } else {
      log('ℹ️ ข้ามการตั้งค่าสิทธิ์เนื่องจากเป็นระบบ Windows');
    }
  } catch (err) {
    error(`❌ ไม่สามารถตั้งค่าสิทธิ์การเข้าถึงไฟล์ได้: ${err.message}`);
  }
}

// ฟังก์ชันหลัก
async function main() {
  log('เริ่มต้นการตั้งค่าสำหรับ Plesk...');
  
  // ตรวจสอบการเชื่อมต่อฐานข้อมูล
  const dbConnected = await checkDatabaseConnection();
  
  // สร้างโฟลเดอร์ที่จำเป็น
  createRequiredDirectories();
  
  // ตั้งค่าสิทธิ์การเข้าถึงไฟล์
  setFilePermissions();
  
  if (dbConnected) {
    log('✅ การตั้งค่าสำหรับ Plesk เสร็จสมบูรณ์');
  } else {
    log('⚠️ การตั้งค่าสำหรับ Plesk เสร็จสมบูรณ์ แต่มีปัญหาในการเชื่อมต่อฐานข้อมูล');
    log('โปรดตรวจสอบการตั้งค่าฐานข้อมูลใน .env.local');
  }
}

// เรียกใช้ฟังก์ชันหลัก
main().catch(err => {
  error(`เกิดข้อผิดพลาดที่ไม่คาดคิด: ${err.message}`);
  process.exit(1);
});