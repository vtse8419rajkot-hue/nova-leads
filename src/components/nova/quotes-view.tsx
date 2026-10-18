"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useI18n } from "@/i18n"
import { toast } from "@/hooks/use-toast"
import {
  api, dateTimeLabel, dateLabel, formatMoneyFull,
  type Quote, type Product, type Lead, type Contact,
} from "./api"
import { EmptyState } from "./ui-bits"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Plus, Trash2, FileText, MessageCircle, Loader2, Send, CheckCircle2, XCircle, Banknote, Receipt,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FormItem {
  name: string
  quantity: string
  unit: string
  price: string
  taxRate: string
}

const QUOTE_STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
  sent: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  partial: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  overdue: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
}

export function QuotesView({
  refreshKey,
  onChanged,
  prefillLead,
  onPrefillConsumed,
}: {
  refreshKey: number
  onChanged: () => void
  prefillLead: Lead | null
  onPrefillConsumed: () => void
}) {
  const { t } = useI18n()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [typeFilter, setTypeFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [detail, setDetail] = useState<Quote | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<Quote[]>("/api/quotes")
      setQuotes(data)
    } catch {
      setQuotes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  // Prefill from lead (Create Quote button in lead detail)
  useEffect(() => {
    if (prefillLead) {
      setCreateOpen(true)
    }
  }, [prefillLead])

  const filtered = quotes.filter((q) => typeFilter === "all" || q.type === typeFilter)

  async function updateStatus(q: Quote, status: string) {
    try {
      await api.patch(`/api/quotes/${q.id}`, { status })
      await load()
      onChanged()
      setDetail(null)
      toast({ title: t("common.saved") })
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  async function markPaid(q: Quote) {
    try {
      await api.patch(`/api/quotes/${q.id}`, { status: "paid", paidAmount: q.total })
      await load()
      onChanged()
      setDetail(null)
      toast({ title: t("common.saved") })
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  async function removeQuote(id: string) {
    try {
      await api.del(`/api/quotes/${id}`)
      await load()
      onChanged()
      setDetail(null)
      toast({ title: t("common.deleted") })
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  function shareWhatsapp(q: Quote) {
    const lines: string[] = []
    lines.push(`*${q.type === "invoice" ? t("quotes.invoice") : t("quotes.quotation")} ${q.quoteNo}*`)
    lines.push(`📅 ${dateLabel(q.createdAt)}`)
    lines.push("")
    for (const it of q.items) {
      lines.push(`• ${it.name} - ${it.quantity} ${it.unit} x ${formatMoneyFull(it.price)} = ${formatMoneyFull(it.amount)}`)
    }
    lines.push("")
    lines.push(`${t("quotes.subtotal")}: ${formatMoneyFull(q.subtotal)}`)
    if (q.taxAmount > 0) lines.push(`${t("quotes.tax")}: ${formatMoneyFull(q.taxAmount)}`)
    if (q.discount > 0) lines.push(`${t("quotes.discount")}: -${formatMoneyFull(q.discount)}`)
    lines.push(`*${t("quotes.total")}: ${formatMoneyFull(q.total)}*`)
    if (q.validUntil) lines.push(`\n${t("quotes.validUntil")}: ${dateLabel(q.validUntil)}`)
    const url = `https://wa.me/91${q.customerPhone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(lines.join("\n"))}`
    window.open(url, "_blank")
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {["all", "quotation", "invoice"].map((tp) => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                typeFilter === tp ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {tp === "all" ? t("common.all") : t(`quotes.${tp}`)}
            </button>
          ))}
        </div>
        <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-7 w-7" />}
          title={t("quotes.noQuotes")}
          desc={t("quotes.noQuotesDesc")}
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="me-2 h-4 w-4" /> {t("quotes.newQuotation")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((q) => (
            <button
              key={q.id}
              onClick={() => setDetail(q)}
              className="block w-full rounded-xl border bg-card p-4 text-start shadow-sm transition-all hover:border-primary/40 active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{q.customerName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {q.quoteNo} · {dateLabel(q.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-primary">{formatMoneyFull(q.total)}</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px]">
                  {q.type === "invoice" ? t("quotes.invoice") : t("quotes.quotation")}
                </Badge>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", QUOTE_STATUS_COLORS[q.status])}>
                  {t(`quotes.${q.status === "paid" ? "paidStatus" : q.status}`)}
                </span>
                <span className="ms-auto text-[10px] text-muted-foreground">
                  {q.items.length} {t("quotes.items").toLowerCase()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="flex max-h-[90dvh] flex-col p-0 sm:max-w-lg">
          {detail && (
            <>
              <DialogHeader className="border-b px-5 py-4">
                <DialogTitle className="flex items-center justify-between">
                  <span>{detail.quoteNo}</span>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", QUOTE_STATUS_COLORS[detail.status])}>
                    {t(`quotes.${detail.status === "paid" ? "paidStatus" : detail.status}`)}
                  </span>
                </DialogTitle>
              </DialogHeader>
              <div className="nova-scroll flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div className="rounded-xl border bg-card p-3 text-sm">
                  <p className="font-semibold">{detail.customerName}</p>
                  <p className="text-xs text-muted-foreground">{detail.customerPhone}</p>
                  {detail.customerAddress && (
                    <p className="text-xs text-muted-foreground">{detail.customerAddress}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">{t("quotes.items")}</p>
                  {detail.items.map((it) => (
                    <div key={it.id} className="flex items-start justify-between gap-3 rounded-lg border p-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{it.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {it.quantity} {it.unit} × {formatMoneyFull(it.price)} · GST {it.taxRate}%
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold">{formatMoneyFull(it.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1 rounded-xl bg-muted/50 p-3 text-sm">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t("quotes.subtotal")}</span>
                    <span>{formatMoneyFull(detail.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t("quotes.tax")}</span>
                    <span>{formatMoneyFull(detail.taxAmount)}</span>
                  </div>
                  {detail.discount > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t("quotes.discount")}</span>
                      <span>-{formatMoneyFull(detail.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1.5 text-sm font-bold">
                    <span>{t("quotes.total")}</span>
                    <span className="text-primary">{formatMoneyFull(detail.total)}</span>
                  </div>
                  {detail.paidAmount > 0 && (
                    <>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t("quotes.paid")}</span>
                        <span>{formatMoneyFull(detail.paidAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold text-rose-600">
                        <span>{t("quotes.balance")}</span>
                        <span>{formatMoneyFull(detail.total - detail.paidAmount)}</span>
                      </div>
                    </>
                  )}
                </div>
                {detail.validUntil && (
                  <p className="text-xs text-muted-foreground">
                    {t("quotes.validUntil")}: {dateLabel(detail.validUntil)}
                  </p>
                )}
              </div>
              <div className="space-y-2 border-t px-5 py-4 pb-safe">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => updateStatus(detail, "sent")}
                    disabled={detail.status !== "draft"}
                  >
                    <Send className="me-1.5 h-4 w-4" /> {t("quotes.markSent")}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-emerald-600"
                    onClick={() => updateStatus(detail, "accepted")}
                    disabled={detail.status === "accepted" || detail.status === "paid"}
                  >
                    <CheckCircle2 className="me-1.5 h-4 w-4" /> {t("quotes.markAccepted")}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-rose-600"
                    onClick={() => updateStatus(detail, "rejected")}
                    disabled={detail.status === "rejected" || detail.status === "paid"}
                  >
                    <XCircle className="me-1.5 h-4 w-4" /> {t("quotes.markRejected")}
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => markPaid(detail)}
                    disabled={detail.status === "paid"}
                  >
                    <Banknote className="me-1.5 h-4 w-4" /> {t("quotes.markPaid")}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#25D366] text-white hover:bg-[#1fb957]" onClick={() => shareWhatsapp(detail)}>
                    <MessageCircle className="me-2 h-4 w-4" /> {t("quotes.shareWhatsapp")}
                  </Button>
                  <Button variant="outline" size="icon" className="text-destructive" onClick={() => removeQuote(detail.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <QuoteForm
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v)
          if (!v) onPrefillConsumed()
        }}
        prefillLead={prefillLead}
        onSaved={() => {
          load()
          onChanged()
        }}
      />
    </div>
  )
}

function QuoteForm({
  open,
  onOpenChange,
  prefillLead,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  prefillLead: Lead | null
  onSaved: () => void
}) {
  const { t } = useI18n()
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [form, setForm] = useState({
    type: "quotation",
    leadId: "",
    contactId: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    discount: "0",
    notes: "",
    validUntil: "",
  })
  const [items, setItems] = useState<FormItem[]>([{ name: "", quantity: "1", unit: "piece", price: "", taxRate: "18" }])

  useEffect(() => {
    if (open) {
      api.get<Product[]>("/api/products").then(setProducts).catch(() => {})
      api.get<Lead[]>("/api/leads").then((all) => setLeads(all.filter((l) => !["won", "lost"].includes(l.status)))).catch(() => {})
      api.get<Contact[]>("/api/contacts").then(setContacts).catch(() => {})
      if (prefillLead) {
        setForm((f) => ({
          ...f,
          leadId: prefillLead.id,
          customerName: prefillLead.name,
          customerPhone: prefillLead.phone,
          customerAddress: prefillLead.address || prefillLead.city || "",
        }))
      } else {
        setForm({
          type: "quotation", leadId: "", contactId: "", customerName: "", customerPhone: "",
          customerAddress: "", discount: "0", notes: "", validUntil: "",
        })
        setItems([{ name: "", quantity: "1", unit: "piece", price: "", taxRate: "18" }])
      }
    }
  }, [open, prefillLead])

  const calc = (() => {
    let subtotal = 0
    let taxAmount = 0
    for (const it of items) {
      const qty = Number(it.quantity) || 0
      const price = Number(it.price) || 0
      const tax = (Number(it.taxRate) || 0)
      const base = qty * price
      subtotal += base
      taxAmount += (base * tax) / 100
    }
    const discount = Number(form.discount) || 0
    return { subtotal, taxAmount, total: subtotal + taxAmount - discount }
  })()

  function setItem(i: number, k: keyof FormItem, v: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)))
  }

  async function save() {
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      toast({ title: t("quotes.customerName") + " / " + t("quotes.customerPhone") + " " + t("common.required"), variant: "destructive" })
      return
    }
    const validItems = items.filter((it) => it.name.trim() && Number(it.price) > 0)
    if (validItems.length === 0) {
      toast({ title: t("quotes.itemsEmpty"), variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await api.post("/api/quotes", {
        type: form.type,
        leadId: form.leadId || null,
        contactId: form.contactId || null,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerAddress: form.customerAddress || null,
        discount: Number(form.discount) || 0,
        notes: form.notes || null,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
        items: validItems.map((it) => ({
          name: it.name,
          quantity: Number(it.quantity) || 1,
          unit: it.unit,
          price: Number(it.price),
          taxRate: Number(it.taxRate) || 0,
        })),
      })
      toast({ title: t("common.saved") })
      onOpenChange(false)
      onSaved()
    } catch (e) {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>{t("quotes.newQuotation")}</DialogTitle>
        </DialogHeader>
        <div className="nova-scroll flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("quotes.quotation")} / {t("quotes.invoice")}</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quotation">{t("quotes.quotation")}</SelectItem>
                  <SelectItem value="invoice">{t("quotes.invoice")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("quotes.fromLead")}</Label>
              <Select
                value={form.leadId || "none"}
                onValueChange={(v) => {
                  const lead = leads.find((l) => l.id === v)
                  setForm((f) => ({
                    ...f,
                    leadId: v === "none" ? "" : v,
                    contactId: "",
                    customerName: lead?.name || f.customerName,
                    customerPhone: lead?.phone || f.customerPhone,
                    customerAddress: lead?.city || f.customerAddress,
                  }))
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("quotes.customerName")} *</Label>
              <Input value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("quotes.customerPhone")} *</Label>
              <Input type="tel" value={form.customerPhone} onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("quotes.customerAddress")}</Label>
            <Input value={form.customerAddress} onChange={(e) => setForm((f) => ({ ...f, customerAddress: e.target.value }))} />
          </div>

          {/* Items */}
          <div className="space-y-2">
            <Label>{t("quotes.items")} *</Label>
            {items.map((it, i) => (
              <div key={i} className="space-y-2 rounded-xl border p-3">
                <div className="flex gap-2">
                  <Select
                    value="custom"
                    onValueChange={(v) => {
                      const p = products.find((pr) => pr.id === v)
                      if (p) {
                        setItem(i, "name", p.name)
                        setItem(i, "price", String(p.price))
                        setItem(i, "unit", p.unit)
                        setItem(i, "taxRate", String(p.taxRate))
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={t("quotes.selectProduct")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">{t("quotes.customItem")}</SelectItem>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} - {formatMoneyFull(p.price)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {items.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Input
                  className="h-9 text-sm"
                  placeholder={t("quotes.item")}
                  value={it.name}
                  onChange={(e) => setItem(i, "name", e.target.value)}
                />
                <div className="grid grid-cols-4 gap-2">
                  <Input type="number" className="h-9 text-sm" placeholder={t("quotes.quantity")} value={it.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} />
                  <Input type="number" className="h-9 text-sm" placeholder={t("quotes.price")} value={it.price} onChange={(e) => setItem(i, "price", e.target.value)} />
                  <Input type="number" className="h-9 text-sm" placeholder={t("quotes.taxRate")} value={it.taxRate} onChange={(e) => setItem(i, "taxRate", e.target.value)} />
                  <div className="flex h-9 items-center justify-end rounded-md bg-muted px-2 text-xs font-semibold tabular-nums">
                    {formatMoneyFull((Number(it.quantity) || 0) * (Number(it.price) || 0) * (1 + (Number(it.taxRate) || 0) / 100))}
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => setItems((prev) => [...prev, { name: "", quantity: "1", unit: "piece", price: "", taxRate: "18" }])}>
              <Plus className="me-1.5 h-4 w-4" /> {t("quotes.addItem")}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("quotes.discount")}</Label>
              <Input type="number" value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("quotes.validUntil")}</Label>
              <Input type="date" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1 rounded-xl bg-primary/5 p-3 text-sm">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("quotes.subtotal")}</span>
              <span className="tabular-nums">{formatMoneyFull(calc.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("quotes.tax")}</span>
              <span className="tabular-nums">{formatMoneyFull(calc.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-primary/20 pt-1.5 font-bold">
              <span>{t("quotes.total")}</span>
              <span className="tabular-nums text-primary">{formatMoneyFull(calc.total)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("common.notes")}</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-3 border-t px-5 py-4 pb-safe">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button className="flex-1" onClick={save} disabled={saving}>
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t("common.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
