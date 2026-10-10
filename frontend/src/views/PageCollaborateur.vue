<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import RightDrawer from '../components/common/RightDrawer.vue'
import ListeCollaborateur from '@/components/collaborateur/ListeCollaborateur.vue'
import { collaboratorService } from '../services/collaboratorService'
import { callState, setCallState, clearCallState } from '../stores/callStore'

type CallState = {
  collaboratorId: string
  collaboratorName: string
  mode: 'outgoing' | 'incoming'
}

const route = useRoute()
const currentDocumentId = computed(() => String(route.query.documentId ?? '1'))
const showRightMenu = ref(false)

async function simulateIncomingCall() {
  try {
    const collaborators = await collaboratorService.getCollaboratorsByDocument(currentDocumentId.value)
    const firstCollaborator = collaborators[0]

    if (!firstCollaborator) {
      setCallState({
        collaboratorId: '1',
        collaboratorName: 'Utilisateur connecté',
        mode: 'incoming',
      })
      return
    }

    setCallState({
      collaboratorId: String(firstCollaborator.userId ?? firstCollaborator.id),
      collaboratorName: firstCollaborator.name || firstCollaborator.email || 'Collaborateur',
      mode: 'incoming',
    })
  } catch (error) {
    console.error('Erreur lors de la simulation d’appel entrant :', error)
    setCallState({
      collaboratorId: '1',
      collaboratorName: 'Utilisateur connecté',
      mode: 'incoming',
    })
  }
}

function acceptIncomingCall() {
  if (!callState.value) {
    setCallState({
      collaboratorId: '1',
      collaboratorName: 'Utilisateur connecté',
      mode: 'outgoing',
    })
    return
  }

  setCallState({
    collaboratorId: callState.value.collaboratorId,
    collaboratorName: callState.value.collaboratorName,
    mode: 'outgoing',
  })
}

function refuseIncomingCall() {
  clearCallState()
}

function endCall() {
  clearCallState()
}
</script>

<template>
  <div class="flex items-center gap-3">
    <h1 class="text-2xl font-bold text-slate-900">
      Mon document
    </h1>

    <button
      type="button"
      class="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
      @click="showRightMenu = true"
    >
      Ouvrir le menu
    </button>

    <button
      type="button"
      class="inline-flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2"
      @click="simulateIncomingCall"
    >
      Simuler un appel entrant
    </button>
  </div>

  <RightDrawer
    :open="showRightMenu"
    title="Liste des collaborateurs"
    @close="showRightMenu = false"
  >
    <ListeCollaborateur
      :document-id="currentDocumentId"
    />
  </RightDrawer>

</template>