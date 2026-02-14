import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

interface UserPayload {
    id: number;
    username: string;
}

interface AuthenticatedRequest extends Request {
    user?: UserPayload;
}

dotenv.config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json()); 
app.use(express.static('public')); 

const db = mysql.createConnection({
  host: process.env.DB_HOST,   
  user: process.env.DB_USER,         
  password: process.env.DB_PASS,
  database: process.env.DB_NAME 
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL Database!');
});

const saltRounds = 10; // ความละเอียดในการเข้ารหัส

app.post('/api/register', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
        // 1. เข้ารหัส Password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 2. บันทึกลง Database
        const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
        db.query(sql, [username, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Username นี้มีผู้ใช้แล้ว" });
                return res.status(500).json(err);
            }
            res.json({ message: "User Registered Successfully!" });
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

app.post('/api/booking', (req, res) => {
    const { destination, check_in, check_out, rooms, adults, children } = req.body;
    
    const sql = "INSERT INTO appointments (destination, check_in, check_out, rooms, adults, children) VALUES (?, ?, ?, ?, ?, ?)";
    
    db.query(sql, [destination, check_in, check_out, rooms, adults, children], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Booking Successful!" });
    });
});

app.post('/api/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ?";

    db.query(sql, [username], async (err, results: any) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(401).json({ message: "ไม่พบผู้ใช้งาน" });

        const user = results[0];
        // เปรียบเทียบรหัสผ่านที่ส่งมา กับที่อยู่ใน DB
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'fallback', { expiresIn: '1d' });
            res.json({ success: true, token });
        } else {
            res.status(401).json({ message: "Password ผิด!" });
        }
    });
});

// Middleware สำหรับตรวจ Token
const verifyToken = (req: Request, res: Response, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // ดึงค่าหลัง Bearer

    if (!token) return res.status(401).json({ message: "Access Denied: No Token Provided" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        (req as any).user = decoded; // เก็บข้อมูล user ไว้ใน request
        next(); // ไปต่อได้
    } catch (err) {
        res.status(403).json({ message: "Invalid or Expired Token" });
    }
};

// เพิ่ม verifyToken เข้าไปเป็น parameter ตัวที่สอง
app.post('/api/booking', verifyToken, (req, res) => {
    const { destination, check_in, check_out, rooms, adults, children } = req.body;
    
    // ตอนนี้เราจะได้ user_id จาก token แล้ว
    const userId = (req as any).user.id; 

    const sql = "INSERT INTO appointments (destination, check_in, check_out, rooms, adults, children, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    db.query(sql, [destination, check_in, check_out, rooms, adults, children, userId], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Booking Successful for user " + userId });
    });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});