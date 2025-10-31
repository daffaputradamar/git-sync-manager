"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { updateScheduledJob } from "@/lib/storage-client"
import { Pencil, Check, ChevronsUpDown, X } from "lucide-react"
import type { ScheduledJob, Repository } from "@/lib/types"
import { cn } from "@/lib/utils"

interface EditSchedulerDialogProps {
  job: ScheduledJob
  repositories: Repository[]
  onSuccess?: () => void
  trigger?: React.ReactNode
}

const CRON_PRESETS = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Daily at midnight", value: "0 0 * * *" },
  { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
  { label: "First day of month", value: "0 0 1 * *" },
]

function parseCron(cronExpr: string | undefined): [string, string, string, string, string] {
  if (!cronExpr || typeof cronExpr !== "string") {
    return ["*", "*", "*", "*", "*"]
  }
  const parts = cronExpr.trim().split(/\s+/)
  if (parts.length !== 5) {
    return ["*", "*", "*", "*", "*"]
  }
  return parts as [string, string, string, string, string]
}

function describeCron(cronExpr: string | undefined): string {
  if (!cronExpr || typeof cronExpr !== "string") {
    return "Invalid schedule"
  }
  try {
    const [minute, hour, day, month, weekday] = parseCron(cronExpr)
    
    if (cronExpr === "* * * * *") return "Every minute"
    if (cronExpr === "0 * * * *") return "Every hour"
    if (cronExpr === "0 0 * * *") return "Daily at midnight"
    if (cronExpr === "0 0 * * 0") return "Weekly on Sunday at midnight"
    if (cronExpr === "0 0 1 * *") return "Monthly on the 1st at midnight"
    
    let desc = "At"
    
    if (hour === "*") {
      desc = "Every minute"
    } else if (hour.includes("/")) {
      const divisor = hour.split("/")[1]
      desc = `Every ${divisor} hours`
    } else {
      const h = parseInt(hour)
      desc += ` ${h.toString().padStart(2, "0")}`
    }
    
    if (minute !== "*" && minute !== "0" && hour !== "*") {
      desc += `:${minute.padStart(2, "0")}`
    } else if (hour !== "*") {
      desc += ":00"
    }
    
    if (day !== "*") {
      desc += ` on day ${day}`
    }
    
    if (weekday !== "*") {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      if (weekday.includes("-")) {
        const [start, end] = weekday.split("-").map(d => parseInt(d))
        desc += ` on ${days[start]} through ${days[end]}`
      } else {
        desc += ` on ${days[parseInt(weekday)]}`
      }
    }
    
    return desc
  } catch (error) {
    return "Invalid cron expression"
  }
}

export function EditSchedulerDialog({ job, repositories, onSuccess, trigger }: EditSchedulerDialogProps) {
  const [open, setOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [form, setForm] = useState({
    repositoryIds: job.repositoryIds,
    name: job.name,
    cronExpression: job.cronExpression,
  })
  const [isUpdating, setIsUpdating] = useState(false)

  const [minute, hour, day, month, weekday] = parseCron(form.cronExpression)
  const cronDescription = describeCron(form.cronExpression)

  useEffect(() => {
    if (open) {
      setForm({
        repositoryIds: job.repositoryIds,
        name: job.name,
        cronExpression: job.cronExpression,
      })
    }
  }, [open, job])

  const updateCronPart = (index: number, value: string) => {
    const parts = parseCron(form.cronExpression)
    parts[index] = value
    setForm({ ...form, cronExpression: parts.join(" ") })
  }

  const toggleRepository = (repositoryId: string) => {
    setForm((prev) => ({
      ...prev,
      repositoryIds: prev.repositoryIds.includes(repositoryId)
        ? prev.repositoryIds.filter((id) => id !== repositoryId)
        : [...prev.repositoryIds, repositoryId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.repositoryIds.length === 0 || !form.name.trim() || !form.cronExpression.trim()) return

    setIsUpdating(true)
    try {
      await updateScheduledJob(job.id, {
        repositoryIds: form.repositoryIds,
        name: form.name,
        cronExpression: form.cronExpression,
      })
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to update scheduled job:", error)
      alert("Failed to update scheduled job")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Scheduled Job</DialogTitle>
            <DialogDescription>Update the scheduled synchronization job.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-base font-semibold">Repositories * (Select one or more)</Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={popoverOpen}
                    className="w-full justify-between"
                  >
                    {form.repositoryIds.length > 0
                      ? `${form.repositoryIds.length} repository(ies) selected`
                      : "Select repositories..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search repositories..." />
                    <CommandEmpty>No repositories found.</CommandEmpty>
                    <CommandList>
                      {repositories.map((repo) => (
                        <CommandItem
                          key={repo.id}
                          onSelect={() => {
                            toggleRepository(repo.id)
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              form.repositoryIds.includes(repo.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {repo.name}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {form.repositoryIds.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {form.repositoryIds.map((id) => {
                    const repo = repositories.find((r) => r.id === id)
                    return repo ? (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        {repo.name}
                        <button
                          type="button"
                          onClick={() => toggleRepository(id)}
                          className="hover:opacity-70 ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ) : null
                  })}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-job-name">Job Name *</Label>
              <Input
                id="edit-job-name"
                placeholder="Daily sync"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Schedule</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setForm({ ...form, cronExpression: "0 0 * * *" })}
                >
                  Reset
                </Button>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-minute" className="text-xs text-muted-foreground">
                    Minute
                  </Label>
                  <Input
                    id="edit-minute"
                    value={minute}
                    onChange={(e) => updateCronPart(0, e.target.value)}
                    className="font-mono text-sm h-9"
                    placeholder="*"
                  />
                  <p className="text-[10px] text-muted-foreground">0-59</p>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-hour" className="text-xs text-muted-foreground">
                    Hour
                  </Label>
                  <Input
                    id="edit-hour"
                    value={hour}
                    onChange={(e) => updateCronPart(1, e.target.value)}
                    className="font-mono text-sm h-9"
                    placeholder="*"
                  />
                  <p className="text-[10px] text-muted-foreground">0-23</p>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-day" className="text-xs text-muted-foreground">
                    Day
                  </Label>
                  <Input
                    id="edit-day"
                    value={day}
                    onChange={(e) => updateCronPart(2, e.target.value)}
                    className="font-mono text-sm h-9"
                    placeholder="*"
                  />
                  <p className="text-[10px] text-muted-foreground">1-31</p>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-month" className="text-xs text-muted-foreground">
                    Month
                  </Label>
                  <Input
                    id="edit-month"
                    value={month}
                    onChange={(e) => updateCronPart(3, e.target.value)}
                    className="font-mono text-sm h-9"
                    placeholder="*"
                  />
                  <p className="text-[10px] text-muted-foreground">1-12</p>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-weekday" className="text-xs text-muted-foreground">
                    Weekday
                  </Label>
                  <Input
                    id="edit-weekday"
                    value={weekday}
                    onChange={(e) => updateCronPart(4, e.target.value)}
                    className="font-mono text-sm h-9"
                    placeholder="*"
                  />
                  <p className="text-[10px] text-muted-foreground">0-6</p>
                </div>
              </div>
              
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Cron Expression:</span>
                  <code className="font-mono text-sm font-semibold">{form.cronExpression}</code>
                </div>
                <div className="text-sm font-medium text-primary">
                  {cronDescription}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">Quick presets:</Label>
                <div className="grid grid-cols-3 gap-2">
                  {CRON_PRESETS.map((preset) => (
                    <Button
                      key={preset.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm({ ...form, cronExpression: preset.value })}
                      className="justify-start text-xs h-8"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
