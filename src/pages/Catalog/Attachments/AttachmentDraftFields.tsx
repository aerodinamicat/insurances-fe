import { useId } from 'react'
import {
  FieldFeedback,
  getFieldAriaProps,
  getFieldFeedbackId,
  getFieldInputErrorClass,
  getVisibleFieldError,
} from '../../../components/FormField'
import {
  ATTACHMENT_DOCUMENT_TYPES,
  FILE_INPUT_ACCEPT,
  type AttachmentDraft,
  type AttachmentDraftFieldErrors,
} from './attachment-draft-utils'
import { getAttachmentDocumentTypeLabel } from './attachment-form-utils'

type AttachmentDraftFieldsProps = {
  draft: AttachmentDraft
  isSubmitting: boolean
  documentTypeOptions?: { code: string; label: string }[]
  lockDocumentType?: boolean
  fieldErrors?: AttachmentDraftFieldErrors
  showErrors?: boolean
  touchedFields?: Partial<Record<keyof AttachmentDraft, boolean>>
  onChange: (draft: AttachmentDraft) => void
  onFieldBlur?: (field: keyof AttachmentDraft) => void
}

export function AttachmentDraftFields({
  draft,
  isSubmitting,
  documentTypeOptions,
  lockDocumentType = false,
  fieldErrors,
  showErrors = false,
  touchedFields,
  onChange,
  onFieldBlur,
}: AttachmentDraftFieldsProps) {
  const formId = useId()
  const options = documentTypeOptions ?? [
    ATTACHMENT_DOCUMENT_TYPES.DNI,
    ATTACHMENT_DOCUMENT_TYPES.NIE,
    ATTACHMENT_DOCUMENT_TYPES.PASSPORT,
    ATTACHMENT_DOCUMENT_TYPES.CIRCULATION_PERMIT,
  ]
  const errorOptions = { fieldErrors, showErrors, touchedFields }

  function visibleError(field: keyof AttachmentDraft): string | null {
    return getVisibleFieldError(field, errorOptions)
  }

  function updateField<K extends keyof AttachmentDraft>(
    field: K,
    value: AttachmentDraft[K],
  ) {
    onChange({ ...draft, [field]: value })
  }

  const documentTypeError = visibleError('documentType')
  const documentTypeFeedbackId = getFieldFeedbackId(formId, 'documentType')
  const documentCodeError = visibleError('documentCode')
  const documentCodeFeedbackId = getFieldFeedbackId(formId, 'documentCode')
  const issuedAtError = visibleError('issuedAt')
  const issuedAtFeedbackId = getFieldFeedbackId(formId, 'issuedAt')
  const expiredAtError = visibleError('expiredAt')
  const expiredAtFeedbackId = getFieldFeedbackId(formId, 'expiredAt')
  const fileError = visibleError('file')
  const fileFeedbackId = getFieldFeedbackId(formId, 'file')

  return (
    <>
      <div className="catalog-form__row">
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-documentType`}>
            Tipo de documento
            <span className="catalog-form__required" aria-hidden="true">
              {' '}
              *
            </span>
          </label>
          {lockDocumentType ? (
            <input
              id={`${formId}-documentType`}
              className="auth-form__input"
              type="text"
              value={getAttachmentDocumentTypeLabel(draft.documentType)}
              disabled
              readOnly
            />
          ) : (
            <select
              id={`${formId}-documentType`}
              className={`auth-form__input catalog-form__select${getFieldInputErrorClass(documentTypeError)}`}
              name="documentType"
              required
              value={draft.documentType}
              disabled={isSubmitting}
              {...getFieldAriaProps(documentTypeFeedbackId, documentTypeError)}
              onBlur={() => onFieldBlur?.('documentType')}
              onChange={(event) =>
                updateField('documentType', event.target.value)
              }
            >
              <option value="">Seleccionar…</option>
              {options.map((documentType) => (
                <option key={documentType.code} value={documentType.code}>
                  {documentType.label}
                </option>
              ))}
            </select>
          )}
          {!lockDocumentType ? (
            <FieldFeedback id={documentTypeFeedbackId} message={documentTypeError} />
          ) : null}
        </div>

        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-documentCode`}>
            Código
            <span className="catalog-form__required" aria-hidden="true">
              {' '}
              *
            </span>
          </label>
          <input
            id={`${formId}-documentCode`}
            className={`auth-form__input${getFieldInputErrorClass(documentCodeError)}`}
            type="text"
            name="documentCode"
            required
            value={draft.documentCode}
            disabled={isSubmitting}
            {...getFieldAriaProps(documentCodeFeedbackId, documentCodeError)}
            onBlur={() => onFieldBlur?.('documentCode')}
            onChange={(event) => updateField('documentCode', event.target.value)}
          />
          <FieldFeedback id={documentCodeFeedbackId} message={documentCodeError} />
        </div>
      </div>

      <div className="catalog-form__row">
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-issuedAt`}>
            Fecha de emisión
          </label>
          <input
            id={`${formId}-issuedAt`}
            className={`auth-form__input${getFieldInputErrorClass(issuedAtError)}`}
            type="date"
            name="issuedAt"
            value={draft.issuedAt}
            disabled={isSubmitting}
            {...getFieldAriaProps(issuedAtFeedbackId, issuedAtError)}
            onBlur={() => onFieldBlur?.('issuedAt')}
            onChange={(event) => updateField('issuedAt', event.target.value)}
          />
          <FieldFeedback id={issuedAtFeedbackId} message={issuedAtError} />
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
            value={draft.expiredAt}
            disabled={isSubmitting}
            {...getFieldAriaProps(expiredAtFeedbackId, expiredAtError)}
            onBlur={() => onFieldBlur?.('expiredAt')}
            onChange={(event) => updateField('expiredAt', event.target.value)}
          />
          <FieldFeedback id={expiredAtFeedbackId} message={expiredAtError} />
        </div>
      </div>

      <div className="auth-form__field">
        <label className="auth-form__label" htmlFor={`${formId}-file`}>
          Archivo
          <span className="catalog-form__required" aria-hidden="true">
            {' '}
            *
          </span>
        </label>
        <input
          id={`${formId}-file`}
          className={`auth-form__input${getFieldInputErrorClass(fileError)}`}
          type="file"
          name="file"
          accept={FILE_INPUT_ACCEPT}
          disabled={isSubmitting}
          {...getFieldAriaProps(fileFeedbackId, fileError)}
          onBlur={() => onFieldBlur?.('file')}
          onChange={(event) =>
            updateField('file', event.target.files?.[0] ?? null)
          }
        />
        {draft.file ? (
          <p className="catalog-table__muted">{draft.file.name}</p>
        ) : null}
        <FieldFeedback id={fileFeedbackId} message={fileError} />
      </div>
    </>
  )
}
