// API helper functions for consistent request validation and response formatting
// These helpers reduce duplication in routes and make the codebase more Zapier-ready

import { getVersionById } from "./lib/registryLookup";

/**
 * Valid deployment environments for promotions and rollbacks
 */
export const VALID_ENVIRONMENTS = ["staging", "production"] as const;
export type ValidEnvironment = (typeof VALID_ENVIRONMENTS)[number];

/**
 * Standard API response shape used across all endpoints
 * This shape is consistent and Zapier-friendly
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string | undefined;
  data?: T | undefined;
}

/**
 * Validation error when a resource is not found
 */
export interface NotFoundError {
  found: false;
  statusCode: 404;
  response: ApiResponse;
}

/**
 * Validation error when input is invalid
 */
export interface BadRequestError {
  found: false;
  statusCode: 400;
  response: ApiResponse;
}

/**
 * Validation success result
 */
export interface ValidationSuccess {
  found: true;
}

export type ValidationResult = ValidationSuccess | NotFoundError | BadRequestError;

/**
 * Validates that a version exists in the registry
 * Returns standardized error response if not found
 */
export function validateVersionExists(versionId: string): ValidationResult {
  const version = getVersionById(versionId);

  if (!version) {
    return {
      found: false,
      statusCode: 404,
      response: {
        success: false,
        message: `Version with ID '${versionId}' not found.`
      }
    };
  }

  return { found: true };
}

/**
 * Validates that an environment parameter is valid (staging or production)
 * Returns standardized error response if invalid
 */
export function validateEnvironment(environment: string): ValidationResult {
  if (!VALID_ENVIRONMENTS.includes(environment as ValidEnvironment)) {
    return {
      found: false,
      statusCode: 400,
      response: {
        success: false,
        message: `Invalid environment '${environment}'. Must be 'staging' or 'production'.`
      }
    };
  }

  return { found: true };
}

/**
 * Creates a success response with data
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  const response: ApiResponse<T> = {
    success: true,
    data
  };

  if (message !== undefined) {
    response.message = message;
  }

  return response;
}

/**
 * Creates an error response
 */
export function errorResponse(message: string, data?: unknown): ApiResponse {
  const response: ApiResponse = {
    success: false,
    message
  };

  if (data !== undefined) {
    response.data = data;
  }

  return response;
}
