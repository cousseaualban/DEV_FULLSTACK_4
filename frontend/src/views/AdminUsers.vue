
<template>
  <div class="min-h-screen bg-slate-50 px-6 py-8 sm:px-10">
    <div class="mx-auto max-w-7xl">

      <!-- En-tête -->
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">
            Administration des comptes
          </h1>
          <p class="mt-2 text-slate-500">
            Gérez les comptes, les accès et les rôles des utilisateurs.
          </p>
        </div>

        <button
          type="button"
          class="rounded-xl border border-slate-200 bg-white px-4 py-3
                 font-medium text-slate-700 shadow-sm transition
                 hover:bg-slate-100"
          @click="router.push('/documents')"
        >
          Retour aux documents
        </button>
      </div>

      <!-- Message de résultat -->
      <div
        v-if="successMessage"
        class="mb-6 rounded-xl border border-green-200 bg-green-50
               px-4 py-3 text-sm text-green-800"
        role="status"
      >
        {{ successMessage }}
      </div>

      <div
        v-if="errorMessage"
        class="mb-6 rounded-xl border border-red-200 bg-red-50
               px-4 py-3 text-sm text-red-800"
        role="alert"
      >
        {{ errorMessage }}
      </div>

      <!-- Formulaire de création -->
      <section class="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-5 text-xl font-semibold text-slate-900">
          Créer un compte
        </h2>

        <form @submit.prevent="createAccount">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label for="firstName" class="mb-2 block text-sm font-medium text-slate-700">
                Prénom
              </label>
              <input
                id="firstName"
                v-model.trim="newUser.firstName"
                type="text"
                autocomplete="given-name"
                required
                class="w-full rounded-xl border border-slate-200 px-4 py-3
                       outline-none focus:border-blue-500 focus:ring-2
                       focus:ring-blue-100"
                placeholder="Prénom"
              />
            </div>

            <div>
              <label for="lastName" class="mb-2 block text-sm font-medium text-slate-700">
                Nom
              </label>
              <input
                id="lastName"
                v-model.trim="newUser.lastName"
                type="text"
                autocomplete="family-name"
                required
                class="w-full rounded-xl border border-slate-200 px-4 py-3
                       outline-none focus:border-blue-500 focus:ring-2
                       focus:ring-blue-100"
                placeholder="Nom"
              />
            </div>

            <div>
              <label for="email" class="mb-2 block text-sm font-medium text-slate-700">
                Adresse e-mail
              </label>
              <input
                id="email"
                v-model.trim="newUser.email"
                type="email"
                autocomplete="email"
                required
                class="w-full rounded-xl border border-slate-200 px-4 py-3
                       outline-none focus:border-blue-500 focus:ring-2
                       focus:ring-blue-100"
                placeholder="utilisateur@exemple.fr"
              />
            </div>

            <div>
              <label for="password" class="mb-2 block text-sm font-medium text-slate-700">
                Mot de passe
              </label>
              <input
                id="password"
                v-model="newUser.password"
                type="password"
                autocomplete="new-password"
                minlength="8"
                required
                class="w-full rounded-xl border border-slate-200 px-4 py-3
                       outline-none focus:border-blue-500 focus:ring-2
                       focus:ring-blue-100"
                placeholder="8 caractères minimum"
              />
            </div>
          </div>

          <div class="mt-5 flex justify-end">
            <button
              type="submit"
              :disabled="isCreating"
              class="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white
                     shadow-sm transition hover:bg-blue-700
                     disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ isCreating ? 'Création...' : 'Créer le compte' }}
            </button>
          </div>
        </form>
      </section>

      <!-- Liste des comptes -->
      <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">
              Comptes utilisateurs
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              {{ filteredUsers.length }} compte(s) affiché(s)
            </p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <input
              v-model="search"
              type="search"
              aria-label="Rechercher un compte"
              placeholder="Rechercher..."
              class="rounded-xl border border-slate-200 px-4 py-2.5
                     outline-none focus:border-blue-500 focus:ring-2
                     focus:ring-blue-100"
            />

            <button
              type="button"
              :disabled="isLoading"
              class="rounded-xl border border-slate-200 px-4 py-2.5
                     font-medium text-slate-700 transition hover:bg-slate-50
                     disabled:opacity-50"
              @click="loadUsers"
            >
              {{ isLoading ? 'Chargement...' : 'Actualiser' }}
            </button>
          </div>
        </div>

        <div v-if="isLoading" class="p-8 text-center text-slate-500">
          Chargement des comptes...
        </div>

        <div v-else-if="filteredUsers.length === 0" class="p-8 text-center text-slate-500">
          Aucun compte trouvé.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[760px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-600">
              <tr>
                <th class="px-6 py-4 font-semibold">Utilisateur</th>
                <th class="px-6 py-4 font-semibold">Rôle</th>
                <th class="px-6 py-4 font-semibold">Statut</th>
                <th class="px-6 py-4 font-semibold">Créé le</th>
                <th class="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="user in filteredUsers"
                :key="user.id"
                class="hover:bg-slate-50"
              >
                <td class="px-6 py-4">
                  <p class="font-medium text-slate-900">
                    {{ user.firstName }} {{ user.lastName }}
                  </p>
                  <p class="mt-1 text-slate-500">
                    {{ user.email }}
                  </p>
                  <p class="mt-1 text-xs text-slate-400">
                    ID : {{ user.id }}
                  </p>
                </td>

                <td class="px-6 py-4">
                  <select
                    :value="user.role"
                    :disabled="isUpdating(user.id)"
                    :aria-label="`Rôle de ${user.email}`"
                    class="rounded-lg border border-slate-200 bg-white px-3 py-2
                           outline-none focus:border-blue-500
                           disabled:opacity-50"
                    @change="changeRole(user, $event.target.value)"
                  >
                    <option value="USER">Utilisateur</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </td>

                <td class="px-6 py-4">
                  <span
                    class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    :class="user.isBlocked
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'"
                  >
                    {{ user.isBlocked ? 'Bloqué' : 'Actif' }}
                  </span>
                </td>

                <td class="px-6 py-4 text-slate-500">
                  {{ formatDate(user.createdAt) }}
                </td>

                <td class="px-6 py-4">
                  <button
                    type="button"
                    :disabled="isUpdating(user.id)"
                    class="rounded-lg px-3 py-2 font-medium transition
                           disabled:cursor-not-allowed disabled:opacity-50"
                    :class="user.isBlocked
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'"
                    @click="toggleBlocked(user)"
                  >
                    {{ isUpdating(user.id)
                      ? 'Modification...'
                      : user.isBlocked
                        ? 'Débloquer'
                        : 'Bloquer' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiRequest } from '@/services/api'

const router = useRouter()

const users = ref([])
const search = ref('')
const isLoading = ref(false)
const isCreating = ref(false)
const updatingUserIds = ref([])
const successMessage = ref('')
const errorMessage = ref('')

const newUser = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: ''
})

