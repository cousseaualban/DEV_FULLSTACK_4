
const API_URL = 'http://localhost:5000/api'

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = localStorage.getItem('token') ?? localStorage.getItem('authToken')
  const headers = new Headers(options.headers)
  const isFormData = options.body instanceof FormData

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    cache: 'no-store',
    headers
  })

  const responseText = await response.text()
  let data: any = {}

  if (responseText) {
    try {
      data = JSON.parse(responseText)
    } catch {
      data = {}
    }
  }

  if (!response.ok) {
    throw new Error(data.message || `Erreur HTTP ${response.status}.`)
  }

  return data
}
