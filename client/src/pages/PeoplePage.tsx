import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { User } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import PageHeader from '@/components/PageHeader'
import { toast } from '@/hooks/useToast'
import { Users, Trash2 } from 'lucide-react'

export default function PeoplePage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<User[]>('/users')
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  async function handleRoleChange(userId: string, role: string) {
    const updated = await api.put<User>(`/users/${userId}`, { role })
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    toast({ title: 'Role updated', variant: 'success' })
  }

  async function handleDelete(userId: string) {
    await api.delete(`/users/${userId}`)
    setUsers((prev) => prev.filter((u) => u.id !== userId))
    toast({ title: 'User removed' })
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
        title="People"
        description="Everyone in your ticket group"
      />
      <div className="p-6">
        {users.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-14">
              <Users className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No users yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Joined</th>
                  {currentUser?.role === 'ADMIN' && (
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      {currentUser?.role === 'ADMIN' && u.id !== currentUser.id ? (
                        <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}>
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="MEMBER">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={u.role === 'ADMIN' ? 'info' : 'secondary'}>
                          {u.role === 'ADMIN' ? 'Admin' : 'Member'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    {currentUser?.role === 'ADMIN' && (
                      <td className="px-4 py-3 text-right">
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          To add people, share the app URL and have them register. First user is automatically Admin.
        </p>
      </div>
    </div>
  )
}
