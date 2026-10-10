import { io, type Socket } from 'socket.io-client'

let collaborationSocket: Socket | null = null

function getAuthToken(): string {
  return localStorage.getItem('token')
    ?? localStorage.getItem('authToken')
    ?? ''
}

export function connectCollaborationSocket(): Socket {
  const token = getAuthToken()

  if (!token) {
    throw new Error('Vous devez être connecté pour collaborer.')
  }

  if (collaborationSocket) {
    if (collaborationSocket.auth?.token !== token) {
      collaborationSocket.auth = { token }
    }

    if (!collaborationSocket.connected) {
      collaborationSocket.connect()
    }

    return collaborationSocket
  }

  collaborationSocket = io('http://localhost:5000', {
    autoConnect: false,
    auth: {
      token
    }
  })

  collaborationSocket.connect()

  return collaborationSocket
}

export function disconnectCollaborationSocket(): void {
  if (collaborationSocket) {
    collaborationSocket.disconnect()
    collaborationSocket = null
  }
}