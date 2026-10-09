<script setup lang="ts">
import { ref } from 'vue'
import RightDrawer from '../components/common/RightDrawer.vue'
import ListeCollaborateur from '@/components/collaborateur/ListeCollaborateur.vue'
import CallPopup from '@/components/call/CallPopup.vue'

type CallState = {
  collaboratorId: string
  collaboratorName: string
  mode: 'outgoing' | 'incoming'
}

const showRightMenu = ref(false)
const incomingCallerName = ref('Alice Martin')
const incomingCallerId = ref('c1')
const callState = ref<CallState | null>(null)

function simulateIncomingCall() {
  callState.value = {
    collaboratorId: incomingCallerId.value,
    collaboratorName: incomingCallerName.value,
    mode: 'incoming',
  }
}

function acceptIncomingCall() {
  if (!callState.value) {
    callState.value = {
      collaboratorId: incomingCallerId.value,
      collaboratorName: incomingCallerName.value,
      mode: 'outgoing',
    }
    return
  }

  callState.value = {
    collaboratorId: callState.value.collaboratorId,
    collaboratorName: callState.value.collaboratorName,
    mode: 'outgoing',
  }
}

function refuseIncomingCall() {
  callState.value = null
}

function endCall() {
  callState.value = null
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
      :call-state="callState"
      document-id="1"
      @update:callState="callState = $event"
    />
  </RightDrawer>

  <CallPopup
    :call-state="callState"
    @accept="acceptIncomingCall"
    @refuse="refuseIncomingCall"
    @end="endCall"
  />
</template>