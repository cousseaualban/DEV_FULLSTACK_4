<script setup lang="ts">
import CallPopup from './components/call/CallPopup.vue'
import { callState, clearCallState, setCallState } from './stores/callStore'

function handleAccept() {
  if (!callState.value) return

  setCallState({
    collaboratorId: callState.value.collaboratorId,
    collaboratorName: callState.value.collaboratorName,
    mode: 'outgoing',
  })
}

function handleRefuse() {
  clearCallState()
}

function handleEnd() {
  clearCallState()
}
</script>

<template>
  <RouterView />
  <CallPopup :callState="callState" @accept="handleAccept" @refuse="handleRefuse" @end="handleEnd" />
</template>