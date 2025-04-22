import mysql from "mysql2/promise"

// กำหนดค่าการเชื่อมต่อ
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "carbookingsystem",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

// สร้าง pool connection
let pool: mysql.Pool | null = null

// ฟังก์ชันสำหรับการเชื่อมต่อกับฐานข้อมูล
async function getPool() {
  if (!pool) {
    try {
      console.log("Creating database pool with config:", {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database,
      })
      pool = mysql.createPool(dbConfig)

      // ทดสอบการเชื่อมต่อ
      const connection = await pool.getConnection()
      connection.release()
      console.log("Database pool created and tested successfully")
    } catch (error) {
      console.error("Error creating database pool:", error)
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  return pool
}

// ฟังก์ชันสำหรับการ query
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const pool = await getPool()
    console.log("Executing query:", query, "with params:", params)
    const [rows] = await pool.execute(query, params)
    return { recordset: rows }
  } catch (err) {
    console.error("Query execution error:", err)
    throw err
  }
}

// ฟังก์ชันสำหรับการ query แบบ single row
export async function executeQuerySingle(query: string, params: any[] = []) {
  try {
    const { recordset } = await executeQuery(query, params)
    const rows = recordset as any[]
    return rows.length > 0 ? rows[0] : null
  } catch (err) {
    console.error("Query execution error:", err)
    throw err
  }
}

// ฟังก์ชันสำหรับการ insert และ return ID
export async function executeInsert(query: string, params: any[] = []) {
  try {
    const pool = await getPool()
    console.log("Executing insert:", query, "with params:", params)
    const [result] = await pool.execute(query, params)
    const insertId = (result as any).insertId
    return { insertId }
  } catch (err) {
    console.error("Insert execution error:", err)
    throw err
  }
}
