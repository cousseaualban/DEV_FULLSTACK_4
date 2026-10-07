<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import BaseModal from '../common/BaseModal.vue'
import {
  collaboratorService,
  type Collaborator,
  type UserSearchResult,
} from '../../services/collaboratorService'

const props = withDefaults(
  defineProps<{
    open: boolean
    alreadyInvitedUserIds?: string[]
  }>(),
  {
    alreadyInvitedUserIds: () => [],
  }
)

const emit = defineEmits<{
  close: []
  invite: [collaborators: Collaborator[]]
}>()

const selectedUsers = ref<string[]>([])
const users = ref<UserSearchResult[]>([])
const searchQuery = ref('')

const availableUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return users.value.filter((user) => {
    const alreadyInvited = props.alreadyInvitedUserIds.includes(user.id)

    if (alreadyInvited) {
      return false
    }

    if (!query) {
      return true
    }

    const searchableText = `${user.name} ${user.email}`.toLowerCase()
    return searchableText.includes(query)
  })
})

onMounted(async () => {
  users.value = await collaboratorService.searchUsers('')
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      selectedUsers.value = []
      searchQuery.value = ''
    }
  }
)

function closeModal() {
  selectedUsers.value = []
  searchQuery.value = ''
  emit('close')
}

async function inviteCollaborator() {
  const toInvite = [...new Set(selectedUsers.value)]

  if (!toInvite.length) {
    return
  }

  const invitedCollaborators = await Promise.all(
    toInvite.map((userId) => collaboratorService.inviteCollaborator(userId))
  )

  emit('invite', invitedCollaborators)
  selectedUsers.value = []
  searchQuery.value = ''
}
</script>

<template>
  <BaseModal
    :open="open"
    title="Inviter un collaborateur"
    @close="closeModal"
  >
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="block text-slate-700">
          Collaborateurs
        </label>

        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un collaborateur"
          class="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-800"
        >

        <div class="max-h-52 space-y-2 overflow-y-auto rounded border border-slate-200 bg-slate-50 p-2">
          <template v-if="availableUsers.length">
            <label
              v-for="user in availableUsers"
              :key="user.id"
              class="flex cursor-pointer items-center gap-3 rounded border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50"
            >
              <input
                :value="user.id"
                v-model="selectedUsers"
                type="checkbox"
                class="h-4 w-4"
              >

              <span class="flex-1 text-slate-700">
                {{ user.name }}
              </span>
            </label>
          </template>

          <p
            v-else
            class="px-2 py-3 text-slate-500"
          >
            Aucun collaborateur disponible.
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-100"
        @click="closeModal"
      >
        Annuler
      </button>

      <button
        type="button"
        :disabled="!selectedUsers.length"
        class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        @click="inviteCollaborator"
      >
        Inviter
      </button>
    </template>
  </BaseModal>
</template>