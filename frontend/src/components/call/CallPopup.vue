<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

type CallMode = 'outgoing' | 'incoming'

type CallState = {
  collaboratorId: string
  collaboratorName: string
  mode: CallMode
}

const props = defineProps<{
  callState: CallState | null
}>()

const emit = defineEmits<{
  accept: []
  refuse: []
  end: []
}>()

const microphoneStream = ref<MediaStream | null>(null)
const isMicrophoneGranted = ref(false)
const isMicrophoneMuted = ref(false)
const microphoneStatus = ref('')

const isIncoming = computed(() => props.callState?.mode === 'incoming')
const isOngoing = computed(() => props.callState?.mode === 'outgoing')
const label = computed(() => (isIncoming.value ? 'Appel entrant' : 'Appel en cours'))
const accentClass = computed(() => (isIncoming.value ? 'border-violet-200' : 'border-emerald-200'))
const titleColorClass = computed(() => (isIncoming.value ? 'text-violet-600' : 'text-emerald-600'))

watch(
  () => props.callState,
  (newCallState) => {
    if (!newCallState) {
      stopMicrophone()
      return
    }

    if (microphoneStream.value) {
      const audioTrack = microphoneStream.value.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isMicrophoneMuted.value
      }
      return
    }

    microphoneStatus.value = 'Cliquez sur « Autoriser le micro » pour démarrer l’appel.'
  },
  { immediate: true },
)

async function requestMicrophoneAccess() {
  if (!navigator.mediaDevices?.getUserMedia) {
    microphoneStatus.value = 'Ce navigateur ne supporte pas l’accès au micro.'
    return
  }

  if (microphoneStream.value) {
    const audioTrack = microphoneStream.value.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !isMicrophoneMuted.value
    }
    return
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    microphoneStream.value = stream

    const audioTrack = stream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !isMicrophoneMuted.value
    }

    isMicrophoneGranted.value = true
    microphoneStatus.value = isMicrophoneMuted.value ? 'Micro coupé' : 'Micro actif'
  } catch (error) {
    console.error('Erreur d’accès au micro :', error)
    isMicrophoneGranted.value = false

    if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) {
      microphoneStatus.value = 'Accès au micro refusé. Ouvrez les permissions du navigateur et autorisez le micro, puis réessayez.'
      return
    }

    microphoneStatus.value = 'Accès au micro refusé. Autorisez-le dans le navigateur.'
  }
}

function toggleMicrophoneMute() {
  if (!microphoneStream.value) {
    return
  }

  isMicrophoneMuted.value = !isMicrophoneMuted.value
  const audioTrack = microphoneStream.value.getAudioTracks()[0]
  if (audioTrack) {
    audioTrack.enabled = !isMicrophoneMuted.value
  }
  microphoneStatus.value = isMicrophoneMuted.value ? 'Micro coupé' : 'Micro actif'
}

function stopMicrophone() {
  if (microphoneStream.value) {
    microphoneStream.value.getTracks().forEach((track) => track.stop())
  }

  microphoneStream.value = null
  isMicrophoneGranted.value = false
  isMicrophoneMuted.value = false
  microphoneStatus.value = ''
}

async function handleAccept() {
  emit('accept')
  await requestMicrophoneAccess()
}

function handleRefuse() {
  emit('refuse')
}

function handleEnd() {
  emit('end')
}

onBeforeUnmount(() => {
  stopMicrophone()
})
</script>

<template>
  <div
    v-if="props.callState"
    class="fixed bottom-5 left-1/2 z-50 w-[min(90vw,420px)] -translate-x-1/2 rounded-2xl border bg-white p-4 shadow-2xl"
    :class="accentClass"
  >
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.2em]" :class="titleColorClass">
          {{ label }}
        </p>
        <p class="mt-1 text-lg font-semibold text-slate-900">
          {{ props.callState.collaboratorName }}
        </p>
      </div>

      <div v-if="isIncoming" class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          @click="handleAccept"
        >
          Décrocher
        </button>

        <button
          type="button"
          class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          @click="handleRefuse"
        >
          Refuser
        </button>
      </div>

      <button
        v-else
        type="button"
        class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        @click="handleEnd"
      >
        Raccrocher
      </button>
    </div>

    <div class="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
      <span class="text-xs text-slate-600">
        {{ microphoneStatus || 'Micro non autorisé' }}
      </span>

      <button
        v-if="isMicrophoneGranted"
        type="button"
        class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
        @click="toggleMicrophoneMute"
      >
        {{ isMicrophoneMuted ? 'Démuter' : 'Muet' }}
      </button>

      <button
        v-else
        type="button"
        class="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700"
        @click="requestMicrophoneAccess"
      >
        Autoriser le micro
      </button>
    </div>
  </div>
</template>
