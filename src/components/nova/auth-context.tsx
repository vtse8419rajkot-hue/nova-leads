"use client"

import { createContext, useContext } from "react"
import type { Account } from "./api"

type AuthCtx = {
  account: Account
  onAccountChange: (a: Account) => void
}

export const AuthContext = createContext<AuthCtx>({
  account: null as unknown as Account,
  onAccountChange: () => {},
})

export function useAuth(): AuthCtx {
  return useContext(AuthContext)
}
