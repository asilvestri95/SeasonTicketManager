import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticateJWT } from '../middleware/auth'

const router = Router()

router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const { status, seatLabel } = req.body
  const updated = await prisma.gameAssignment.update({
    where: { id: req.params.id },
    data: {
      ...(status && { status }),
      ...(seatLabel !== undefined && { seatLabel }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      transfer: true,
    },
  })
  res.json(updated)
})

router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  await prisma.gameAssignment.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

export default router
