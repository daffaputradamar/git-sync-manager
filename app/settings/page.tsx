"use client"

import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const handleExportData = () => {
    const data = localStorage.getItem("git-sync-manager-data")
    const element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(data || ""))
    element.setAttribute("download", "git-sync-manager-backup.json")
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      localStorage.removeItem("git-sync-manager-data")
      window.location.reload()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" description="Configure application settings" />

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-2xl space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Data Management</h2>
            <div className="space-y-3">
              <Button onClick={handleExportData} variant="outline" className="w-full bg-transparent">
                Export Data as JSON
              </Button>
              <Button
                onClick={handleClearData}
                variant="outline"
                className="w-full text-destructive hover:bg-destructive/10 bg-transparent"
              >
                Clear All Data
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">About</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Git Sync Manager v1.0</p>
              <p>A tool for managing Git repository synchronization between TFS and GitHub</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
