<script setup lang="ts">
import { onMounted, ref } from 'vue'
import InviteCollaboratorModal from '../invitation/InviteCollaboratorModal.vue'
import { collaboratorService, type UserWithRole } from '../../services/collaboratorService'
import { callState, setCallState, clearCallState } from '../../stores/callStore'

type CallState = {
  collaboratorId: string
  collaboratorName: string
  mode: 'outgoing' | 'incoming'
}

const props = withDefaults(
  defineProps<{
    documentId?: string
  }>(),
  {
    documentId: '1',
  }
)

const showInviteModal = ref(false)
const usersWithRole = ref<UserWithRole[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

async function refreshCollaborators() {
  errorMessage.value = ''
  try {
    usersWithRole.value = await collaboratorService.getCollaboratorsByDocument(props.documentId)
  } catch (err) {
    console.error('Erreur getCollaboratorsByDocument', err)

    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    errorMessage.value = message
    usersWithRole.value = []
  }
}

function openInviteModal() {
  showInviteModal.value = true
}

function callCollaborator(collaboratorId: string) {
  const user = usersWithRole.value.find((item) => item.id === collaboratorId)
  setCallState({
    collaboratorId,
    collaboratorName: user?.name ?? 'Collaborateur',
    mode: 'outgoing',
  })
  console.log('Démarrage de l\'appel avec', collaboratorId)
}

function simulateIncomingCall(collaboratorId: string) {
  const user = usersWithRole.value.find((item) => item.id === collaboratorId)
  setCallState({
    collaboratorId,
    collaboratorName: user?.name ?? 'Collaborateur',
    mode: 'incoming',
  })
  console.log('Appel entrant simulé avec', collaboratorId)
}

function acceptIncomingCall() {
  if (!callState.value) return

  setCallState({
    collaboratorId: callState.value.collaboratorId,
    collaboratorName: callState.value.collaboratorName,
    mode: 'outgoing',
  })
}

function cancelCall() {
  setCallState(null)
}

async function addCollaborators(newCollaborators: UserWithRole[]) {
  if (newCollaborators.length) {
    await refreshCollaborators()
  }
  showInviteModal.value = false
}

async function removeCollaborator(collaboratorId: string) {
  const collaborator = usersWithRole.value.find((user) => user.id === collaboratorId)

  if (collaborator?.role === 'owner') {
    return
  }

  await collaboratorService.removeCollaborator({
    documentId: props.documentId,
    collaboratorId,
  })

  await refreshCollaborators()
  if (callState.value?.collaboratorId === collaboratorId) {
    setCallState(null)
  }
}

async function updateRole(collaboratorId: string, value: string) {
  const collaborator = usersWithRole.value.find((user) => user.id === collaboratorId)

  if (!collaborator || collaborator.role === 'owner') {
    return
  }

  const nextRole = value === 'viewer' ? 'viewer' : 'editor'

  await collaboratorService.updateCollaboratorRole({
    documentId: props.documentId,
    collaboratorId,
    role: nextRole,
  })

  await refreshCollaborators()
}

function getRoleLabel(role: UserWithRole['role']) {
  return role === 'owner' ? 'Propriétaire' : role === 'editor' ? 'Éditeur' : 'Lecteur'
}

onMounted(async () => {
  isLoading.value = true
  try {
    await refreshCollaborators()
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div>
    <button
      type="button"
      class="inline-flex rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      @click="openInviteModal"
    >
      Inviter un collaborateur
    </button>

    <InviteCollaboratorModal
      :open="showInviteModal"
      :document-id="props.documentId"
        :already-invited-user-ids="usersWithRole.map((user) => user.userId)"
      @close="showInviteModal = false"
      @invite="addCollaborators"
    />

      <div v-if="isLoading" class="mt-4 text-sm text-slate-500">Chargement...</div>
      <div v-else-if="errorMessage" class="mt-4 text-sm text-red-600">{{ errorMessage }}</div>

    <div class="mt-4 overflow-hidden rounded-md border border-gray-200">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-100">
            <th class="px-4 py-3 text-left">Prénom</th>
            <th class="px-4 py-3 text-left">Nom</th>
            <th class="px-4 py-3 text-left">Email</th>
            <th class="px-4 py-3 text-left">Rôle</th>
            <th class="px-4 py-3 text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="user in usersWithRole"
            :key="user.id"
            class="border-t border-gray-200"
          >
            <td class="px-4 py-3">
              {{ user.firstName || '—' }}
            </td>

            <td class="px-4 py-3">
              {{ user.lastName || '—' }}
            </td>

            <td class="px-4 py-3">
              {{ user.email }}
            </td>

            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span v-if="user.role === 'owner'" class="font-medium text-slate-700">
                  {{ getRoleLabel(user.role) }}
                </span>

                <select
                  v-else
                  :value="user.role"
                  class="rounded border border-slate-300 bg-white px-2 py-1.5 text-slate-700"
                  @change="updateRole(user.id, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="editor">Éditeur</option>
                  <option value="viewer">Lecteur</option>
                </select>
              </div>
            </td>

            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="rounded bg-green-600 px-3 py-1.5 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
                  :disabled="callState?.collaboratorId === user.id"
                  @click="callCollaborator(user.id)"
                >
                  {{ callState?.collaboratorId === user.id ? 'Appel...' : 'Appeler' }}
                </button>

                <button
                  type="button"
                  :disabled="user.role === 'owner'"
                  class="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                  @click="removeCollaborator(user.id)"
                >
                  {{ user.role === 'owner' ? 'Propriétaire' : 'Supprimer' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
