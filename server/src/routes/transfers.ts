import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticateJWT } from '../middleware/auth'

const router = Router()

router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const { planId, userId } = req.query

  const transfers = await prisma.transfer.findMany({
    where: {
      ...(planId && {
        assignment: { game: { planId: planId as string } },
      }),
      ...(userId && {
        OR: [{ fromUserId: userId as string }, { toUserId: userId as string }],
      }),
    },
    include: {
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } },
      assignment: {
        include: {
          game: {
            include: {
              plan: { select: { id: true, sport: true, team: true, season: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(transfers)
})

router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  const { assignmentId, toUserId, price, paymentMethod, note } = req.body
  if (!assignmentId || !toUserId) {
    res.status(400).json({ error: 'assignmentId and toUserId are required' })
    return
  }

  const assignment = await prisma.gameAssignment.findUnique({ where: { id: assignmentId } })
  if (!assignment) {
    res.status(404).json({ error: 'Assignment not found' })
    return
  }

  const transfer = await prisma.transfer.create({
    data: {
      assignmentId,
      fromUserId: assignment.userId,
      toUserId,
      price: price ? Number(price) : 0,
      paymentMethod,
      note,
    },
    include: {
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } },
      assignment: {
        include: {
          game: {
            include: {
              plan: { select: { id: true, sport: true, team: true, season: true } },
            },
          },
        },
      },
    },
  })

  await prisma.gameAssignment.update({
    where: { id: assignmentId },
    data: { status: 'TRANSFERRED' },
  })

  res.status(201).json(transfer)
})

router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const { paymentStatus, paymentMethod, price, note } = req.body
  const updated = await prisma.transfer.update({
    where: { id: req.params.id },
    data: {
      ...(paymentStatus && { paymentStatus }),
      ...(paymentMethod !== undefined && { paymentMethod }),
      ...(price !== undefined && { price: Number(price) }),
      ...(note !== undefined && { note }),
    },
    include: {
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } },
      assignment: {
        include: {
          game: {
            include: {
              plan: { select: { id: true, sport: true, team: true, season: true } },
            },
          },
        },
      },
    },
  })
  res.json(updated)
})

router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const transfer = await prisma.transfer.findUnique({ where: { id: req.params.id } })
  if (!transfer) {
    res.status(404).json({ error: 'Transfer not found' })
    return
  }

  await prisma.transfer.delete({ where: { id: req.params.id } })
  await prisma.gameAssignment.update({
    where: { id: transfer.assignmentId },
    data: { status: 'ASSIGNED' },
  })
  res.status(204).end()
})

export default router
