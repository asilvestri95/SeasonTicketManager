import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticateJWT } from '../middleware/auth'

const router = Router({ mergeParams: true })

router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const { gameId } = req.params
  const assignments = await prisma.gameAssignment.findMany({
    where: { gameId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      transfer: {
        include: {
          fromUser: { select: { id: true, name: true } },
          toUser: { select: { id: true, name: true } },
        },
      },
    },
  })
  res.json(assignments)
})

router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  const { gameId } = req.params
  const { userId, seatLabel } = req.body
  if (!userId) {
    res.status(400).json({ error: 'userId is required' })
    return
  }

  const assignment = await prisma.gameAssignment.create({
    data: { gameId, userId, seatLabel },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })
  res.status(201).json(assignment)
})

export default router
