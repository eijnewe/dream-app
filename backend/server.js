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

function authenticate(req, res, next) {
  const authorization = req.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Authentication required',
    })
  }

  const token = authorization.slice(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    })

    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({
      message: 'Invalid or expired token',
    })
  }
}

const categories = ['Mat', 'Transport', 'Shopping', 'Övrigt']

function validateExpense(body) {
  const { amount, category, description } = body ?? {}

  return (
    typeof amount === 'number' &&
    Number.isFinite(amount) &&
    amount > 0 &&
    amount <= 9999999999.99 &&
    /^\d+(\.\d{1,2})?$/.test(String(amount)) &&
    categories.includes(category) &&
    typeof description === 'string' &&
    description.length <= 255
  )
}

function validId(id) {
  return /^\d+$/.test(id) && Number(id) > 0 && Number(id) <= 2147483647
}

app.get('/expenses', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM expenses
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId],
    )

    return res.status(200).json(result.rows)
  } catch {
    return res.status(500).json({
      message: 'Could not fetch expenses',
    })
  }
})

app.get('/expenses/:id', authenticate, async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({
      message: 'Invalid expense ID',
    })
  }

  try {
    const result = await pool.query(
      `SELECT * FROM expenses
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Expense not found',
      })
    }

    return res.status(200).json(result.rows[0])
  } catch {
    return res.status(500).json({
      message: 'Could not fetch expense',
    })
  }
})

app.post('/expenses', authenticate, async (req, res) => {
  if (!validateExpense(req.body)) {
    return res.status(400).json({
      message: 'Invalid expense data',
    })
  }

  const { amount, category, description } = req.body

  try {
    const result = await pool.query(
      `INSERT INTO expenses
       (user_id, amount, category, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.userId, amount, category, description],
    )

    return res.status(201).json(result.rows[0])
  } catch {
    return res.status(500).json({
      message: 'Could not create expense',
    })
  }
})

app.put('/expenses/:id', authenticate, async (req, res) => {
  if (!validId(req.params.id) || !validateExpense(req.body)) {
    return res.status(400).json({
      message: 'Invalid expense data or ID',
    })
  }

  const { amount, category, description } = req.body

  try {
    const result = await pool.query(
      `UPDATE expenses
       SET amount = $1, category = $2, description = $3
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [amount, category, description, req.params.id, req.userId],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Expense not found',
      })
    }

    return res.status(200).json(result.rows[0])
  } catch {
    return res.status(500).json({
      message: 'Could not update expense',
    })
  }
})

app.delete('/expenses/:id', authenticate, async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({
      message: 'Invalid expense ID',
    })
  }

  try {
    const result = await pool.query(
      `DELETE FROM expenses
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Expense not found',
      })
    }

    return res.status(204).end()
  } catch {
    return res.status(500).json({
      message: 'Could not delete expense',
    })
  }
})

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'Invalid JSON',
    })
  }

  return res.status(500).json({
    message: 'Internal server error',
  })
})

export default app;
