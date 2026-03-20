/**
 * components/ResidentCard.jsx
 * Card displaying resident info, face image, and action buttons.
 */

import { User, Pencil, Trash2, Camera, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function ResidentCard({ resident, onEdit, onDelete, onUploadFace }) {
  return (
    <div className="card flex flex-col gap-4 hover:border-gray-700 transition-colors animate-fade-in">
      {/* Avatar + name */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          {resident.face_image_url ? (
            <img
              src={resident.face_image_url}
              alt={resident.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-gray-700"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
              <User size={24} className="text-gray-600" />
            </div>
          )}

          {/* Active indicator */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-gray-900
              ${resident.is_active ? 'bg-green-400' : 'bg-gray-600'}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{resident.name}</p>
          {resident.email && (
            <p className="text-gray-500 text-xs truncate">{resident.email}</p>
          )}
          {resident.phone && (
            <p className="text-gray-600 text-xs">{resident.phone}</p>
          )}
        </div>
      </div>

      {/* Face encoding status */}
      <div className="flex items-center gap-1.5 text-xs">
        {resident.has_face_encoding ? (
          <>
            <CheckCircle size={13} className="text-green-400" />
            <span className="text-green-400">Face encoded</span>
          </>
        ) : (
          <>
            <XCircle size={13} className="text-amber-400" />
            <span className="text-amber-400">No face data</span>
          </>
        )}
      </div>

      {/* Created date */}
      <p className="text-gray-700 text-xs">
        Added {format(new Date(resident.created_at), 'dd MMM yyyy')}
      </p>

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-gray-800">
        <button
          onClick={onUploadFace}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-blue-400
                     hover:bg-blue-900/30 rounded-lg transition-colors"
          title="Upload face image"
        >
          <Camera size={13} />
          Face
        </button>
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-400
                     hover:bg-gray-800 rounded-lg transition-colors"
          title="Edit resident"
        >
          <Pencil size={13} />
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-red-400
                     hover:bg-red-900/30 rounded-lg transition-colors"
          title="Delete resident"
        >
          <Trash2 size={13} />
          Delete
        </button>
      </div>
    </div>
  )
}
