import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react'
import useWebSocket, { ReadyState, type Options } from 'react-use-websocket'

import { WS_CONFIG } from '@/config/websocket'
import type { WSMessage } from '@/types/websocket'
import { useAuth } from '@/contexts/AuthContext'

const WS_URL = import.meta.env.VITE_WS_URL

/* ---------------------------------------
   Context Type
---------------------------------------- */

type WSContextType = {
  sendMessage: <T>(type: WSMessage['type'], payload: T) => void
  lastMessage: WSMessage | null
  connectionState: ReadyState
  isConnected: boolean
}

const WSContext = createContext<WSContextType | null>(null)

/* ---------------------------------------
   Provider
---------------------------------------- */

export const WebSocketProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const heartbeatIntervalRef = useRef<number | null>(null)

  /* ---------------------------------------
     WebSocket Options
  ---------------------------------------- */

  const socketOptions: Options = {
    shouldReconnect: () => isAuthenticated,
    reconnectAttempts: WS_CONFIG.reconnectAttempts,
    reconnectInterval: WS_CONFIG.reconnectInterval,

    onOpen: () => {
      console.log('WebSocket connected')

      // Clear old heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }

      // Start heartbeat
      heartbeatIntervalRef.current = window.setInterval(() => {
        sendJsonMessage({
          type: 'PING',
          payload: {},
          timestamp: Date.now(),
        })
      }, WS_CONFIG.heartbeatInterval)
    },

    onClose: () => {
      console.log('WebSocket disconnected')

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
    },

    onError: (error) => {
      console.error('WebSocket error:', error)
    },
  }

  /* ---------------------------------------
     WebSocket Hook (Strongly Typed)
  ---------------------------------------- */

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket<WSMessage>(
    isAuthenticated ? WS_URL : null,
    socketOptions,
  )

  /* ---------------------------------------
     Cleanup on Unmount
  ---------------------------------------- */

  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [])

  /* ---------------------------------------
     Send Message Wrapper
  ---------------------------------------- */

  const sendMessage = useCallback(
    <T,>(type: WSMessage['type'], payload: T) => {
      if (readyState === ReadyState.OPEN) {
        sendJsonMessage({
          type,
          payload,
          timestamp: Date.now(),
        })
      } else {
        console.warn('WebSocket is not connected. Message not sent:', type)
      }
    },
    [sendJsonMessage, readyState],
  )

  /* ---------------------------------------
     Context Provider
  ---------------------------------------- */

  return (
    <WSContext.Provider
      value={{
        sendMessage,
        lastMessage: lastJsonMessage ?? null,
        connectionState: readyState,
        isConnected: readyState === ReadyState.OPEN,
      }}
    >
      {children}
    </WSContext.Provider>
  )
}

/* ---------------------------------------
   Hook
---------------------------------------- */

export const useWebSocketContext = (): WSContextType => {
  const ctx = useContext(WSContext)

  if (!ctx) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider')
  }

  return ctx
}
