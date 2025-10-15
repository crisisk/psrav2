"""
Global exception handler for FastAPI.
Catches exceptions, logs with request ID, and returns consistent JSON responses.
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import logging
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)

class ErrorResponse(BaseModel):
    error: str
    message: str
    request_id: Optional[str] = None
    details: Optional[dict] = None

def setup_exception_handlers(app: FastAPI):
    """Setup all exception handlers for the FastAPI app"""

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        request_id = getattr(request.state, "request_id", "unknown")
        logger.error(f"Validation error: {exc.errors()} - Request ID: {request_id}")

        # Format validation errors in a user-friendly way
        formatted_errors = format_validation_errors(exc)

        return JSONResponse(
            status_code=422,
            content=ErrorResponse(
                error="ValidationError",
                message="Invalid request data",
                request_id=request_id,
                details=formatted_errors
            ).dict()
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        request_id = getattr(request.state, "request_id", "unknown")
        logger.error(f"HTTP error: {exc.detail} - Request ID: {request_id}")

        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                error="HTTPException",
                message=str(exc.detail) if isinstance(exc.detail, str) else "HTTP error occurred",
                request_id=request_id
            ).dict()
        )

    @app.exception_handler(SQLAlchemyError)
    async def database_exception_handler(request: Request, exc: SQLAlchemyError):
        request_id = getattr(request.state, "request_id", "unknown")
        logger.error(f"Database error: {str(exc)} - Request ID: {request_id}")

        # Don't expose internal database errors in production
        message = "Database operation failed"
        if app.debug:
            message = str(exc)

        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                error="DatabaseError",
                message=message,
                request_id=request_id
            ).dict()
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", "unknown")
        logger.error(f"Unexpected error: {str(exc)} - Request ID: {request_id}", exc_info=True)

        # Don't expose internal errors in production
        message = "Internal server error"
        if app.debug:
            message = str(exc)

        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                error="InternalServerError",
                message=message,
                request_id=request_id
            ).dict()
        )

def format_validation_errors(exc: RequestValidationError) -> dict:
    """
    Formats Pydantic validation errors into user-friendly messages.

    Args:
        exc: The Pydantic validation error

    Returns:
        Dictionary with field names as keys and error messages as values
    """
    formatted_errors = {}

    for error in exc.errors():
        field_path = error["loc"]
        field_name = format_field_path(field_path)
        error_message = format_error_message(error["msg"], field_name, error.get("type"))

        if field_name not in formatted_errors:
            formatted_errors[field_name] = []
        formatted_errors[field_name].append(error_message)

    return formatted_errors

def format_field_path(field_path: tuple) -> str:
    """
    Converts a field path tuple into a user-friendly field name.

    Example: ('body', 'materials', 0, 'hsCode') -> "Materials row 1: HS Code"
    """
    field_name_parts = []

    for part in field_path:
        if part in ('body', '__root__'):
            # Skip these technical parts
            continue
        elif isinstance(part, int):
            field_name_parts.append(f"row {part + 1}")
        else:
            # Convert snake_case to Title Case
            formatted = part.replace("_", " ").title()
            field_name_parts.append(formatted)

    return " ".join(field_name_parts) if field_name_parts else "Field"

def format_error_message(error_msg: str, field_name: str, error_type: str = None) -> str:
    """
    Formats an error message with additional context and hints.

    Args:
        error_msg: The original error message
        field_name: The formatted field name
        error_type: The Pydantic error type

    Returns:
        A user-friendly error message
    """
    # Common error type mappings
    type_hints = {
        "value_error.missing": f"{field_name} is required",
        "type_error.integer": f"{field_name} must be a whole number",
        "type_error.float": f"{field_name} must be a number",
        "value_error.email": f"{field_name} must be a valid email address",
        "value_error.date": f"{field_name} must be a valid date",
        "value_error.datetime": f"{field_name} must be a valid date and time",
        "type_error.none.not_allowed": f"{field_name} cannot be null",
    }

    if error_type and error_type in type_hints:
        return type_hints[error_type]

    # Message-based hints
    if "not a valid integer" in error_msg:
        return f"{field_name} must be a whole number"
    elif "not a valid float" in error_msg or "not a valid number" in error_msg:
        return f"{field_name} must be a number"
    elif "not a valid email" in error_msg:
        return f"{field_name} must be a valid email address"
    elif "not a valid date" in error_msg:
        return f"{field_name} must be a valid date"
    elif "string does not match regex" in error_msg:
        return f"{field_name} contains invalid characters or format"
    elif "ensure this value is greater than" in error_msg:
        return f"{field_name} must be greater than the minimum value"
    elif "ensure this value is less than" in error_msg:
        return f"{field_name} must be less than the maximum value"

    return f"{field_name}: {error_msg}"
