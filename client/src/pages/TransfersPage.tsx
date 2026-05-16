import { useEffect, useState, FormEvent } from 'react'
import { api } from '@/lib/api'
import { Transfer, User, TicketPlan, GameAssignment } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import PageHeader from '@/components/PageHeader'
import { formatCurrency, formatShortDate, PAYMENT_METHODS, SPORT_COLORS } from '@/lib/utils'
import { toast } from '@/hooks/useToast'
import { Plus, ArrowLeftRight, CheckCircle, Trash2 } from 'lucide-react'

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [plans, setPlans] = useState<TicketPlan[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const [newOpen, setNewOpen] = useState(false)
  const [editTransfer, setEditTransfer] = useState<Transfer | null>(null)

  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [selectedGameId, setSelectedGameId] = useState('')
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
  const [toUserId, setToUserId] = useState('')
  const [price, setPrice] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [note, setNote] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)
  const selectedGame = selectedPlan?.games?.find((g) => g.id === selectedGameId)
  const assignableAssignments = (selectedGame?.assignments ?? []).filter(
    (a) => a.status === 'ASSIGNED' && !a.transfer
  )

  useEffect(() => {
    Promise.all([
      api.get<Transfer[]>('/transfers'),
      api.get<TicketPlan[]>('/plans'),
      api.get<User[]>('/users'),
    ])
      .then(([t, p, u]) => { setTransfers(t); setPlans(p); setUsers(u) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = transfers.filter((t) => {
    if (filterPlan !== 'all' && t.assignment?.game.plan.id !== filterPlan) return false
    if (filterStatus !== 'all' && t.paymentStatus !== filterStatus) return false
    return true
  })

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setSubmitLoading(true)
    try {
      const transfer = await api.post<Transfer>('/transfers', {
        assignmentId: selectedAssignmentId,
        toUserId,
        price: price ? Number(price) : 0,
        paymentMethod: paymentMethod || undefined,
        note: note || undefined,
      })
      setTransfers((prev) => [transfer, ...prev])
      resetForm()
      setNewOpen(false)
      toast({ title: 'Transfer created', variant: 'success' })
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleMarkPaid(transfer: Transfer) {
    const updated = await api.put<Transfer>(`/transfers/${transfer.id}`, { paymentStatus: 'PAID' })
    setTransfers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    toast({ title: 'Marked as paid', variant: 'success' })
  }

  async function handleUpdateTransfer(e: FormEvent) {
    e.preventDefault()
    if (!editTransfer) return
    setSubmitLoading(true)
    try {
      const updated = await api.put<Transfer>(`/transfers/${editTransfer.id}`, {
        paymentStatus: editTransfer.paymentStatus,
        paymentMethod: paymentMethod || undefined,
        price: price ? Number(price) : undefined,
        note: note || undefined,
      })
      setTransfers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setEditTransfer(null)
      resetForm()
      toast({ title: 'Transfer updated', variant: 'success' })
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' })
    } finally {
      setSubmitLoading(false)
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/transfers/${id}`)
    setTransfers((prev) => prev.filter((t) => t.id !== id))
    toast({ title: 'Transfer deleted' })
  }

  function openEdit(t: Transfer) {
    setEditTransfer(t)
    setPrice(t.price.toString())
    setPaymentMethod(t.paymentMethod ?? '')
    setNote(t.note ?? '')
  }

  function resetForm() {
    setSelectedPlanId(''); setSelectedGameId(''); setSelectedAssignmentId('')
    setToUserId(''); setPrice(''); setPaymentMethod(''); setNote('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Transfers"
        description="Track ticket transfers and payments"
        action={
          <Button size="sm" onClick={() => { resetForm(); setNewOpen(true) }}>
            <Plus className="w-4 h-4" /> New Transfer
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={filterPlan} onValueChange={setFilterPlan}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue placeholder="All plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.team} {p.season}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="WAIVED">Waived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-14">
              <ArrowLeftRight className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No transfers found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Game</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">From → To</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Method</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatShortDate(t.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border mr-2 ${SPORT_COLORS[t.assignment?.game.plan.sport ?? ''] ?? SPORT_COLORS.Other}`}>
                          {t.assignment?.game.plan.sport}
                        </span>
                        {t.assignment?.game.plan.team}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        vs {t.assignment?.game.opponent} · {t.assignment?.game.gameDate ? formatShortDate(t.assignment.game.gameDate) : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{t.fromUser.name}</span>
                      <span className="text-muted-foreground mx-1.5">→</span>
                      <span className="font-medium">{t.toUser.name}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(t.price)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{t.paymentMethod ?? '—'}</td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={t.paymentStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {t.paymentStatus === 'PENDING' && (
                          <button
                            onClick={() => handleMarkPaid(t)}
                            className="text-muted-foreground hover:text-green-400 transition-colors"
                            title="Mark paid"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(t)}
                          className="text-xs text-primary hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Transfer Dialog */}
      <Dialog open={newOpen} onOpenChange={(o) => { setNewOpen(o); if (!o) resetForm() }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Transfer</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={selectedPlanId} onValueChange={(v) => { setSelectedPlanId(v); setSelectedGameId(''); setSelectedAssignmentId('') }} required>
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.team} · {p.season}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedPlanId && (
              <div className="space-y-1.5">
                <Label>Game</Label>
                <Select value={selectedGameId} onValueChange={(v) => { setSelectedGameId(v); setSelectedAssignmentId('') }} required>
                  <SelectTrigger><SelectValue placeholder="Select game" /></SelectTrigger>
                  <SelectContent>
                    {(selectedPlan?.games ?? []).map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.homeAway === 'HOME' ? 'vs' : '@'} {g.opponent} · {formatShortDate(g.gameDate)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedGameId && (
              <div className="space-y-1.5">
                <Label>Assignment to transfer</Label>
                <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId} required>
                  <SelectTrigger><SelectValue placeholder="Select assignment" /></SelectTrigger>
                  <SelectContent>
                    {assignableAssignments.length === 0 ? (
                      <SelectItem value="_none" disabled>No assignable tickets</SelectItem>
                    ) : assignableAssignments.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.user.name}{a.seatLabel ? ` (Seat ${a.seatLabel})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Transfer to</Label>
              <Select value={toUserId} onValueChange={setToUserId} required>
                <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input id="price" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="pl-7" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Payment method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Note (optional)</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any notes…" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setNewOpen(false); resetForm() }}>Cancel</Button>
              <Button type="submit" disabled={submitLoading || !selectedAssignmentId || !toUserId}>
                {submitLoading ? 'Creating…' : 'Create Transfer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Transfer Dialog */}
      <Dialog open={!!editTransfer} onOpenChange={(o) => { if (!o) { setEditTransfer(null); resetForm() } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Transfer</DialogTitle></DialogHeader>
          {editTransfer && (
            <form onSubmit={handleUpdateTransfer} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Payment status</Label>
                <Select value={editTransfer.paymentStatus} onValueChange={(v) => setEditTransfer((t) => t ? { ...t, paymentStatus: v as Transfer['paymentStatus'] } : t)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="WAIVED">Waived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="editPrice">Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input id="editPrice" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="pl-7" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editNote">Note</Label>
                <Input id="editNote" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setEditTransfer(null); resetForm() }}>Cancel</Button>
                <Button type="submit" disabled={submitLoading}>{submitLoading ? 'Saving…' : 'Save'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PaymentBadge({ status }: { status: string }) {
  if (status === 'PAID') return <Badge variant="success">Paid</Badge>
  if (status === 'WAIVED') return <Badge variant="secondary">Waived</Badge>
  return <Badge variant="warning">Pending</Badge>
}
