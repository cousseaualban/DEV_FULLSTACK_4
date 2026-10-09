
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const router = useRouter()


const login = async () => {
  if (!email.value.trim() || !password.value.trim()) {
    errorMessage.value = 'Les champs ne doivent pas être vides.'
    return
  }

  if (!email.value.includes('@')) {
    errorMessage.value = 'Veuillez saisir une adresse e-mail valide.'
    return
  }

  if (password.value.length < 8) {
    errorMessage.value = 'Le mot de passe doit contenir au minimum 8 caractères.'
    return
  }

  if (!/[A-Z]/.test(password.value)) {
    errorMessage.value = 'Le mot de passe doit contenir au moins une majuscule.'
    return
  }

  if (!/[0-9]/.test(password.value)) {
    errorMessage.value = 'Le mot de passe doit contenir au moins un chiffre.'
    return
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password.value)) {
    errorMessage.value = 'Le mot de passe doit contenir au moins un caractère spécial.'
    return
  }

  errorMessage.value = ''

  try {
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('user', JSON.stringify({
      email: email.value.trim()
    }))

    await router.push('/documents')
  } catch (error) {
    errorMessage.value = 'Une erreur est survenue. Veuillez réessayer.'
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex items-center justify-center px-4">

    <div class="w-full max-w-md">

      <!-- Titre -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-slate-900">
          Connexion
        </h1>

        <p class="mt-2 text-slate-500">
          Connectez-vous à votre espace collaboratif
        </p>
      </div>

      <div class="bg-white rounded-2xl shadow-lg p-8">

        <form class="space-y-5">

          <div>
            <label
              for="email"
              class="block text-sm font-medium text-slate-700 mb-2"
            >
              Adresse e-mail
            </label>

            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="votre@email.com"
              class="w-full px-4 py-3 rounded-lg border border-slate-300
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     focus:border-blue-500"
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-slate-700 mb-2"
            >
              Mot de passe
            </label>

            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Votre mot de passe"
              class="w-full px-4 py-3 rounded-lg border border-slate-300
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     focus:border-blue-500"
            />
          </div>

          <div
            v-if="errorMessage"
            class="flex items-start gap-3 rounded-lg border border-red-200
                   bg-red-50 px-4 py-3"
          >
            <div class="flex-shrink-0 mt-0.5">
              <svg
                class="w-5 h-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01M12 3a9 9 0 110 18 9 9 0 010-18z"
                />
              </svg>
            </div>
            <p class="text-sm font-medium text-red-700">
              {{ errorMessage }}
            </p>
          </div>

          <div class="text-right">
            <a
              href="#"
              class="text-sm text-blue-600 hover:text-blue-700"
            >
              Mot de passe oublié ?
            </a>
          </div>

          <button
            type="button"
            @click="login"
            class="w-full bg-blue-600 text-white py-3 rounded-lg
                   font-medium hover:bg-blue-700 transition"
          >
            Se connecter
          </button>

        </form>

      </div>

    </div>

  </div>
</template>
