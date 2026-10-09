
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiRequest } from '../services/api'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const twoFactorRequired = ref(false)
const twoFactorCode = ref('')
const twoFactorToken = ref('')
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

  errorMessage.value = ''

  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value
      })
    })

    if (data.twoFactorRequired) {
      twoFactorRequired.value = true
      twoFactorToken.value = data.token
      errorMessage.value = ''
      return
    }

    localStorage.setItem('token', data.token)
    localStorage.setItem('authToken', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    localStorage.setItem('isAuthenticated', 'true')

    sessionStorage.setItem('connexionReussie', 'true')
    await router.push('/documents')
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Une erreur est survenue. Veuillez réessayer.'
  }
}


const loginTwoFactor = async () => {
  errorMessage.value = ''

  if (!/^\d{6}$/.test(twoFactorCode.value)) {
    errorMessage.value = 'Veuillez saisir un code valide à 6 chiffres.'
    return
  }

  try {
    const data = await apiRequest('/auth/2fa/login', {
      method: 'POST',
      body: JSON.stringify({
        token: twoFactorToken.value,
        code: twoFactorCode.value
      })
    })

    localStorage.setItem('token', data.token)
    localStorage.setItem('authToken', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    localStorage.setItem('isAuthenticated', 'true')

    sessionStorage.setItem('connexionReussie', 'true')
    await router.push('/documents')
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Impossible de vérifier le code 2FA.'
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

        <form class="space-y-5" @submit.prevent="twoFactorRequired ? loginTwoFactor() : login()">

          <div v-if="!twoFactorRequired">
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

          <div v-if="twoFactorRequired">
            <p class="mb-4 text-sm text-slate-600">
              Saisissez le code à 6 chiffres affiché dans Microsoft Authenticator.
            </p>

            <label
              for="twoFactorCode"
              class="block text-sm font-medium text-slate-700 mb-2"
            >
              Code de vérification
            </label>

            <input
              id="twoFactorCode"
              v-model="twoFactorCode"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              placeholder="123456"
              class="w-full px-4 py-3 rounded-lg border border-slate-300
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    focus:border-blue-500"
            />
          </div>

          <div v-if="!twoFactorRequired" class="text-right">
            <a
              href="#"
              class="text-sm text-blue-600 hover:text-blue-700"
            >
              Mot de passe oublié ?
            </a>
          </div>

          <button
            type="submit"
            class="w-full bg-blue-600 text-white py-3 rounded-lg
                  font-medium hover:bg-blue-700 transition"
          >
            {{ twoFactorRequired ? 'Vérifier le code' : 'Se connecter' }}
          </button>
        </form>

      </div>

    </div>

  </div>
</template>
