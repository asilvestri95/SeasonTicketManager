import { useState, FormEvent } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/PageHeader'
import { toast } from '@/hooks/useToast'

export default function SettingsPage() {
  const { user, login } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.put<User>(`/users/${user!.id}`, {
        ...(name !== user?.name && { name }),
        ...(email !== user?.email && { email }),
        ...(password && { password }),
      })
      toast({ title: 'Settings saved', variant: 'success' })
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div>
      <PageHeader title="Settings" description="Your account settings" />
      <div className="p-6 max-w-md space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profile</CardTitle>
            <CardDescription>Update your name, email, or password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  minLength={8}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your access level in this app</p>
              </div>
              <Badge variant={user.role === 'ADMIN' ? 'info' : 'secondary'}>
                {user.role === 'ADMIN' ? 'Admin' : 'Member'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
