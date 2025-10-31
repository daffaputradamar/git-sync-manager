"use client"

import { useState, useEffect, useMemo } from "react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { loadData, deleteCredential } from "@/lib/storage-client"
import type { AppData } from "@/lib/types"
import { Trash2, Eye, EyeOff, Copy, CheckCheck, Pencil, GitBranch } from "lucide-react"
import { CreateCredentialDialog } from "@/components/create-credential-dialog"
import { EditCredentialDialog } from "@/components/edit-credential-dialog"

export default function CredentialsPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadData().then(setData).catch(console.error)
  }, [])

  // Calculate usage count for each credential
  const credentialUsage = useMemo(() => {
    if (!data) return {}
    const usage: Record<string, number> = {}
    
    data.projects.forEach((project) => {
      project.repositories.forEach((repo) => {
        usage[repo.tfsCredentialId] = (usage[repo.tfsCredentialId] || 0) + 1
        usage[repo.githubCredentialId] = (usage[repo.githubCredentialId] || 0) + 1
      })
    })
    
    return usage
  }, [data])

  const refreshData = async () => {
    const updatedData = await loadData()
    setData(updatedData)
  }

  const handleDeleteCredential = async (id: string) => {
    const usageCount = credentialUsage[id] || 0
    
    if (usageCount > 0) {
      alert(`Cannot delete credential. It is being used by ${usageCount} ${usageCount === 1 ? "repository" : "repositories"}.`)
      return
    }
    
    if (confirm("Are you sure you want to delete this credential?")) {
      try {
        await deleteCredential(id)
        const updatedData = await loadData()
        setData(updatedData)
      } catch (error) {
        console.error("Failed to delete credential:", error)
        alert("Failed to delete credential")
      }
    }
  }

  const handleCopyToken = (credId: string, token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedId(credId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (!data) return null

  return (
    <div className="flex flex-col h-full">
      <Header title="Credentials" description="Manage your TFS and GitHub credentials" />

      <div className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <CreateCredentialDialog onSuccess={refreshData} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.credentials.map((cred) => {
            const usageCount = credentialUsage[cred.id] || 0
            return (
              <Card key={cred.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">{cred.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{cred.type}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <GitBranch className="w-3 h-3" />
                      <span>
                        Used by {usageCount} {usageCount === 1 ? "repository" : "repositories"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <EditCredentialDialog credential={cred} onSuccess={refreshData} />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteCredential(cred.id)}
                      className="text-destructive hover:bg-destructive/10"
                      disabled={usageCount > 0}
                      title={usageCount > 0 ? "Cannot delete credential in use" : "Delete credential"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <p className="text-muted-foreground">
                    Username: <span className="text-foreground">{cred.username}</span>
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">Token:</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleCopyToken(cred.id, cred.token)}
                        className="text-primary hover:text-primary/80 p-1"
                        title="Copy token"
                      >
                        {copiedId === cred.id ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setShowPasswords({ ...showPasswords, [cred.id]: !showPasswords[cred.id] })}
                        className="text-primary hover:text-primary/80 p-1"
                        title={showPasswords[cred.id] ? "Hide token" : "Show token"}
                      >
                        {showPasswords[cred.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-foreground font-mono text-xs break-all">
                    {showPasswords[cred.id] ? cred.token : "••••••••••••••••"}
                  </p>
                  {cred.url && (
                    <p className="text-muted-foreground">
                      URL: <span className="text-foreground text-xs break-all">{cred.url}</span>
                    </p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {data.credentials.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No credentials yet. Add one to get started!</p>
          </Card>
        )}
      </div>
    </div>
  )
}
