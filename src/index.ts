import express from 'express';
import { PrismaClient } from './generated/prisma';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 1. หน้าแรกสำหรับทดสอบ
app.get('/', (req, res) => {
  res.send('API Connected!');
});

// 2. GET: ดึงข้อมูลนักเรียนทั้งหมด
app.get('/api/students', async (req, res) => {
  try {
    const students = await prisma.student.findMany();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// 3. GET: ดึงข้อมูลนักเรียนรายคนด้วย ID (UUID เป็น String)
app.get('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id: id }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// 4. POST: เพิ่มข้อมูลนักเรียนใหม่
app.post('/api/students', async (req, res) => {
  try {
    const { code, name, email, score } = req.body;

    const newStudent = await prisma.student.create({
      data: {
        code,
        name,
        email,
        score: score !== undefined ? Number(score) : 0
      }
    });

    res.status(201).json(newStudent);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create student' });
  }
});

// 5. PUT: แก้ไขข้อมูลนักเรียนตาม ID
app.put('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, email, score, active } = req.body;

    const updatedStudent = await prisma.student.update({
      where: { id: id },
      data: {
        code,
        name,
        email,
        score: score !== undefined ? Number(score) : undefined,
        active
      }
    });

    res.json(updatedStudent);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update student' });
  }
});

// 6. DELETE: ลบข้อมูลนักเรียนตาม ID
app.delete('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.student.delete({
      where: { id: id }
    });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete student' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});