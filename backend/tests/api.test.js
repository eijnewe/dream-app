import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = 'local-test-only'

const { default: app } = await import('../server.js')

let server
let baseUrl

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })

  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
})

test('Health endpoint returns 200', async () => {
  const response = await fetch(`${baseUrl}/health`)

  assert.equal(response.status, 200)
})

test('Registration rejects invalid data', async () => {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'invalid-email',
      password: '123',
    }),
  })

  assert.equal(response.status, 400)
})

test('Login rejects missing credentials', async () => {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })

  assert.equal(response.status, 400)
})

test('Expenses require authentication', async () => {
  const response = await fetch(`${baseUrl}/expenses`)

  assert.equal(response.status, 401)
})

test('Invalid JWT is rejected', async () => {
  const response = await fetch(`${baseUrl}/expenses`, {
    headers: {
      Authorization: 'Bearer invalid-token',
    },
  })

  assert.equal(response.status, 401)
})
