<script setup lang="ts">
import { onMounted, ref } from 'vue'
import InviteCollaboratorModal from '../invitation/InviteCollaboratorModal.vue'
import { collaboratorService, type Collaborator } from '../../services/collaboratorService'

type CallState = {
  collaboratorId: string
  collaboratorName: string
  mode: 'outgoing' | 'incoming'
}

const props = defineProps<{
  callState: CallState | null
}>()

const emit = defineEmits<{
  'update:callState': [state: CallState | null]
}>()

const showInviteModal = ref(false)
const collaborators = ref<Collaborator[]>([])

function openInviteModal() {
  showInviteModal.value = true
}

function callCollaborator(collaboratorId: string) {
  const collaborator = collaborators.value.find((user) => user.id === collaboratorId)

  emit('update:callState', {
    collaboratorId,
    collaboratorName: collaborator?.name ?? 'Collaborateur',
    mode: 'outgoing',
  })
  console.log('Démarrage de l\'appel avec', collaboratorId)
}

function simulateIncomingCall(collaboratorId: string) {
  const collaborator = collaborators.value.find((user) => user.id === collaboratorId)

  emit('update:callState', {
    collaboratorId,
    collaboratorName: collaborator?.name ?? 'Collaborateur',
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

function addCollaborators(newCollaborators: Collaborator[]) {
  collaborators.value = [...collaborators.value, ...newCollaborators]
  showInviteModal.value = false
}

async function removeCollaborator(collaboratorId: string) {
  await collaboratorService.removeCollaborator({
    documentId: 'doc-1',
    collaboratorId,
  })

  collaborators.value = collaborators.value.filter((user) => user.id !== collaboratorId)

  if (props.callState?.collaboratorId === collaboratorId) {
    emit('update:callState', null)
  }
}

onMounted(async () => {
  collaborators.value = await collaboratorService.getCollaboratorsByDocument('doc-1')
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
      :already-invited-user-ids="collaborators.map((user) => user.userId)"
      @close="showInviteModal = false"
      @invite="addCollaborators"
    />

    <div class="mt-4 overflow-hidden rounded-md border border-gray-200">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-100">
            <th class="px-4 py-3 text-left">Nom</th>
            <th class="px-4 py-3 text-left">Email</th>
            <th class="px-4 py-3 text-left">Rôle</th>
            <th class="px-4 py-3 text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="user in collaborators"
            :key="user.id"
            class="border-t border-gray-200"
          >
            <td class="px-4 py-3">
              {{ user.name }}
            </td>

            <td class="px-4 py-3">
              {{ user.email }}
            </td>

            <td class="px-4 py-3">
              {{ user.role }}
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
                  class="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
                  @click="removeCollaborator(user.id)"
                >
                  Supprimer
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
