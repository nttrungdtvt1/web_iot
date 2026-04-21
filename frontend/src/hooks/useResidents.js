/**
 * hooks/useResidents.js
 * React Query hooks for Residents CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient, { enrollResidentFaceFromDashboard } from "../api/apiClient";
import toast from "react-hot-toast";

const QUERY_KEY = "residents";

// ─── Fetch helpers ────────────────────────────────────────────────────────────

const fetchResidents = async ({ page = 1, limit = 20, search = "" } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (search) params.append("search", search);
  const { data } = await apiClient.get(`/residents?${params}`);
  return data;
};

const fetchResident = async (id) => {
  const { data } = await apiClient.get(`/residents/${id}`);
  return data;
};

const createResident = async (body) => {
  const { data } = await apiClient.post("/residents", body);
  return data;
};

const updateResident = async ({ id, ...body }) => {
  const { data } = await apiClient.put(`/residents/${id}`, body);
  return data;
};

const deleteResident = async (id) => {
  await apiClient.delete(`/residents/${id}`);
};

const uploadFaceImage = async ({ id, file }) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post(
    `/residents/${id}/face-image`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
};

/**
 * enrollFaceFn — hàm gọi API đăng ký khuôn mặt từ webcam trình duyệt.
 * @param {{ id: number, images: string[] }} param
 */
const enrollFaceFn = async ({ id, images }) =>
  enrollResidentFaceFromDashboard(id, { images });

// ─── React Query hooks ────────────────────────────────────────────────────────

export function useResidents(params = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => fetchResidents(params),
    staleTime: 30_000,
  });
}

export function useResident(id) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => fetchResident(id),
    enabled: !!id,
  });
}

export function useCreateResident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createResident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Đã thêm cư dân thành công");
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Không thể thêm cư dân");
    },
  });
}

export function useUpdateResident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateResident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Đã cập nhật thông tin cư dân");
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Không thể cập nhật cư dân");
    },
  });
}

export function useDeleteResident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteResident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Đã xóa cư dân");
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Không thể xóa cư dân");
    },
  });
}

export function useUploadFaceImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadFaceImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Tải ảnh khuôn mặt lên thành công");
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || "Tải ảnh thất bại");
    },
  });
}

/**
 * useEnrollResidentFaceFromDashboard
 *
 * Hook useMutation để đăng ký khuôn mặt cư dân từ Camera trình duyệt.
 *
 * Cách dùng:
 *   const enroll = useEnrollResidentFaceFromDashboard();
 *   await enroll.mutateAsync({ id: resident.id, images: capturedBase64Array });
 */
export function useEnrollResidentFaceFromDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enrollFaceFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(
        `Đăng ký khuôn mặt thành công cho ${data.name}! ` +
          "Thiết bị sẽ được đồng bộ trong lần kết nối tiếp theo.",
      );
    },
    onError: (err) => {
      toast.error(
        err.response?.data?.detail ||
          "Đăng ký khuôn mặt thất bại. Vui lòng thử lại.",
      );
    },
  });
}
