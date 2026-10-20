"use client"

/**
 * Device-local vault of logged-in accounts (Switch Account).
 * Stores the signed session token per account so the user can hop between
 * business accounts (HelloLeads-style) without retyping passwords.
 * The token is only usable from this device (it IS the session credential).
 */

import type { Account } from "@/components/nova/api"

export interface VaultEntry {
  id: string
  name: string
  email: string
  businessName: string | null
  phone: string | null
  token: string
  savedAt: number
}

const KEY = "nova-account-vault"

export function listVault(): VaultEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as VaultEntry[]
    return Array.isArray(arr) ? arr.filter((e) => e && e.id && e.token) : []
  } catch {
    return []
  }
}

function writeVault(list: VaultEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* storage full / private mode */
  }
}

/** Add or update an account in the vault (after login/signup/switch). */
export function saveToVault(account: Account & { token?: string }) {
  if (!account?.id || !account.token) return
  const list = listVault().filter((e) => e.id !== account.id)
  list.push({
    id: account.id,
    name: account.name,
    email: account.email,
    businessName: account.businessName ?? null,
    phone: account.phone ?? null,
    token: account.token,
    savedAt: Date.now(),
  })
  writeVault(list.slice(-8)) // keep at most 8 accounts on one device
}

export function removeFromVault(id: string) {
  writeVault(listVault().filter((e) => e.id !== id))
}

/** Refresh an entry's profile fields (keeps the stored token). */
export function updateVaultAccount(account: Account) {
  if (!account?.id) return
  writeVault(
    listVault().map((e) =>
      e.id === account.id
        ? { ...e, name: account.name, email: account.email, businessName: account.businessName ?? null, phone: account.phone ?? null }
        : e
    )
  )
}

/** Activate another account: swap session cookie server-side then reload. */
export async function switchToAccount(entry: VaultEntry): Promise<void> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: entry.token }),
  })
  if (!res.ok) {
    // stale token (account deleted / secret rotated) - drop from vault
    removeFromVault(entry.id)
    throw new Error("Session expired. Please login again.")
  }
  saveToVault({ ...(entry as unknown as Account), token: entry.token })
  window.location.reload()
}
