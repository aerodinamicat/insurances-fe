import { useId, useMemo, useRef, useState } from 'react'
import { uploadAttachment } from '../../../api/catalog'
import type {
  AssuranceCompanyResponse,
  AttachmentResponse,
  CustomerResponse,
  InsuredAssetResponse,
  InsurancePolicyResponse,
} from '../../../api/catalog'
import { CatalogModal } from '../../../components/CatalogModal'
import { FieldHelpTrigger } from '../../../components/FieldHelp'
import {
  FieldFeedback,
  getFieldAriaProps,
  getFieldFeedbackId,
  getFieldInputErrorClass,
  getVisibleFieldError,
} from '../../../components/FormField'
import { useCatalogFormErrors } from '../../../hooks/useCatalogFormErrors'
import { isBuilderSuccessFormData } from '../../../types/form-errors'
import { CustomerCombobox } from '../components/CustomerCombobox'
import { InsuredAssetCombobox } from '../components/InsuredAssetCombobox'
import { InsurancePolicyCombobox } from '../components/InsurancePolicyCombobox'
import {
  buildInitialUploadValues,
  buildUploadFormData,
  FILE_INPUT_ACCEPT,
  getAttachmentDocumentTypeOptions,
  getSelectedAttachmentParentType,
  type AttachmentUploadFieldErrors,
  type AttachmentUploadFormValues,
} from './attachment-form-utils'

type AttachmentUploadModalProps = {
  open: boolean
  customers: CustomerResponse[]
  policies: InsurancePolicyResponse[]
  assuranceCompanies?: AssuranceCompanyResponse[]
  assets: InsuredAssetResponse[]
  customerFilterId: string | null
  policyFilterId: string | null
  assetFilterId: string | null
  parentLocked?: boolean
  isLoadingOptions?: boolean
  onClose: () => void
  onSuccess: (attachment: AttachmentResponse) => void
}

