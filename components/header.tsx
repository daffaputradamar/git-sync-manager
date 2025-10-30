"use client"

export function Header({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-border bg-card">
      <div className="px-8 py-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}
