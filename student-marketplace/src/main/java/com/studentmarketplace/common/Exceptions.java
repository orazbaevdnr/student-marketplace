package com.studentmarketplace.common;

/** Business errors. Each one is turned into an HTTP status by {@link GlobalExceptionHandler}. */
public final class Exceptions {

    private Exceptions() {
    }

    /** 404 */
    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String message) {
            super(message);
        }
    }

    /** 400 */
    public static class BadRequestException extends RuntimeException {
        public BadRequestException(String message) {
            super(message);
        }
    }

    /** 409: the request is valid but conflicts with the current state (for example, item already sold). */
    public static class ConflictException extends RuntimeException {
        public ConflictException(String message) {
            super(message);
        }
    }

    /** 403 */
    public static class ForbiddenException extends RuntimeException {
        public ForbiddenException(String message) {
            super(message);
        }
    }

    /** 401 */
    public static class UnauthorizedException extends RuntimeException {
        public UnauthorizedException(String message) {
            super(message);
        }
    }
}
