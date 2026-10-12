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

// 2. GET: ดึงข้อมูลนักเรียน
// รองรับ page, limit, search q, sort, order
app.get('/api/v1/students', async (req, res) => {
  try {
    const { page, limit, q, sort, order } = req.query;

    // Pagination
    const pageNum = page ? parseInt(page as string) : undefined;
    const limitNum = limit ? parseInt(limit as string) : undefined;
    const skip =
      pageNum && limitNum ? (pageNum - 1) * limitNum : undefined;

    // Search
    const where = q
      ? {
          OR: [
            {
              name: {
                contains: q as string,
                mode: 'insensitive' as const
              }
            },
            {
              email: {
                contains: q as string,
                mode: 'insensitive' as const
              }
            },
            {
              code: {
                contains: q as string,
                mode: 'insensitive' as const
              }
            }
          ]
        }
      : {};

    // Sorting
    const orderBy = sort
      ? {
          [sort as string]:
            order === 'desc' ? 'desc' : 'asc'
        }
      : {
          createdAt: 'desc' as const
        };

    const students = await prisma.student.findMany({
      where,
      skip,
      take: limitNum,
      orderBy
    });

    res.json(students);
  } catch (error) {
    console.error('GET ALL ERROR:', error);
    res.status(500).json({
      error: 'Failed to fetch students'
    });
  }
});

// 3. GET: ดึงข้อมูลนักเรียนรายคนด้วย ID
app.get('/api/v1/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id }
    });

    if (!student) {
      return res.status(404).json({
        error: 'Student not found'
      });
    }

    res.json(student);
  } catch (error) {
    console.error('GET ONE ERROR:', error);

    res.status(500).json({
      error: 'Failed to fetch student'
    });
  }
});

// 4. POST: เพิ่มข้อมูลนักเรียนใหม่
app.post('/api/v1/students', async (req, res) => {
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
    console.error('POST ERROR:', error);

    res.status(400).json({
      error: 'Failed to create student'
    });
  }
});

// 5. PUT: แก้ไขข้อมูลนักเรียนทั้งหมด
app.put('/api/v1/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, email, score, active } = req.body;

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        code,
        name,
        email,
        score:
          score !== undefined ? Number(score) : undefined,
        active
      }
    });

    res.json(updatedStudent);
  } catch (error) {
    console.error('PUT ERROR:', error);

    res.status(400).json({
      error: 'Failed to update student'
    });
  }
});

// 5.1 PATCH: แก้ไขข้อมูลนักเรียนบางส่วน
app.patch('/api/v1/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, email, score, active } = req.body;

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(score !== undefined && {
          score: Number(score)
        }),
        ...(active !== undefined && { active })
      }
    });

    res.json(updatedStudent);
  } catch (error) {
    console.error('PATCH ERROR:', error);

    res.status(400).json({
      error: 'Failed to update student'
    });
  }
});

// 6. DELETE: ลบข้อมูลนักเรียนตาม ID
app.delete('/api/v1/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่ามีนักเรียนคนนี้หรือไม่
    const student = await prisma.student.findUnique({
      where: { id }
    });

    if (!student) {
      return res.status(404).json({
        error: 'Student not found'
      });
    }

    // ลบข้อมูล
    await prisma.student.delete({
      where: { id }
    });

    // สำเร็จต้องส่ง 204 No Content
    return res.status(204).send();
  } catch (error) {
    console.error('DELETE ERROR:', error);

    return res.status(400).json({
      error: 'Failed to delete student'
    });
  }
});

// เริ่ม Server
app.listen(PORT, () => {
  console.log(
    `Server is running at http://localhost:${PORT}`
  );
});