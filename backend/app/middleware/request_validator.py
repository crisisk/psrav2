import json
import os
from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from app.core.validation_rules import (
    RequestValidationConfig,
    QueryParamsModel,
    HeaderModel,
    MultipartFormModel,
    validate_json_depth,
    validate_array_lengths,
    MAX_JSON_DEPTH,
    MAX_ARRAY_LENGTH,
    MAX_STRING_LENGTH,
    ALLOWED_FILE_TYPES,
)

class RequestValidatorMiddleware:
    def __init__(self, app):
        self.app = app
        self.config = RequestValidationConfig()

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)

        # 1. Check request body size
        body = await request.body()
        if len(body) > self.config.request_body_max_size:
            await self._send_error(send, "Request body exceeds maximum size")
            return

        # 2. Check header sizes
        headers = dict(request.headers)
        try:
            HeaderModel(headers=headers)
        except ValidationError as e:
            await self._send_error(send, f"Header validation failed: {e}")
            return

        # 3. Validate query parameters
        query_params = dict(request.query_params)
        try:
            QueryParamsModel(**query_params)
        except ValidationError as e:
            await self._send_error(send, f"Query parameter validation failed: {e}")
            return

        # 4. Handle multipart/form-data and file uploads
        if request.headers.get("content-type", "").startswith("multipart/"):
            form = await request.form()
            files = []
            for field_name, field_value in form.items():
                if hasattr(field_value, "filename"):  # It's a file
                    file_size = len(await field_value.read())
                    if file_size > self.config.file_upload_max_size:
                        await self._send_error(send, f"File {field_value.filename} exceeds maximum size")
                        return
                    if field_value.content_type not in ALLOWED_FILE_TYPES:
                        await self._send_error(send, f"File type {field_value.content_type} not allowed")
                        return
                    files.append({"name": field_name, "size": file_size, "type": field_value.content_type})
            try:
                MultipartFormModel(files=files, **{k: v for k, v in form.items() if not hasattr(v, "filename")})
            except ValidationError as e:
                await self._send_error(send, f"Multipart form validation failed: {e}")
                return

        # 5. For JSON requests, validate depth and arrays
        if request.headers.get("content-type") == "application/json":
            try:
                json_data = json.loads(body.decode())
                validate_json_depth(json_data, max_depth=MAX_JSON_DEPTH)
                validate_array_lengths(json_data, max_length=MAX_ARRAY_LENGTH)
            except (json.JSONDecodeError, ValueError) as e:
                await self._send_error(send, f"JSON validation failed: {e}")
                return

        # Proceed to the next middleware/app
        await self.app(scope, receive, send)

    async def _send_error(self, send, message: str):
        response = JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": message}
        )
        await response(scope=None, receive=None, send=send)

# FastAPI app integration
def add_request_validator(app):
    app.middleware("http")(RequestValidatorMiddleware(app))