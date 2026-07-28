import { useId, useMemo, useState } from 'react'
import { updateAttachment } from '../../../api/catalog'
import type { AttachmentResponse } from '../../../api/catalog'
import { CatalogModal } from '../../../components/CatalogModal'
import {
  FieldFeedback,
  getFieldAriaProps,
  getFieldFeedbackId,
  getFieldInputErrorClass,
  getVisibleFieldError,
} from '../../../components/FormField'
import { useCatalogFormErrors } from '../../../hooks/useCatalogFormErrors'
import { isBuilderSuccessPayload } from '../../../types/form-errors'
import {
  buildInitialEditValues,
  buildUpdatePayload,
  validateAttachmentEditValues,
  type AttachmentEditFieldErrors,
  type AttachmentEditFormValues,
} from './attachment-form-utils'

type AttachmentEditModalProps = {
  open: boolean
  attachment?: AttachmentResponse
  parentLabel: string
  onClose: () => void
  onSuccess: (attachment: AttachmentResponse) => void
}

export function AttachmentEditModal({
  open,
  attachment,
  parentLabel,
  onClose,
  onSuccess,
}: AttachmentEditModalProps) {
  const formId = useId()
  const [values, setValues] = useState<AttachmentEditFormValues>(() =>
    attachment
      ? buildInitialEditValues(attachment)
      : { documentType: '', documentCode: '', issuedAt: '', expiredAt: '' },
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    fieldErrors,
    formError,
    submitted,
    touchedFields,
    resetFormErrors,
    clearFieldError,
    touchField,
    applyValidationErrors,
    applyApiError,
    applyBuilderResult,
    applyFormError,
  } = useCatalogFormErrors<keyof AttachmentEditFieldErrors>()

  const isDisabled = isSubmitting
  const errorOptions = { fieldErrors, showErrors: submitted, touchedFields }

  function visibleError(field: keyof AttachmentEditFieldErrors): string | null {
    return getVisibleFieldError(field, errorOptions)
  }

  function updateField<K extends keyof AttachmentEditFormValues>(
    field: K,
    value: AttachmentEditFormValues[K],
  ) {
    clearFieldError(field)
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit() {
    if (!attachment) {
      applyFormError('No se encontró el documento a editar.')
      return
    }

    if (applyValidationErrors(validateAttachmentEditValues(values))) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = buildUpdatePayload(values, attachment)
      if (applyBuilderResult(result)) {
        return
      }
      if (!isBuilderSuccessPayload(result)) {
        return
      }

      const updated = await updateAttachment(attachment.id, result.payload)
      onSuccess(updated)
    } catch (caught) {
      applyApiError(caught, {
        entity: 'attachment',
        fallback: 'No se pudo actualizar el documento. Inténtalo de nuevo.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const initialValues = useMemo(
    () =>
      attachment
        ? buildInitialEditValues(attachment)
        : { documentType: '', documentCode: '', issuedAt: '', expiredAt: '' },
    [attachment],
  )
  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [values, initialValues],
  )

  function handleResetAction() {
    setValues(initialValues)
    resetFormErrors()
  }

  const documentCodeError = visibleError('documentCode')
  const issuedAtError = visibleError('issuedAt')
  const expiredAtError = visibleError('expiredAt')

  return (
    <CatalogModal
      open={open}
      title="Editar documento"
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={formError}
      isDirty={isDirty}
      resetActionLabel="Restablecer valores"
      onResetAction={handleResetAction}
    >
      {attachment && (
        <div className="attachments-form__readonly-meta">
          <p>
            <span className="attachments-form__readonly-label">Archivo:</span>
            {attachment.originalFileName}
          </p>
          <p>
            <span className="attachments-form__readonly-label">Vinculado a:</span>
            {parentLabel}
          </p>
        </div>
      )}

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor={`${formId}-documentCode`}>
          Código de documento
        </label>
        <input
          id={`${formId}-documentCode`}
          className={`auth-form__input${getFieldInputErrorClass(documentCodeError)}`}
          type="text"
          name="documentCode"
          value={values.documentCode}
          maxLength={255}
          disabled={isDisabled}
          placeholder="Opcional"
          {...getFieldAriaProps(
            getFieldFeedbackId(formId, 'documentCode'),
            documentCodeError,
          )}
          onBlur={() => touchField('documentCode')}
          onChange={(event) => updateField('documentCode', event.target.value)}
        />
        <FieldFeedback
          id={getFieldFeedbackId(formId, 'documentCode')}
          message={documentCodeError}
        />
      </div>

      <div className="attachments-form__date-row">
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-issuedAt`}>
            Fecha de emisión
          </label>
          <input
            id={`${formId}-issuedAt`}
            className={`auth-form__input${getFieldInputErrorClass(issuedAtError)}`}
            type="date"
            name="issuedAt"
            value={values.issuedAt}
            disabled={isDisabled}
            {...getFieldAriaProps(
              getFieldFeedbackId(formId, 'issuedAt'),
              issuedAtError,
            )}
            onBlur={() => touchField('issuedAt')}
            onChange={(event) => updateField('issuedAt', event.target.value)}
          />
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'issuedAt')}
            message={issuedAtError}
          />
        </div>

        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-expiredAt`}>
            Fecha de caducidad
          </label>
          <input
            id={`${formId}-expiredAt`}
            className={`auth-form__input${getFieldInputErrorClass(expiredAtError)}`}
            type="date"
            name="expiredAt"
            value={values.expiredAt}
            disabled={isDisabled}
            {...getFieldAriaProps(
              getFieldFeedbackId(formId, 'expiredAt'),
              expiredAtError,
            )}
            onBlur={() => touchField('expiredAt')}
            onChange={(event) => updateField('expiredAt', event.target.value)}
          />
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'expiredAt')}
            message={expiredAtError}
          />
        </div>
      </div>
    </CatalogModal>
  )
}
