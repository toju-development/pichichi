"use client";

import { useContext } from "react";

import { SocketContext } from "@/providers/socket-provider";

/**
 * useSocket — accede al socket activo y al estado de conexión.
 *
 * Tira si se usa fuera del `<SocketProvider>` (mismo contrato que mobile).
 */
export function useSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used within a <SocketProvider>");
  }

  return context;
}
