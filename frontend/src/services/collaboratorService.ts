export type CollaboratorRole = 'owner' | 'editor' | 'viewer'

export type Collaborator = {
  id: string
  userId: string
  name: string
  email: string
  role: CollaboratorRole
  status?: 'pending' | 'active'
  createdAt?: string
  updatedAt?: string
}

export type UserSearchResult = {
  id: string
  name: string
  email: string
}

const mockCollaborators: Collaborator[] = [
  {
    id: 'c1',
    userId: 'u1',
    name: 'Alice Martin',
    email: 'alice@livecampus.fr',
    role: 'owner',
    status: 'active',
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'c2',
    userId: 'u2',
    name: 'Bob Dupont',
    email: 'bob@livecampus.fr',
    role: 'editor',
    status: 'active',
    createdAt: '2026-10-02T14:00:00Z',
    updatedAt: '2026-10-02T14:00:00Z',
  },
  {
    id: 'c3',
    userId: 'u3',
    name: 'Claire Moreau',
    email: 'claire@livecampus.fr',
    role: 'viewer',
    status: 'pending',
    createdAt: '2026-10-03T09:30:00Z',
    updatedAt: '2026-10-03T09:30:00Z',
  },
]

const mockUsers: UserSearchResult[] = [
  { id: 'u1', name: 'Alice Martin', email: 'alice@livecampus.fr' },
  { id: 'u2', name: 'Bob Dupont', email: 'bob@livecampus.fr' },
  { id: 'u3', name: 'Claire Moreau', email: 'claire@livecampus.fr' },
  { id: 'u4', name: 'David Petit', email: 'david@livecampus.fr' },
  { id: 'u5', name: 'Emma Laurent', email: 'emma@livecampus.fr' },
]

function wait<T>(value: T, delay = 300): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), delay)
  })
}

export const collaboratorService = {
  getCollaboratorsByDocument: async (_documentId: string): Promise<Collaborator[]> => {
    return wait([...mockCollaborators])
  },

  searchUsers: async (query: string): Promise<UserSearchResult[]> => {
    const trimmedQuery = query.trim().toLowerCase()

    if (!trimmedQuery) {
      return wait([...mockUsers])
    }

    return wait(
      mockUsers.filter((user) => {
        const label = `${user.name} ${user.email}`.toLowerCase()
        return label.includes(trimmedQuery)
      })
    )
  },

  inviteCollaborator: async (
    userId: string
  ): Promise<Collaborator> => {
    const user = mockUsers.find((item) => item.id === userId)

    if (!user) {
      throw new Error('Utilisateur introuvable')
    }

    const newCollaborator: Collaborator = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      userId,
      name: user.name,
      email: user.email,
      role: 'editor',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    mockCollaborators.push(newCollaborator)

    return wait(newCollaborator)
  },

  updateCollaboratorRole: async ({
    documentId,
    collaboratorId,
    role,
  }: {
    documentId: string
    collaboratorId: string
    role: CollaboratorRole
  }): Promise<Collaborator> => {
    const collaborator = mockCollaborators.find((item) => item.id === collaboratorId)

    if (!collaborator) {
      throw new Error('Collaborateur introuvable')
    }

    collaborator.role = role
    collaborator.updatedAt = new Date().toISOString()

    return wait({ ...collaborator })
  },

  removeCollaborator: async ({
    documentId,
    collaboratorId,
  }: {
    documentId: string
    collaboratorId: string
  }): Promise<void> => {
    const index = mockCollaborators.findIndex((item) => item.id === collaboratorId)

    if (index === -1) {
      throw new Error('Collaborateur introuvable')
    }

    mockCollaborators.splice(index, 1)
    return wait(undefined)
  },
}
