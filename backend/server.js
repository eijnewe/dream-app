import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from './db.js'

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is missing')
}

app.disable('x-powered-by')
app.use(express.json())

app.get('/health', (req, res) => {
  res.status(200).json({ message: 'API is running' })
})

// Register
app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body ?? {}

  if (
    typeof email !== 'string' ||
    email.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof password !== 'string' ||
    password.length < 8 ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({
      message: 'Invalid email or password',
    })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)

    const result = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email`,
      [email.trim().toLowerCase(), passwordHash],
    )

    return res.status(201).json(result.rows[0])
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'Email already registered',
      })
    }

    return res.status(500).json({
      message: 'Registration failed',
    })
  }
})

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {}

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !email.trim() ||
    !password ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({
      message: 'Email and password are required',
    })
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email.trim().toLowerCase(),
    ])

    const user = result.rows[0]

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        message: 'Invalid email or password',
      })
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '7d',
    })

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch {
    return res.status(500).json({
      message: 'Login failed',
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
