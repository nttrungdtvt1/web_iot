/**
 * hooks/useAuth.js
 * Authentication hook — login, logout, current user state.
 * Persists JWT token in localStorage.
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/apiClient'

export function useAuth() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Login with username + password using OAuth2 form flow.
   * Stores token and user in localStorage on success.
   */
  const login = useCallback(async (username, password) => {
    setLoading(true)
    setError(null)

    try {
      // OAuth2 password flow requires form-encoded body
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)

      const { data } = await apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user', JSON.stringify({
        username: data.username,
        is_superuser: data.is_superuser,
      }))

      navigate('/')
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed. Check credentials.'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  /**
   * Logout: clear stored credentials and redirect to login.
   */
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      navigate('/login')
    }
  }, [navigate])

  /**
   * Get the current logged-in user from localStorage.
   */
  const getUser = useCallback(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

  /**
   * Check if user is currently authenticated (has a stored token).
   */
  const isAuthenticated = useCallback(() => {
    return !!localStorage.getItem('access_token')
  }, [])

  return { login, logout, getUser, isAuthenticated, loading, error }
}
