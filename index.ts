import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import mysql from 'mysql2';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: 'databassweb' // เช็คชื่อ DB ให้ตรงนะครับ
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

// --- API Register (แก้ไขให้รับกับคอลัมน์ email) ---
app.post('/api/register', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (email, password) VALUES (?, ?)";
        db.query(sql, [email, hashedPassword], (err) => {
            if (err) {
                console.error(err);
                return res.status(400).json({ success: false, message: "Email นี้มีผู้ใช้แล้วหรือระบบขัดข้อง" });
            }
            res.json({ success: true, message: "สมัครสมาชิกสำเร็จ!" });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// --- API Login ---
app.post('/api/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results: any) => {
        if (err || results.length === 0) return res.status(401).json({ success: false, message: "ไม่พบผู้ใช้" });
        const match = await bcrypt.compare(password, results[0].password);
        if (match) {
            const token = jwt.sign({ id: results[0].id, email: results[0].email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
            res.json({ success: true, token });
        } else {
            res.status(401).json({ success: false, message: "รหัสผ่านผิด" });
        }
    });
});

app.listen(5000, () => console.log("Server running at http://localhost:5000"));