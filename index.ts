import express, { Request, Response } from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import dotenv from 'dotenv';
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

app.post('/api/booking', (req: Request, res: Response) => {
    const { customer_name, phone, booking_date, booking_time } = req.body;

    const sql = "INSERT INTO appointments (customer_name, phone, booking_date, booking_time) VALUES (?, ?, ?, ?)";
    
    db.query(sql, [customer_name, phone, booking_date, booking_time], (err, result) => {
        if (err) {
            console.error("เกิดข้อผิดพลาดในการบันทึก:", err);
            return res.status(500).send("เกิดข้อผิดพลาดที่ Server");
        }
        res.send({ message: "จองคิวสำเร็จแล้ว!", id: (result as any).insertId });
    });
});

app.get('/', (req: Request, res: Response) => {
  res.send('Backend is running!');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});