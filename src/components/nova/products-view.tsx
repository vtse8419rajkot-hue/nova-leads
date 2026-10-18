"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useI18n } from "@/i18n"
import { toast } from "@/hooks/use-toast"
import { api, formatMoneyFull, type Product } from "./api"
import { EmptyState } from "./ui-bits"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Package, Loader2 } from "lucide-react"

const UNITS = ["piece", "kg", "meter", "hour", "service", "box", "set"]

export function ProductsView({ refreshKey }: { refreshKey: number }) {
  const { t } = useI18n()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", price: "", unit: "piece", hsn: "", taxRate: "18" })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<Product[]>("/api/products")
      setProducts(data)
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  function openAdd() {
    setEditing(null)
    setForm({ name: "", description: "", price: "", unit: "piece", hsn: "", taxRate: "18" })
    setFormOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name, description: p.description || "", price: String(p.price),
      unit: p.unit, hsn: p.hsn || "", taxRate: String(p.taxRate),
    })
    setFormOpen(true)
  }

  async function save() {
    if (!form.name.trim()) {
      toast({ title: t("common.required"), variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, price: Number(form.price) || 0, taxRate: Number(form.taxRate) || 0 }
      if (editing) await api.patch(`/api/products/${editing.id}`, payload)
      else await api.post("/api/products", payload)
      toast({ title: t("common.saved") })
      setFormOpen(false)
      await load()
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    try {
      await api.del(`/api/products/${id}`)
      toast({ title: t("common.deleted") })
      await load()
    } catch {
      toast({ title: t("common.error"), variant: "destructive" })
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={openAdd}>
          <Plus className="me-1.5 h-4 w-4" /> {t("products.addProduct")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-7 w-7" />}
          title={t("products.noProducts")}
          desc={t("products.noProductsDesc")}
          action={
            <Button onClick={openAdd}>
              <Plus className="me-2 h-4 w-4" /> {t("products.addProduct")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {products.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-3 rounded-xl border bg-card p-3.5 shadow-sm">
              <button className="min-w-0 flex-1 text-start" onClick={() => openEdit(p)}>
                <p className="truncate text-sm font-semibold">{p.name}</p>
                {p.description && <p className="line-clamp-1 text-xs text-muted-foreground">{p.description}</p>}
                <p className="mt-1 text-sm font-bold text-primary">
                  {formatMoneyFull(p.price)} <span className="text-[10px] font-normal text-muted-foreground">/ {t(`products.${p.unit}`)}</span>
                </p>
              </button>
              <div className="flex shrink-0 gap-1">
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-primary" onClick={() => openEdit(p)}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-destructive" onClick={() => remove(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t("products.editProduct") : t("products.addProduct")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label>{t("products.name")} *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("products.description")}</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{t("products.price")}</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("products.unit")}</Label>
                <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{t(`products.${u}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("products.taxRate")}</Label>
                <Input type="number" value={form.taxRate} onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("products.hsn")}</Label>
              <Input value={form.hsn} onChange={(e) => setForm((f) => ({ ...f, hsn: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setFormOpen(false)}>{t("common.cancel")}</Button>
              <Button className="flex-1" onClick={save} disabled={saving}>
                {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
