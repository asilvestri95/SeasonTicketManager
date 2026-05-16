import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { TicketPlan } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PageHeader from '@/components/PageHeader'
import { SPORTS } from '@/lib/utils'
import { toast } from '@/hooks/useToast'
import { ArrowLeft } from 'lucide-react'

export default function NewPlanPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    sport: '',
    team: '',
    season: new Date().getFullYear().toString(),
    section: '',
    row: '',
    seats: '',
    totalGames: '',
    purchasePrice: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const plan = await api.post<TicketPlan>('/plans', {
        sport: form.sport,
        team: form.team,
        season: form.season,
        section: form.section,
        row: form.row || undefined,
        seats: form.seats,
        totalGames: Number(form.totalGames),
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
      })
      toast({ title: 'Plan created', variant: 'success' })
      navigate(`/plans/${plan.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="New Plan"
        description="Add a new season ticket plan"
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/plans">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </Button>
        }
      />
      <div className="p-6 max-w-lg">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Plan details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Sport</Label>
                  <Select value={form.sport} onValueChange={(v) => set('sport', v)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPORTS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="season">Season</Label>
                  <Input
                    id="season"
                    value={form.season}
                    onChange={(e) => set('season', e.target.value)}
                    placeholder="2024-2025"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="team">Team</Label>
                <Input
                  id="team"
                  value={form.team}
                  onChange={(e) => set('team', e.target.value)}
                  placeholder="e.g. Chicago Bulls"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    value={form.section}
                    onChange={(e) => set('section', e.target.value)}
                    placeholder="112"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="row">Row</Label>
                  <Input
                    id="row"
                    value={form.row}
                    onChange={(e) => set('row', e.target.value)}
                    placeholder="G"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="totalGames">Games</Label>
                  <Input
                    id="totalGames"
                    type="number"
                    min={1}
                    value={form.totalGames}
                    onChange={(e) => set('totalGames', e.target.value)}
                    placeholder="41"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="seats">Seat numbers</Label>
                <Input
                  id="seats"
                  value={form.seats}
                  onChange={(e) => set('seats', e.target.value)}
                  placeholder="1, 2"
                  required
                />
                <p className="text-xs text-muted-foreground">Comma-separated seat numbers</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="purchasePrice">Purchase price (optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    id="purchasePrice"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.purchasePrice}
                    onChange={(e) => set('purchasePrice', e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={loading || !form.sport}>
                  {loading ? 'Creating…' : 'Create Plan'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/plans">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