const filteredUsers = computed(() => {
  const term = search.value.trim().toLowerCase()

  if (!term) {
    return users.value
  }

  return users.value.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase()

    return (
      fullName.includes(term) ||
      (user.email || '').toLowerCase().includes(term) ||
      String(user.id).includes(term) ||
      (user.role || '').toLowerCase().includes(term)
    )
  })
})

function isUpdating(userId) {
  return updatingUserIds.value.includes(userId)
}

function showError(message) {
  errorMessage.value = message
  successMessage.value = ''
}

function showSuccess(message) {
  successMessage.value = message
  errorMessage.value = ''
}

async function loadUsers() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await apiRequest('/admin/users')

    users.value = data.users || []
  } catch (error) {
    showError(error.message || 'Impossible de récupérer les comptes.')
  } finally {
    isLoading.value = false
  }
}

async function createAccount() {
  isCreating.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const data = await apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        password: newUser.password
      })
    })

    newUser.firstName = ''
    newUser.lastName = ''
    newUser.email = ''
    newUser.password = ''

    showSuccess(data.message || 'Compte créé avec succès.')

    await loadUsers()
  } catch (error) {
    showError(error.message || 'Impossible de créer le compte.')
  } finally {
    isCreating.value = false
  }
}

async function toggleBlocked(user) {
  const newBlockedStatus = !user.isBlocked

  updatingUserIds.value.push(user.id)
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const data = await apiRequest(`/admin/users/${user.id}/block`, {
      method: 'PUT',
      body: JSON.stringify({
        isBlocked: newBlockedStatus
      })
    })

    const index = users.value.findIndex(item => item.id === user.id)

    if (index !== -1) {
      users.value[index] = {
        ...users.value[index],
        ...data.user
      }
    }

    showSuccess(
      data.message ||
      (newBlockedStatus
        ? 'Utilisateur bloqué avec succès.'
        : 'Utilisateur débloqué avec succès.')
    )
  } catch (error) {
    showError(error.message || 'Impossible de modifier le statut du compte.')
  } finally {
    updatingUserIds.value = updatingUserIds.value.filter(id => id !== user.id)
  }
}

async function changeRole(user, role) {
  if (!['USER', 'ADMIN'].includes(role) || role === user.role) {
    return
  }

  updatingUserIds.value.push(user.id)
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const data = await apiRequest(`/admin/users/${user.id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    })

    const index = users.value.findIndex(item => item.id === user.id)

    if (index !== -1) {
      users.value[index] = {
        ...users.value[index],
        ...data.user
      }
    }

    showSuccess(data.message || 'Rôle utilisateur modifié avec succès.')
  } catch (error) {
    showError(error.message || 'Impossible de modifier le rôle.')
    await loadUsers()
  } finally {
    updatingUserIds.value = updatingUserIds.value.filter(id => id !== user.id)
  }
}

function formatDate(dateValue) {
  if (!dateValue) {
    return '—'
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return 'Date inconnue'
  }

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

onMounted(loadUsers)
</script>
