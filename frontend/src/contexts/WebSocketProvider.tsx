import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react'
import useWebSocket, { ReadyState, type Options } from 'react-use-websocket'

import { WS_CONFIG } from '@/config/websocket'
import type { WSBaseMessage, WSMessageType } from '@/types/websocket'
import { useAuth } from '@/contexts/AuthContext'

// const WS_URL = import.meta.env.VITE_WS_URL;
const WS_URL = 'ws://localhost:8000/api/v1/ws'

type WSContextType = {
  sendMessage: <T>(type: WSMessageType, payload: T) => void
  lastMessage: WSBaseMessage | null
  connectionState: ReadyState
  isConnected: boolean
}

const WSContext = createContext<WSContextType | null>(null)

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const heartbeatIntervalRef = useRef<number | null>(null)

  const socketOptions: Options = {
    shouldReconnect: () => isAuthenticated,
    reconnectAttempts: WS_CONFIG.reconnectAttempts,
    reconnectInterval: WS_CONFIG.reconnectInterval,

    onOpen: () => {
      console.log('WebSocket connected')

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }

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

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    isAuthenticated ? WS_URL : null,
    socketOptions,
  )

  // Cleanup heartbeat on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [])

  const sendMessage = useCallback(
    <T,>(type: WSMessageType, payload: T) => {
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

  return (
    <WSContext.Provider
      value={{
        sendMessage,
        lastMessage: lastJsonMessage as WSBaseMessage | null,
        connectionState: readyState,
        isConnected: readyState === ReadyState.OPEN,
      }}
    >
      {children}
    </WSContext.Provider>
  )
}

export const useWebSocketContext = (): WSContextType => {
  const ctx = useContext(WSContext)
  if (!ctx) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider')
  }
  return ctx
}
