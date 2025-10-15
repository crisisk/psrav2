import os
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, validator

# Constants (configurable via env vars)
REQUEST_BODY_MAX_SIZE_MB = int(os.getenv("REQUEST_BODY_MAX_SIZE_MB", 10))
FILE_UPLOAD_MAX_SIZE_MB = 100  # Fixed as per requirements
MAX_HEADER_SIZE = 8192  # 8KB per header
MAX_QUERY_PARAM_LENGTH = 1000
MAX_JSON_DEPTH = 10
MAX_ARRAY_LENGTH = 1000
MAX_STRING_LENGTH = 10000
ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"]  # Example; extend as needed

class RequestValidationConfig:
    def __init__(self):
        self.request_body_max_size = REQUEST_BODY_MAX_SIZE_MB * 1024 * 1024
        self.file_upload_max_size = FILE_UPLOAD_MAX_SIZE_MB * 1024 * 1024

# Pydantic Models
class HeaderModel(BaseModel):
    headers: Dict[str, str] = Field(..., max_length=MAX_HEADER_SIZE)

    @validator("headers", each_item=True)
    def validate_header_value(cls, v):
        if len(v) > MAX_STRING_LENGTH:
            raise ValueError(f"Header value exceeds max length {MAX_STRING_LENGTH}")
        return v

class QueryParamsModel(BaseModel):
    class Config:
        extra = "allow"  # Allow arbitrary query params

    @validator("*", pre=True, each_item=True)
    def validate_query_param(cls, v):
        if isinstance(v, str) and len(v) > MAX_QUERY_PARAM_LENGTH:
            raise ValueError(f"Query parameter exceeds max length {MAX_QUERY_PARAM_LENGTH}")
        return v

class FileModel(BaseModel):
    name: str = Field(..., max_length=MAX_STRING_LENGTH)
    size: int
    type: str

class MultipartFormModel(BaseModel):
    files: List[FileModel] = Field(..., max_items=MAX_ARRAY_LENGTH)

    @validator("files", each_item=True)
    def validate_file(cls, v):
        if v.size > FILE_UPLOAD_MAX_SIZE_MB * 1024 * 1024:
            raise ValueError("File size exceeds limit")
        return v

    class Config:
        extra = "allow"  # Allow other form fields

# Custom Validators
def validate_json_depth(data: Any, max_depth: int, current_depth: int = 0):
    if current_depth > max_depth:
        raise ValueError(f"JSON depth exceeds maximum {max_depth}")
    if isinstance(data, dict):
        for value in data.values():
            validate_json_depth(value, max_depth, current_depth + 1)
    elif isinstance(data, list):
        for item in data:
            validate_json_depth(item, max_depth, current_depth + 1)

def validate_array_lengths(data: Any, max_length: int):
    if isinstance(data, list) and len(data) > max_length:
        raise ValueError(f"Array length exceeds maximum {max_length}")
    elif isinstance(data, dict):
        for value in data.values():
            validate_array_lengths(value, max_length)
    elif isinstance(data, list):
        for item in data:
            validate_array_lengths(item, max_length)