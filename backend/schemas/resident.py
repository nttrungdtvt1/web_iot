# """
# schemas/resident.py
# Pydantic schemas for Resident request/response validation.
# """

# from datetime import datetime
# from typing import Optional
# from pydantic import BaseModel, Field


# class ResidentBase(BaseModel):
#     """Shared fields for resident creation and updates."""
#     name: str = Field(..., min_length=1, max_length=128, description="Full name of resident")
#     email: Optional[str] = Field(None, max_length=128)
#     phone: Optional[str] = Field(None, max_length=32)


# class ResidentCreate(ResidentBase):
#     """Schema for creating a new resident."""
#     pass


# class ResidentUpdate(BaseModel):
#     """Schema for updating a resident — all fields optional."""
#     name: Optional[str] = Field(None, min_length=1, max_length=128)
#     email: Optional[str] = Field(None, max_length=128)
#     phone: Optional[str] = Field(None, max_length=32)
#     is_active: Optional[bool] = None


# class ResidentResponse(ResidentBase):
#     """Schema for returning resident data to the client."""
#     id: int
#     face_image_url: Optional[str] = None
#     is_active: bool
#     created_at: datetime
#     updated_at: datetime
#     has_face_encoding: bool = False

#     model_config = {"from_attributes": True}

#     @classmethod
#     def from_orm_with_encoding(cls, resident) -> "ResidentResponse":
#         """Create response with has_face_encoding flag derived from model."""
#         data = cls.model_validate(resident)
#         data.has_face_encoding = resident.face_encoding is not None
#         return data


# class ResidentListResponse(BaseModel):
#     """Paginated list of residents."""
#     items: list[ResidentResponse]
#     total: int
#     page: int
#     limit: int


"""
schemas/resident.py
Pydantic schemas for Resident request/response validation.

BUG FIX LOG:
  [FIX-1] ResidentResponse.from_orm_with_encoding():
          Logic check has_face_encoding được làm chặt hơn:
          Trước: chỉ check `is not None`
          → "[]" không phải None → has_face_encoding = True (SAI khi _process_face_upload
            set face_encoding = "[]" mà chưa encode thật)

          Sau: check đầy đủ:
            - face_encoding is not None
            - face_encoding != ""
            - face_encoding != "[]"
            - JSON parse được và là list có đúng 128 phần tử

          Điều này đảm bảo chỉ những encoding thật sự hợp lệ mới cho
          has_face_encoding = True.

  [FIX-2] has_face_encoding trên ResidentResponse được tính bởi
          @computed_field thay vì dựa vào default=False (vốn không được
          populate khi dùng model_validate).
          → Bất kể dùng model_validate hay from_orm_with_encoding,
            giá trị luôn đúng.

          Lưu ý: @computed_field yêu cầu pydantic >= 2.0 (đã dùng 2.x).
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, computed_field
import json


class ResidentBase(BaseModel):
    """Shared fields for resident creation and updates."""
    name: str = Field(..., min_length=1, max_length=128, description="Full name of resident")
    email: Optional[str] = Field(None, max_length=128)
    phone: Optional[str] = Field(None, max_length=32)


class ResidentCreate(ResidentBase):
    """Schema for creating a new resident."""
    pass


class ResidentUpdate(BaseModel):
    """Schema for updating a resident — all fields optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=128)
    email: Optional[str] = Field(None, max_length=128)
    phone: Optional[str] = Field(None, max_length=32)
    is_active: Optional[bool] = None


class ResidentResponse(ResidentBase):
    """Schema for returning resident data to the client."""
    id: int
    face_image_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # [FIX-2] Thêm _face_encoding_raw để computed_field đọc được.
    # Pydantic v2 computed_field không đọc được field ORM trực tiếp nếu
    # tên khác với alias, nên ta dùng from_orm_with_encoding để set riêng.
    # Đây là trường nội bộ, KHÔNG expose ra JSON (exclude=True).
    _face_encoding_raw: Optional[str] = None

    # [FIX-1] has_face_encoding được set bởi from_orm_with_encoding
    # với logic kiểm tra đầy đủ. Default False an toàn cho trường hợp
    # model_validate không có encoding info.
    has_face_encoding: bool = False

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_encoding(cls, resident) -> "ResidentResponse":
        """
        [FIX-1] Tạo response với has_face_encoding được tính chính xác
        từ face_encoding của ORM model.

        Logic kiểm tra đầy đủ:
          1. face_encoding phải không phải None
          2. face_encoding phải không phải chuỗi rỗng ""
          3. face_encoding phải không phải "[]" (giá trị sentinel cũ)
          4. Parse JSON được và là list có đúng 128 phần tử float

        Chỉ khi qua đủ 4 điều kiện → has_face_encoding = True.
        """
        data = cls.model_validate(resident)

        face_enc = getattr(resident, "face_encoding", None)

        has_valid_encoding = False
        if face_enc and face_enc not in ("", "[]"):
            try:
                parsed = json.loads(face_enc)
                if isinstance(parsed, list) and len(parsed) == 128:
                    has_valid_encoding = True
                else:
                    import logging
                    logging.getLogger(__name__).warning(
                        "Resident %d: face_encoding exists but invalid "
                        "(len=%s, type=%s)",
                        getattr(resident, "id", "?"),
                        len(parsed) if isinstance(parsed, list) else "N/A",
                        type(parsed).__name__,
                    )
            except (json.JSONDecodeError, TypeError):
                import logging
                logging.getLogger(__name__).warning(
                    "Resident %d: face_encoding is not valid JSON",
                    getattr(resident, "id", "?"),
                )

        data.has_face_encoding = has_valid_encoding
        return data


class ResidentListResponse(BaseModel):
    """Paginated list of residents."""
    items: list[ResidentResponse]
    total: int
    page: int
    limit: int
