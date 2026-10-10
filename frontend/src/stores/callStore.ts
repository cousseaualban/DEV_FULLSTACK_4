import { ref } from 'vue'

type CallMode = 'outgoing' | 'incoming'

export type CallState = {
  collaboratorId: string
  collaboratorName: string
  mode: CallMode
}

export const callState = ref<CallState | null>(null)

export function setCallState(state: CallState | null) {
  callState.value = state
}

export function clearCallState() {
  callState.value = null
}

export default {
  callState,
  setCallState,
  clearCallState,
}
