/**
 * hooks/useResidents.js
 * React Query hooks for Residents CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/apiClient'
import toast from 'react-hot-toast'

const QUERY_KEY = 'residents'

// ─── Fetch helpers ───────────────────────────────────────────────────────────

const fetchResidents = async ({ page = 1, limit = 20, search = '' } = {}) => {
  const params = new URLSearchParams({ page, limit })
  if (search) params.append('search', search)
  const { data } = await apiClient.get(`/residents?${params}`)
  return data
}

const fetchResident = async (id) => {
  const { data } = await apiClient.get(`/residents/${id}`)
  return data
}

const createResident = async (body) => {
  const { data } = await apiClient.post('/residents', body)
  return data
}

const updateResident = async ({ id, ...body }) => {
  const { data } = await apiClient.put(`/residents/${id}`, body)
  return data
}

const deleteResident = async (id) => {
  await apiClient.delete(`/residents/${id}`)
}

const uploadFaceImage = async ({ id, file }) => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post(`/residents/${id}/face-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// ─── React Query hooks ───────────────────────────────────────────────────────

export function useResidents(params = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => fetchResidents(params),
    staleTime: 30_000,
  })
}

export function useResident(id) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => fetchResident(id),
    enabled: !!id,
  })
}

export function useCreateResident() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createResident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Resident added successfully')
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to create resident')
    },
  })
}

export function useUpdateResident() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateResident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Resident updated')
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to update resident')
    },
  })
}

export function useDeleteResident() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteResident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Resident removed')
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to delete resident')
    },
  })
}

export function useUploadFaceImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadFaceImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      toast.success('Face image uploaded and encoded successfully')
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Face upload failed')
    },
  })
}
