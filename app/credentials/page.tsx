"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { loadData, createCredential, deleteCredential } from "@/lib/storage"
import type { AppData } from "@/lib/types"
import { Trash2, Plus, Eye, EyeOff, Check, X } from "lucide-react"

export default function CredentialsPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [testing, setTesting] = useState<Record<string, boolean>>({})
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({})
  const [form, setForm] = useState({
    name: "",
    type: "github" as "tfs" | "github",
    username: "",
    token: "",
    url: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setData(loadData())
  }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = "Name is required"
    if (!form.username.trim()) newErrors.username = "Username is required"
    if (!form.token.trim()) newErrors.token = "Token is required"
    if (form.type === "tfs" && !form.url.trim()) newErrors.url = "TFS URL is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateCredential = () => {
    if (validateForm()) {
      createCredential(form.name, form.type, form.username, form.token, form.url || undefined)
      setForm({ name: "", type: "github", username: "", token: "", url: "" })
      setShowForm(false)
      setErrors({})
      setData(loadData())
    }
  }

  const handleDeleteCredential = (id: string) => {
    if (confirm("Are you sure you want to delete this credential?")) {
      deleteCredential(id)
      setData(loadData())
    }
  }

  const handleTestCredential = async (credentialId: string) => {
    setTesting({ ...testing, [credentialId]: true })
    // Simulate credential test
    setTimeout(() => {
      const success = Math.random() > 0.3 // 70% success rate
      setTestResults({ ...testResults, [credentialId]: success })
      setTesting({ ...testing, [credentialId]: false })
      // Clear result after 3 seconds
      setTimeout(() => {
        setTestResults({ ...testResults, [credentialId]: null })
      }, 3000)
    }, 1500)
  }

  if (!data) return null

  return (
    <div className="flex flex-col h-full">
      <Header title="Credentials" description="Manage your TFS and GitHub credentials" />

      <div className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          {!showForm ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Credential
            </Button>
          ) : (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Add New Credential</h2>
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Credential name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`w-full px-4 py-2 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.name ? "border-destructive" : "border-border"
                    }`}
                  />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                </div>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "tfs" | "github" })}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="github">GitHub</option>
                  <option value="tfs">TFS</option>
                </select>
                {form.type === "tfs" && (
                  <div>
                    <input
                      type="text"
                      placeholder="TFS URL"
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      className={`w-full px-4 py-2 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.url ? "border-destructive" : "border-border"
                      }`}
                    />
                    {errors.url && <p className="text-xs text-destructive mt-1">{errors.url}</p>}
                  </div>
                )}
                <div>
                  <input
                    type="text"
                    placeholder="Username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className={`w-full px-4 py-2 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.username ? "border-destructive" : "border-border"
                    }`}
                  />
                  {errors.username && <p className="text-xs text-destructive mt-1">{errors.username}</p>}
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Token/Password"
                    value={form.token}
                    onChange={(e) => setForm({ ...form, token: e.target.value })}
                    className={`w-full px-4 py-2 bg-input border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.token ? "border-destructive" : "border-border"
                    }`}
                  />
                  {errors.token && <p className="text-xs text-destructive mt-1">{errors.token}</p>}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateCredential} className="flex-1">
                    Save Credential
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setErrors({})
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.credentials.map((cred) => (
            <Card key={cred.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{cred.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{cred.type}</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDeleteCredential(cred.id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <p className="text-muted-foreground">
                  Username: <span className="text-foreground">{cred.username}</span>
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">Token:</p>
                  <button
                    onClick={() => setShowPasswords({ ...showPasswords, [cred.id]: !showPasswords[cred.id] })}
                    className="text-primary hover:text-primary/80"
                  >
                    {showPasswords[cred.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestCredential(cred.id)}
                disabled={testing[cred.id]}
                className="w-full gap-2"
              >
                {testing[cred.id] ? (
                  <>Testing...</>
                ) : testResults[cred.id] === true ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    Valid
                  </>
                ) : testResults[cred.id] === false ? (
                  <>
                    <X className="w-4 h-4 text-red-400" />
                    Invalid
                  </>
                ) : (
                  "Test Credential"
                )}
              </Button>
            </Card>
          ))}
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
