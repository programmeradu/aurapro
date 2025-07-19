"""
🔄 AURA Standardized API Response System
Consistent response formats and error handling for all API endpoints
"""

from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from pydantic import BaseModel
from fastapi import HTTPException
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

# Standard response models
class APIResponse(BaseModel):
    """Standard API response wrapper"""
    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    timestamp: str
    request_id: Optional[str] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class PaginatedResponse(APIResponse):
    """Paginated response for list endpoints"""
    pagination: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    error: Dict[str, Any]
    message: str
    timestamp: str
    request_id: Optional[str] = None

class ValidationErrorResponse(ErrorResponse):
    """Validation error response"""
    validation_errors: List[Dict[str, Any]]

# Response builders
class ResponseBuilder:
    """Builder for standardized API responses"""
    
    @staticmethod
    def success(
        data: Any = None,
        message: str = "Success",
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build successful response"""
        return {
            "success": True,
            "data": data,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "request_id": request_id
        }
    
    @staticmethod
    def paginated_success(
        data: List[Any],
        total: int,
        page: int = 1,
        page_size: int = 50,
        message: str = "Success",
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build paginated successful response"""
        total_pages = (total + page_size - 1) // page_size
        
        return {
            "success": True,
            "data": data,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "request_id": request_id,
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
    
    @staticmethod
    def error(
        message: str,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None,
        status_code: int = 500,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build error response"""
        return {
            "success": False,
            "error": {
                "code": error_code,
                "message": message,
                "details": details or {}
            },
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "request_id": request_id
        }
    
    @staticmethod
    def validation_error(
        message: str,
        validation_errors: List[Dict[str, Any]],
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build validation error response"""
        return {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": message,
                "details": {"validation_errors": validation_errors}
            },
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "request_id": request_id,
            "validation_errors": validation_errors
        }

# Standard error codes
class ErrorCodes:
    """Standard error codes for consistent error handling"""
    
    # Client errors (4xx)
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    INVALID_REQUEST = "INVALID_REQUEST"
    
    # Server errors (5xx)
    INTERNAL_ERROR = "INTERNAL_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    TIMEOUT_ERROR = "TIMEOUT_ERROR"
    
    # Business logic errors
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
    PROCESSING_ERROR = "PROCESSING_ERROR"
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR"

# Exception classes for standardized error handling
class APIException(Exception):
    """Base API exception"""
    def __init__(
        self,
        message: str,
        error_code: str = ErrorCodes.INTERNAL_ERROR,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)

class ValidationException(APIException):
    """Validation error exception"""
    def __init__(
        self,
        message: str,
        validation_errors: List[Dict[str, Any]],
        details: Optional[Dict[str, Any]] = None
    ):
        self.validation_errors = validation_errors
        super().__init__(
            message=message,
            error_code=ErrorCodes.VALIDATION_ERROR,
            status_code=422,
            details=details
        )

class ResourceNotFoundException(APIException):
    """Resource not found exception"""
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            message=f"{resource} with identifier '{identifier}' not found",
            error_code=ErrorCodes.RESOURCE_NOT_FOUND,
            status_code=404,
            details={"resource": resource, "identifier": identifier}
        )

class ExternalAPIException(APIException):
    """External API error exception"""
    def __init__(self, service: str, message: str):
        super().__init__(
            message=f"External API error from {service}: {message}",
            error_code=ErrorCodes.EXTERNAL_API_ERROR,
            status_code=502,
            details={"service": service, "original_message": message}
        )

# Response decorators
def standardize_response(func):
    """Decorator to standardize function responses"""
    async def wrapper(*args, **kwargs):
        try:
            result = await func(*args, **kwargs)
            
            # If result is already a standardized response, return as-is
            if isinstance(result, dict) and "success" in result:
                return result
            
            # Wrap result in standard response
            return ResponseBuilder.success(data=result)
            
        except APIException as e:
            logger.error(f"API Exception in {func.__name__}: {e.message}")
            return ResponseBuilder.error(
                message=e.message,
                error_code=e.error_code,
                details=e.details,
                status_code=e.status_code
            )
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {str(e)}")
            return ResponseBuilder.error(
                message="An unexpected error occurred",
                error_code=ErrorCodes.INTERNAL_ERROR,
                details={"original_error": str(e)}
            )
    
    return wrapper

# FastAPI exception handlers
def create_exception_handlers(app):
    """Create standardized exception handlers for FastAPI app"""
    
    @app.exception_handler(APIException)
    async def api_exception_handler(request, exc: APIException):
        response_data = ResponseBuilder.error(
            message=exc.message,
            error_code=exc.error_code,
            details=exc.details,
            status_code=exc.status_code
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=response_data
        )
    
    @app.exception_handler(ValidationException)
    async def validation_exception_handler(request, exc: ValidationException):
        response_data = ResponseBuilder.validation_error(
            message=exc.message,
            validation_errors=exc.validation_errors
        )
        return JSONResponse(
            status_code=422,
            content=response_data
        )
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request, exc: HTTPException):
        response_data = ResponseBuilder.error(
            message=exc.detail,
            error_code="HTTP_ERROR",
            status_code=exc.status_code
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=response_data
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request, exc: Exception):
        logger.error(f"Unhandled exception: {str(exc)}")
        response_data = ResponseBuilder.error(
            message="An unexpected error occurred",
            error_code=ErrorCodes.INTERNAL_ERROR,
            details={"error": str(exc)} if app.debug else {}
        )
        return JSONResponse(
            status_code=500,
            content=response_data
        )

# Utility functions
def wrap_data(data: Any, message: str = "Success") -> Dict[str, Any]:
    """Quick wrapper for data responses"""
    return ResponseBuilder.success(data=data, message=message)

def wrap_error(message: str, error_code: str = ErrorCodes.INTERNAL_ERROR) -> Dict[str, Any]:
    """Quick wrapper for error responses"""
    return ResponseBuilder.error(message=message, error_code=error_code)

# Export main components
__all__ = [
    'APIResponse',
    'PaginatedResponse', 
    'ErrorResponse',
    'ResponseBuilder',
    'ErrorCodes',
    'APIException',
    'ValidationException',
    'ResourceNotFoundException',
    'ExternalAPIException',
    'standardize_response',
    'create_exception_handlers',
    'wrap_data',
    'wrap_error'
]
