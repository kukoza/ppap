import { NextResponse } from "next/server"
import mysql from "mysql2/promise"

export async function GET() {
  try {
    console.log("Simple database connection test")
    console.log("DB_HOST:", process.env.DB_HOST)
    console.log("DB_USER:", process.env.DB_USER)
    console.log("DB_NAME:", process.env.DB_NAME)

    // กำหนดค่าการเชื่อมต่อ
    const dbConfig = {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "carbookingsystem",
    }

    // ทดสอบการเชื่อมต่อโดยตรง
    const connection = await mysql.createConnection(dbConfig)
    console.log("Connection established")

    // ทดสอบการ query อย่างง่าย
    const [rows] = await connection.execute("SELECT 1 as test")
    console.log("Simple query executed successfully:", rows)

    // ปิดการเชื่อมต่อ
    await connection.end()
    console.log("Connection closed")

    return NextResponse.json({
      success: true,
      message: "Simple database connection successful",
      result: rows,
      env: {
        DB_HOST: process.env.DB_HOST || "not set",
        DB_USER: process.env.DB_USER || "not set",
        DB_NAME: process.env.DB_NAME || "not set",
      },
    })
  } catch (error) {
    console.error("Simple database connection test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : String(error),
        env: {
          DB_HOST: process.env.DB_HOST || "not set",
          DB_USER: process.env.DB_USER || "not set",
          DB_NAME: process.env.DB_NAME || "not set",
        },
      },
      { status: 500 },
    )
  }
}
