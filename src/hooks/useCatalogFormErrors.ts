import { useCallback, useState } from 'react'
import {
  getCatalogFormErrorState,
  type CatalogEntity,
} from '../api/catalog'
import type { FieldErrors } from '../types/form-errors'
import {
  hasFieldErrors,
  isBuilderFieldErrorResult,
  isBuilderFormErrorResult,
} from '../types/form-errors'

type ApplyApiErrorOptions = {
  entity?: CatalogEntity
  fallback?: string
}

export function useCatalogFormErrors<T extends string>() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<T>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<T, boolean>>
  >({})

  const resetFormErrors = useCallback(() => {
    setFieldErrors({})
    setFormError(null)
    setSubmitted(false)
    setTouchedFields({})
  }, [])

  const clearFieldError = useCallback((field: T) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current
      }

      const next = { ...current }
      delete next[field]
      return next
    })
  }, [])

  const touchField = useCallback((field: T) => {
    setTouchedFields((current) => ({ ...current, [field]: true }))
    clearFieldError(field)
  }, [clearFieldError])

  const applyValidationErrors = useCallback((errors: FieldErrors<T>) => {
    setSubmitted(true)

    if (hasFieldErrors(errors)) {
      setFieldErrors(errors)
      setFormError(null)
      return true
    }

    setFieldErrors({})
    return false
  }, [])

  const applyFormError = useCallback((message: string) => {
    setSubmitted(true)
    setFieldErrors({})
    setFormError(message)
  }, [])

  const applyApiError = useCallback(
    (error: unknown, options?: ApplyApiErrorOptions) => {
      const { fieldErrors: apiFieldErrors, formError: apiFormError } =
        getCatalogFormErrorState(error, options)

      setSubmitted(true)

      if (hasFieldErrors(apiFieldErrors)) {
        setFieldErrors(apiFieldErrors as FieldErrors<T>)
        setFormError(null)
        return
      }

      setFieldErrors({})
      setFormError(apiFormError)
    },
    [],
  )

  const applyBuilderResult = useCallback((result: unknown): boolean => {
    if (isBuilderFieldErrorResult<T>(result)) {
      return applyValidationErrors(result.fieldErrors)
    }

    if (isBuilderFormErrorResult(result)) {
      applyFormError(result.error)
      return true
    }

    return false
  }, [applyFormError, applyValidationErrors])

  const retainFieldErrors = useCallback((allowedFields: Set<T>) => {
    setFieldErrors((current) => {
      const next: FieldErrors<T> = {}

      for (const field of allowedFields) {
        if (current[field]) {
          next[field] = current[field]
        }
      }

      return next
    })
  }, [])

  return {
    fieldErrors,
    formError,
    submitted,
    touchedFields,
    resetFormErrors,
    clearFieldError,
    touchField,
    applyValidationErrors,
    applyFormError,
    applyApiError,
    applyBuilderResult,
    retainFieldErrors,
  }
}
