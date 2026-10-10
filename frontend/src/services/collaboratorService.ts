export type CollaboratorRole = 'owner' | 'editor' | 'viewer'

export type UserWithRole = {
  id: string
  userId: string
  firstName: string
  lastName: string
  name: string
  email: string
  role: CollaboratorRole
  status?: 'pending' | 'active'
}

export type Collaborator = UserWithRole

export type UserSearchResult = {
  id: string
  name: string
  email: string
}

const DEFAULT_DOCUMENT_ID = String(import.meta.env.VITE_DEFAULT_DOCUMENT_ID ?? '1')

function getAuthToken(): string {
  return localStorage.getItem('token') ?? localStorage.getItem('authToken') ?? ''
}

async function ensureAuthToken(): Promise<string> {
  const existingToken = getAuthToken()

  if (existingToken) {
    return existingToken
  }

  const email = String(import.meta.env.VITE_TEST_EMAIL ?? 'owner-doc@test.fr')
  const password = String(import.meta.env.VITE_TEST_PASSWORD ?? 'MotDePasse123')

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message ?? 'Connexion impossible')
  }

  const token = typeof payload.token === 'string' ? payload.token : ''

  if (!token) {
    throw new Error('Le backend n’a pas renvoyé de token')
  }

  localStorage.setItem('token', token)
  localStorage.setItem('authToken', token)
  return token
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {})
  const token = await ensureAuthToken()

  headers.set('Authorization', `Bearer ${token}`)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`http://localhost:5000/api${path}`, {
    ...options,
    cache: 'no-store',
    headers,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message ?? 'Erreur API')
  }

  return payload as T
}

function mapUserToSearchResult(user: {
  id: number | string
  firstName?: string
  lastName?: string
  email: string
  name?: string
}): UserSearchResult {
  const firstName = user.firstName?.trim() ?? ''
  const lastName = user.lastName?.trim() ?? ''
  const safeName = user.name ?? `${firstName} ${lastName}`.trim()

  return {
    id: String(user.id),
    name: safeName || user.email,
    email: user.email,
  }
}

function mapCollaborator(raw: {
  id: number | string
  userId?: number | string
  firstName?: string
  lastName?: string
  name?: string
  email: string
  role?: CollaboratorRole
  status?: 'pending' | 'active'
  createdAt?: string
  updatedAt?: string
}): Collaborator {
  const firstName = raw.firstName?.trim() ?? ''
  const lastName = raw.lastName?.trim() ?? ''
  const compositeName = raw.name?.trim() || `${firstName} ${lastName}`.trim() || raw.email

  return {
    id: String(raw.id),
    userId: String(raw.userId ?? raw.id),
    firstName,
    lastName,
    name: compositeName,
    email: raw.email,
    role: raw.role ?? 'viewer',
    status: raw.status ?? 'active',
  }
}

export const collaboratorService = {
  getCollaboratorsByDocument: async (documentId = DEFAULT_DOCUMENT_ID): Promise<Collaborator[]> => {
    const response = await apiRequest<{ users?: Array<Record<string, unknown>>; collaborators?: Array<Record<string, unknown>> }>(`/documents/${documentId}/collaborators`)
    const users = response.users ?? response.collaborators ?? []

    if (!Array.isArray(users)) {
      return []
    }

    return users.map((user) =>
      mapCollaborator({
        id: user.id as string | number,
        userId: (user.userId as string | number | undefined) ?? (user.id as string | number),
        firstName: String((user.firstName as string | undefined) ?? ''),
        lastName: String((user.lastName as string | undefined) ?? ''),
        name: String((user.name as string | undefined) ?? ''),
        email: String(user.email ?? ''),
        role: (user.role as CollaboratorRole) ?? 'viewer',
        status: (user.status as 'pending' | 'active') ?? 'active',
      })
    )
  },

  searchUsers: async (query: string): Promise<UserSearchResult[]> => {
    const trimmedQuery = query.trim()
    const response = await apiRequest<{ users?: Array<Record<string, unknown>> }>(`/users?q=${encodeURIComponent(trimmedQuery)}`)
    const users = response.users ?? []

    if (!Array.isArray(users)) {
      return []
    }

    return users.map((user) =>
      mapUserToSearchResult({
        id: user.id as string | number,
        firstName: user.firstName as string | undefined,
        lastName: user.lastName as string | undefined,
        email: String(user.email ?? ''),
        name: user.name as string | undefined,
      })
    )
  },

  inviteCollaborator: async (
    userId: string,
    documentId = DEFAULT_DOCUMENT_ID,
    role: CollaboratorRole = 'editor'
  ): Promise<Collaborator> => {
    const response = await apiRequest<{ permission?: Record<string, unknown> }>(`/documents/${documentId}/permissions/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify({ level: role === 'viewer' ? 'READ' : 'WRITE' }),
    })

    const permission = (response.permission ?? {}) as Record<string, unknown>
    const collaborator = await collaboratorService.getCollaboratorsByDocument(documentId)
    const currentUser = collaborator.find((item) => item.userId === String(userId))

    return mapCollaborator({
      id: String(permission.id ?? currentUser?.id ?? userId),
      userId: String(permission.userId ?? userId),
      name: currentUser?.name ?? 'Utilisateur',
      email: currentUser?.email ?? '',
      role: 'editor',
      status: 'active',
    })
  },

  updateCollaboratorRole: async ({
    documentId = DEFAULT_DOCUMENT_ID,
    collaboratorId,
    role,
  }: {
    documentId?: string
    collaboratorId: string
    role: CollaboratorRole
  }): Promise<Collaborator> => {
    const collaborators = await collaboratorService.getCollaboratorsByDocument(documentId)
    const collaborator = collaborators.find((item) => item.id === collaboratorId)
    const resolvedUserId = collaborator?.userId ?? collaboratorId

    const response = await apiRequest<{ permission?: Record<string, unknown> }>(`/documents/${documentId}/permissions/${encodeURIComponent(resolvedUserId)}`, {
      method: 'PUT',
      body: JSON.stringify({ level: role === 'viewer' ? 'READ' : 'WRITE' }),
    })

    const permission = (response.permission ?? {}) as Record<string, unknown>
    const fallback = collaborator ?? {
      id: collaboratorId,
      userId: resolvedUserId,
      name: 'Collaborateur',
      email: '',
      role,
    }

    return mapCollaborator({
      id: String(permission.id ?? fallback.id),
      userId: String(permission.userId ?? fallback.userId),
      name: fallback.name,
      email: fallback.email,
      role,
      status: 'active',
    })
  },

  removeCollaborator: async ({
    documentId = DEFAULT_DOCUMENT_ID,
    collaboratorId,
  }: {
    documentId?: string
    collaboratorId: string
  }): Promise<void> => {
    const collaborators = await collaboratorService.getCollaboratorsByDocument(documentId)
    const collaborator = collaborators.find((item) => item.id === collaboratorId)
    const resolvedUserId = collaborator?.userId ?? collaboratorId

    await apiRequest(`/documents/${documentId}/permissions/${encodeURIComponent(resolvedUserId)}`, {
      method: 'DELETE',
    })
  },
}
