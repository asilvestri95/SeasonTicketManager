import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'
import { authenticateJWT, requireAdmin } from '../middleware/auth'

const router = Router()

router.get('/', authenticateJWT, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { name: 'asc' },
  })
  res.json(users)
})

router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, email, password, role } = req.body

  if (req.user!.userId !== id && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const data: Record<string, unknown> = {}
  if (name) data.name = name
  if (email) data.email = email
  if (password) data.passwordHash = await bcrypt.hash(password, 10)
  if (role && req.user!.role === 'ADMIN') data.role = role

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  })
  res.json(user)
})

router.delete('/:id', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params
  if (req.user!.userId === id) {
    res.status(400).json({ error: 'Cannot delete your own account' })
    return
  }
  await prisma.user.delete({ where: { id } })
  res.status(204).end()
})

export default router
