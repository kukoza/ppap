<?php
/**
 * Proxy script for Next.js on shared hosting
 * 
 * This script forwards requests to the Node.js server running Next.js
 */

// ตรวจสอบว่า Node.js server กำลังทำงานอยู่หรือไม่
$node_server = "http://127.0.0.1:3000";

// ดึง request path
$request_uri = $_SERVER['REQUEST_URI'];

// ถ้าเป็นไฟล์ static ให้เข้าถึงโดยตรง
if (preg_match('/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot|map)$/', $request_uri)) {
    return false; // ให้ Apache จัดการไฟล์ static
}

// ส่ง request ไปยัง Node.js server
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $node_server . $request_uri);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

// ส่ง headers ทั้งหมด
$headers = [];
foreach ($_SERVER as $key => $value) {
    if (strpos($key, 'HTTP_') === 0) {
        $header = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))));
        $headers[] = "$header: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// ส่ง method และ body ถ้าเป็น POST, PUT, etc.
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'HEAD') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

// รับ response
$response = curl_exec($ch);
$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$header = substr($response, 0, $header_size);
$body = substr($response, $header_size);
$status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// ปิด curl
curl_close($ch);

// ส่ง status code
http_response_code($status_code);

// ส่ง headers
foreach (explode("\r\n", $header) as $i => $line) {
    if ($i === 0 || strlen($line) === 0) {
        continue;
    }
    header($line);
}

// ส่ง body
echo $body;