export function AttachmentUploadModal({
  open,
  customers,
  policies,
  assuranceCompanies = [],
  assets,
  customerFilterId,
  policyFilterId,
  assetFilterId,
  parentLocked = false,
  isLoadingOptions = false,
  onClose,
  onSuccess,
}: AttachmentUploadModalProps) {
  const formId = useId()
  const documentCodeHelpId = useId()
  const fileHelpId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [values, setValues] = useState<AttachmentUploadFormValues>(() =>
    buildInitialUploadValues(customerFilterId, policyFilterId, assetFilterId),
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    fieldErrors,
    formError,
    submitted,
    touchedFields,
    resetFormErrors,
    clearFieldError,
    touchField,
    applyBuilderResult,
    applyApiError,
  } = useCatalogFormErrors<keyof AttachmentUploadFieldErrors>()

  const isDisabled = isSubmitting || isLoadingOptions
  const selectedParentType = getSelectedAttachmentParentType(values)
  const documentTypeOptions = useMemo(
    () => getAttachmentDocumentTypeOptions(values, assets),
    [values, assets],
  )
  const errorOptions = { fieldErrors, showErrors: submitted, touchedFields }

  function visibleError(field: keyof AttachmentUploadFieldErrors): string | null {
    return getVisibleFieldError(field, errorOptions)
  }

  function updateField<K extends keyof AttachmentUploadFormValues>(
    field: K,
    value: AttachmentUploadFormValues[K],
  ) {
    clearFieldError(field)
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleCustomerChange(customerId: string | null) {
    clearFieldError('customerId')
    setValues((current) => ({
      ...current,
      parentType: 'customer',
      customerId,
      insurancePolicyId: null,
      insuredAssetId: null,
      documentType: '',
      documentCode: '',
    }))
  }

  function handlePolicyChange(insurancePolicyId: string | null) {
    clearFieldError('customerId')
    setValues((current) => ({
      ...current,
      parentType: 'policy',
      customerId: null,
      insurancePolicyId,
      insuredAssetId: null,
      documentType: '',
      documentCode: '',
    }))
  }

  function handleAssetChange(insuredAssetId: string | null) {
    clearFieldError('customerId')
    setValues((current) => ({
      ...current,
      parentType: 'asset',
      customerId: null,
      insurancePolicyId: null,
      insuredAssetId,
      documentType: '',
      documentCode: '',
    }))
  }

  async function handleSubmit() {
    setIsSubmitting(true)

    try {
      const policyEffectiveAt = policies.find(
        (policy) => policy.id === values.insurancePolicyId,
      )?.effectiveAt
      const valuesToSubmit =
        values.insurancePolicyId && !values.issuedAt && policyEffectiveAt
          ? { ...values, issuedAt: policyEffectiveAt }
          : values
      const result = buildUploadFormData(valuesToSubmit, selectedFile)
      if (applyBuilderResult(result)) {
        return
      }
      if (!isBuilderSuccessFormData(result)) {
        return
      }

      const created = await uploadAttachment(result.formData)
      onSuccess(created)
    } catch (caught) {
      applyApiError(caught, {
        entity: 'attachment',
        fallback: 'No se pudo subir el documento. Inténtalo de nuevo.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const initialValues = useMemo(
    () =>
      buildInitialUploadValues(customerFilterId, policyFilterId, assetFilterId),
    [customerFilterId, policyFilterId, assetFilterId],
  )
  const isDirty = useMemo(
    () =>
      JSON.stringify(values) !== JSON.stringify(initialValues) ||
      selectedFile !== null,
    [values, initialValues, selectedFile],
  )

  function handleResetAction() {
    setValues(initialValues)
    setSelectedFile(null)
    resetFormErrors()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const documentTypeError = visibleError('documentType')
  const documentCodeError = visibleError('documentCode')
  const expiredAtError = visibleError('expiredAt')
  const fileError = visibleError('file')
  const parentLinkError = visibleError('customerId')
  const parentLinkFeedbackId = getFieldFeedbackId(formId, 'customerId')

  return (
    <CatalogModal
      open={open}
      title="Subir documento"
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={formError}
      isDirty={isDirty}
      resetActionLabel="Vaciar campos"
      onResetAction={handleResetAction}
    >
      <div className="attachments-form__parent-grid">
        <CustomerCombobox
          customers={customers}
          value={values.customerId}
          onChange={handleCustomerChange}
          label="Cliente"
          disabled={
            isDisabled ||
            parentLocked ||
            Boolean(selectedParentType && selectedParentType !== 'customer')
          }
          isLoading={isLoadingOptions}
          openOnFocus={false}
          onFieldBlur={() => touchField('customerId')}
        />

        <InsurancePolicyCombobox
          policies={policies}
          customers={customers}
          assuranceCompanies={assuranceCompanies}
          value={values.insurancePolicyId}
          onChange={handlePolicyChange}
          label="Póliza"
          disabled={
            isDisabled ||
            parentLocked ||
            Boolean(selectedParentType && selectedParentType !== 'policy')
          }
          isLoading={isLoadingOptions}
          openOnFocus={false}
          onFieldBlur={() => touchField('customerId')}
        />

        <InsuredAssetCombobox
          assets={assets}
          value={values.insuredAssetId}
          onChange={handleAssetChange}
          label="Bien asegurado"
          disabled={
            isDisabled ||
            parentLocked ||
            Boolean(selectedParentType && selectedParentType !== 'asset')
          }
          isLoading={isLoadingOptions}
          openOnFocus={false}
          onFieldBlur={() => touchField('customerId')}
        />
      </div>

      <FieldFeedback id={parentLinkFeedbackId} message={parentLinkError} />

      {selectedParentType && (
        <button
          type="button"
          className="catalog-btn catalog-btn--ghost attachments-form__clear-parent"
          disabled={isDisabled}
          onClick={() => {
            clearFieldError('customerId')
            setValues((current) => ({
              ...current,
              customerId: null,
              insurancePolicyId: null,
              insuredAssetId: null,
              documentType: '',
              documentCode: '',
            }))
          }}
        >
          Cambiar vinculación
        </button>
      )}

      <div className="attachments-form__document-row">
        <div className="auth-form__field">
          <label
            className="auth-form__label"
            htmlFor={`${formId}-documentType`}
          >
            Tipo de documento
            <span className="catalog-form__required" aria-hidden="true">
              {' '}
              *
            </span>
          </label>
          <p className="catalog-form__context-hint">
            Las opciones dependen de la vinculación seleccionada.
          </p>
          <select
            id={`${formId}-documentType`}
            className={`auth-form__input${getFieldInputErrorClass(documentTypeError)}`}
            name="documentType"
            value={values.documentType}
            required
            disabled={isDisabled || !selectedParentType}
            {...getFieldAriaProps(
              getFieldFeedbackId(formId, 'documentType'),
              documentTypeError,
            )}
            onBlur={() => touchField('documentType')}
            onChange={(event) =>
              updateField('documentType', event.target.value)
            }
          >
            <option value="" disabled>
              {selectedParentType
                ? 'Selecciona el tipo de documento'
                : 'Selecciona primero una vinculación'}
            </option>
            {documentTypeOptions.map((documentType) => (
              <option key={documentType.code} value={documentType.code}>
                {documentType.label}
              </option>
            ))}
          </select>
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'documentType')}
            message={documentTypeError}
          />
          
        </div>

        <div className="auth-form__field">
          <div className="catalog-form__label-row">
            <label
              className="auth-form__label"
              htmlFor={`${formId}-documentCode`}
            >
              Código de documento
            </label>
            <FieldHelpTrigger
              id={documentCodeHelpId}
              label="Ayuda sobre el código de documento"
            >
              Opcional. Úsalo cuando el documento tenga identificador propio.
            </FieldHelpTrigger>
          </div>
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
              documentCodeHelpId,
            )}
            onBlur={() => touchField('documentCode')}
            onChange={(event) =>
              updateField('documentCode', event.target.value)
            }
          />
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'documentCode')}
            message={documentCodeError}
          />
          
        </div>
      </div>

      <div className="attachments-form__date-row">
        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-issuedAt`}>
            Fecha de emisión
          </label>
          <input
            id={`${formId}-issuedAt`}
            className={`auth-form__input${getFieldInputErrorClass(visibleError('issuedAt'))}`}
            type="date"
            name="issuedAt"
            value={values.issuedAt}
            disabled={isDisabled}
            {...getFieldAriaProps(
              getFieldFeedbackId(formId, 'issuedAt'),
              visibleError('issuedAt'),
            )}
            onBlur={() => touchField('issuedAt')}
            onChange={(event) => updateField('issuedAt', event.target.value)}
          />
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'issuedAt')}
            message={visibleError('issuedAt')}
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

      <div className="auth-form__field">
        <div className="catalog-form__label-row">
          <label className="auth-form__label" htmlFor={`${formId}-file`}>
            Archivo
            <span className="catalog-form__required" aria-hidden="true">
              {' '}
              *
            </span>
          </label>
          <FieldHelpTrigger id={fileHelpId} label="Ayuda sobre formatos de archivo">
            PDF, Word, ODT o imágenes (PNG, JPG, WEBP, AVIF).
          </FieldHelpTrigger>
        </div>
        <input
          id={`${formId}-file`}
          ref={fileInputRef}
          className={`auth-form__input attachments-form__file-input${getFieldInputErrorClass(fileError)}`}
          type="file"
          name="file"
          accept={FILE_INPUT_ACCEPT}
          required
          disabled={isDisabled}
          {...getFieldAriaProps(
            getFieldFeedbackId(formId, 'file'),
            fileError,
            fileHelpId,
          )}
          onBlur={() => touchField('file')}
          onChange={(event) => {
            clearFieldError('file')
            const file = event.target.files?.[0] ?? null
            setSelectedFile(file)
          }}
        />
        <FieldFeedback
          id={getFieldFeedbackId(formId, 'file')}
          message={fileError}
        />
        {selectedFile && (
          <p className="attachments-form__file-meta">
            {selectedFile.name} ({Math.ceil(selectedFile.size / 1024)} KB)
          </p>
        )}
      </div>
    </CatalogModal>
  )
}
