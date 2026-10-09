<script setup lang="ts">
import { onMounted, ref } from 'vue'
import InviteCollaboratorModal from '../invitation/InviteCollaboratorModal.vue'
import { collaboratorService, type UserWithRole } from '../../services/collaboratorService'

type CallState = {
  collaboratorId: string
  collaboratorName: string
  mode: 'outgoing' | 'incoming'
}

const props = withDefaults(
  defineProps<{
    callState: CallState | null
    documentId?: string
  }>(),
  {
    documentId: '1',
  }
)

const emit = defineEmits<{
  'update:callState': [state: CallState | null]
}>()

const showInviteModal = ref(false)
const usersWithRole = ref<UserWithRole[]>([])

async function refreshCollaborators() {
  usersWithRole.value = await collaboratorService.getCollaboratorsByDocument(props.documentId)
}

function openInviteModal() {
  showInviteModal.value = true
}

function callCollaborator(collaboratorId: string) {
  const user = usersWithRole.value.find((item) => item.id === collaboratorId)

  emit('update:callState', {
    collaboratorId,
    collaboratorName: user?.name ?? 'Collaborateur',
    mode: 'outgoing',
  })
  console.log('Démarrage de l\'appel avec', collaboratorId)
}

function simulateIncomingCall(collaboratorId: string) {
  const user = usersWithRole.value.find((item) => item.id === collaboratorId)

  emit('update:callState', {
    collaboratorId,
    collaboratorName: user?.name ?? 'Collaborateur',
    mode: 'incoming',
  })
  console.log('Appel entrant simulé avec', collaboratorId)
}

function acceptIncomingCall() {
  if (!props.callState) return

  emit('update:callState', {
    collaboratorId: props.callState.collaboratorId,
    collaboratorName: props.callState.collaboratorName,
    mode: 'outgoing',
  })
}

function cancelCall() {
  emit('update:callState', null)
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

  if (props.callState?.collaboratorId === collaboratorId) {
    emit('update:callState', null)
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
  await refreshCollaborators()
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
                  :disabled="props.callState?.collaboratorId === user.id"
                  @click="callCollaborator(user.id)"
                >
                  {{ props.callState?.collaboratorId === user.id ? 'Appel...' : 'Appeler' }}
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
