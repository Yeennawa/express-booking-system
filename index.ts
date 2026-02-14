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
    
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    
    db.query(sql, [username, password], (err, results: any) => {
        if (err) return res.status(500).json(err);
        
        if (results.length > 0) {
            res.json({ success: true, message: "Login Successful!" });
        } else {
            res.status(401).json({ success: false, message: "Username หรือ Password ผิด!" });
        }
    });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});