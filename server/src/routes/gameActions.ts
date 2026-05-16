import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'
import { authenticateJWT } from '../middleware/auth'

const router = Router()

router.put('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const game = await prisma.game.findUnique({ where: { id: req.params.id }, include: { plan: true } })
  if (!game) {
    res.status(404).json({ error: 'Game not found' })
    return
  }
  if (req.user!.role !== 'ADMIN' && game.plan.ownerId !== req.user!.userId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const { gameDate, opponent, homeAway, gameNumber, notes } = req.body
  const updated = await prisma.game.update({
    where: { id: req.params.id },
    data: {
      ...(gameDate && { gameDate: new Date(gameDate) }),
      ...(opponent && { opponent }),
      ...(homeAway && { homeAway }),
      ...(gameNumber !== undefined && { gameNumber: Number(gameNumber) }),
      ...(notes !== undefined && { notes }),
    },
  })
  res.json(updated)
})

router.delete('/:id', authenticateJWT, async (req: Request, res: Response) => {
  const game = await prisma.game.findUnique({ where: { id: req.params.id }, include: { plan: true } })
  if (!game) {
    res.status(404).json({ error: 'Game not found' })
    return
  }
  if (req.user!.role !== 'ADMIN' && game.plan.ownerId !== req.user!.userId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  await prisma.game.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

export default router
