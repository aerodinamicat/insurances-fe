import { useId, useMemo, useState } from 'react'
import {
  createInsurancePolicy,
  getCatalogApiErrorMessage,
  getCustomerAlias,
  updateInsurancePolicy,
  uploadAttachment,
} from '../../../api/catalog'
import type {
  AssuranceCompanyResponse,
  CustomerResponse,
  InsurancePolicyResponse,
} from '../../../api/catalog'
import { CompositionWizardModal } from '../../../components/CompositionWizard'
import { useCatalogFormErrors } from '../../../hooks/useCatalogFormErrors'
import {
  hasFieldErrors,
  isBuilderFieldErrorResult,
  isBuilderFormErrorResult,
  isBuilderSuccessValue,
  isBuilderSuccessFormData,
} from '../../../types/form-errors'
import { AttachmentDraftFields } from '../Attachments/AttachmentDraftFields'
import {
  ATTACHMENT_DOCUMENT_TYPES,
  buildPolicyContractFormData,
  createEmptyAttachmentDraft,
  validateAttachmentDraft,
  type AttachmentDraft,
  type AttachmentDraftFieldErrors,
} from '../Attachments/attachment-draft-utils'
import { getAttachmentDocumentTypeLabel } from '../Attachments/attachment-form-utils'
import {
  InsurancePolicyFormFields,
  addOneYearToDateInputValue,
} from './InsurancePolicyFormFields'
import {
  buildCreatePayload,
  buildInitialValues,
  validateFormValues,
  type InsurancePolicyFormValues,
} from './policy-form-utils'
import './InsurancePoliciesPage.css'

const TAB_ORDER = ['policy', 'contract', 'summary'] as const

type PolicyWizardTab = (typeof TAB_ORDER)[number]

type InsurancePolicyOnboardingWizardProps = {
  open: boolean
  customers: CustomerResponse[]
  assuranceCompanies: AssuranceCompanyResponse[]
  isLoadingOptions?: boolean
  onClose: () => void
  onSuccess: (policy: InsurancePolicyResponse) => void
}

function getNextTab(tab: PolicyWizardTab): PolicyWizardTab | null {
  const index = TAB_ORDER.indexOf(tab)
  return index < TAB_ORDER.length - 1 ? TAB_ORDER[index + 1]! : null
}

function getPreviousTab(tab: PolicyWizardTab): PolicyWizardTab | null {
  const index = TAB_ORDER.indexOf(tab)
  return index > 0 ? TAB_ORDER[index - 1]! : null
}

export function InsurancePolicyOnboardingWizard({
  open,
  customers,
  assuranceCompanies,
  isLoadingOptions = false,
  onClose,
  onSuccess,
}: InsurancePolicyOnboardingWizardProps) {
  const formId = useId()
  const [activeTab, setActiveTab] = useState<PolicyWizardTab>('policy')
  const [policyValues, setPolicyValues] = useState<InsurancePolicyFormValues>(() =>
    buildInitialValues(),
  )
  const [createdPolicy, setCreatedPolicy] =
    useState<InsurancePolicyResponse | null>(null)
  const [contractDraft, setContractDraft] = useState<AttachmentDraft>(() =>
    createEmptyAttachmentDraft(ATTACHMENT_DOCUMENT_TYPES.POLICY_CONTRACT.code),
  )
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contractSubmitted, setContractSubmitted] = useState(false)
  const [contractFieldErrors, setContractFieldErrors] =
    useState<AttachmentDraftFieldErrors>({})

  const {
    fieldErrors: policyFieldErrors,
    formError: policyFormError,
    submitted: policySubmitted,
    touchedFields: policyTouchedFields,
    resetFormErrors: resetPolicyFormErrors,
    clearFieldError: clearPolicyFieldError,
    touchField: touchPolicyField,
    applyValidationErrors: applyPolicyValidationErrors,
    applyApiError: applyPolicyApiError,
    applyBuilderResult: applyPolicyBuilderResult,
  } = useCatalogFormErrors<keyof InsurancePolicyFormValues>()

  const isDirty = useMemo(() => {
    const initialPolicy = buildInitialValues()
    return (
      JSON.stringify(policyValues) !== JSON.stringify(initialPolicy) ||
      createdPolicy !== null ||
      contractDraft.file !== null ||
      contractDraft.documentCode.trim() !== ''
    )
  }, [contractDraft, createdPolicy, policyValues])

  const contractTabHasFieldErrors = useMemo(
    () => contractSubmitted && hasFieldErrors(contractFieldErrors),
    [contractFieldErrors, contractSubmitted],
  )

  const tabs = useMemo(
    () => [
      {
        id: 'policy',
        label: 'Póliza',
        hasError: hasFieldErrors(policyFieldErrors) || !!policyFormError,
      },
      {
        id: 'contract',
        label: 'Contrato',
        disabled: !createdPolicy,
        hasError: contractTabHasFieldErrors,
      },
      {
        id: 'summary',
        label: 'Resumen',
        disabled: !createdPolicy,
        hasError: contractTabHasFieldErrors || !!globalError,
      },
    ],
    [
      contractTabHasFieldErrors,
      createdPolicy,
      globalError,
      policyFieldErrors,
      policyFormError,
    ],
  )

  const modalError = useMemo(() => {
    if (globalError) {
      return globalError
    }

    if (activeTab === 'policy') {
      return policyFormError
    }

    return null
  }, [activeTab, globalError, policyFormError])

  const summaryCustomerLabel = useMemo(() => {
    const customer = customers.find(
      (item) => item.id === (createdPolicy?.customerId ?? policyValues.customerId),
    )
    return customer ? getCustomerAlias(customer) : '—'
  }, [createdPolicy?.customerId, customers, policyValues.customerId])

  const summaryCompanyLabel = useMemo(() => {
    const company = assuranceCompanies.find(
      (item) =>
        item.id ===
        (createdPolicy?.assuranceCompanyId ?? policyValues.assuranceCompanyId),
    )
    return company?.businessName ?? '—'
  }, [
    assuranceCompanies,
    createdPolicy?.assuranceCompanyId,
    policyValues.assuranceCompanyId,
  ])

  function resetWizard() {
    setActiveTab('policy')
    setPolicyValues(buildInitialValues())
    setCreatedPolicy(null)
    setContractDraft(
      createEmptyAttachmentDraft(ATTACHMENT_DOCUMENT_TYPES.POLICY_CONTRACT.code),
    )
    setGlobalError(null)
    setIsSubmitting(false)
    setContractSubmitted(false)
    setContractFieldErrors({})
    resetPolicyFormErrors()
  }

  function handleClose() {
    resetWizard()
    onClose()
  }

  function updatePolicyField<K extends keyof InsurancePolicyFormValues>(
    field: K,
    value: InsurancePolicyFormValues[K],
  ) {
    clearPolicyFieldError(field)
    setPolicyValues((current) => ({ ...current, [field]: value }))
  }

  function handleEffectiveAtChange(value: string) {
    clearPolicyFieldError('effectiveAt')
    clearPolicyFieldError('nextRenewalAt')
    setPolicyValues((current) => ({
      ...current,
      effectiveAt: value,
      nextRenewalAt: addOneYearToDateInputValue(value),
    }))
  }

  function clearContractFieldError(field: keyof AttachmentDraftFieldErrors) {
    setContractFieldErrors((current) => {
      if (!current[field]) {
        return current
      }

      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function validatePolicyTab(): boolean {
    return !applyPolicyValidationErrors(validateFormValues(policyValues))
  }

  function validateContractTab(): boolean {
    setContractSubmitted(true)
    const errors = validateAttachmentDraft(contractDraft)
    setContractFieldErrors(errors)
    return !hasFieldErrors(errors)
  }

  async function ensurePolicyCreated(): Promise<InsurancePolicyResponse | null> {
    if (createdPolicy) {
      return createdPolicy
    }

    if (!validatePolicyTab()) {
      return null
    }

    const payload = buildCreatePayload(policyValues)
    if (applyPolicyBuilderResult(payload)) {
      return null
    }
    if (!isBuilderSuccessValue(payload)) {
      return null
    }

    setIsSubmitting(true)
    setGlobalError(null)

    try {
      const policy = await createInsurancePolicy(payload)
      setCreatedPolicy(policy)
      return policy
    } catch (caught) {
      applyPolicyApiError(caught, {
        entity: 'insurance-policy',
        fallback: 'No se pudo crear la póliza. Inténtalo de nuevo.',
      })
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  async function finalizeOnboarding(policy: InsurancePolicyResponse) {
    if (!validateContractTab()) {
      setActiveTab('contract')
      return
    }

    setIsSubmitting(true)
    setGlobalError(null)

    try {
      const uploadResult = buildPolicyContractFormData(
        policy.id,
        contractDraft,
        policy.effectiveAt,
      )
      if (isBuilderFieldErrorResult(uploadResult)) {
        setContractSubmitted(true)
        setContractFieldErrors(uploadResult.fieldErrors)
        setActiveTab('contract')
        return
      }
      if (isBuilderFormErrorResult(uploadResult)) {
        setGlobalError(uploadResult.error)
        setActiveTab('contract')
        return
      }
      if (!isBuilderSuccessFormData(uploadResult)) {
        return
      }

      const attachment = await uploadAttachment(uploadResult.formData)
      const updatedPolicy = await updateInsurancePolicy(policy.id, {
        attachedContractId: attachment.id,
      })

      onSuccess(updatedPolicy)
      handleClose()
    } catch (caught) {
      setGlobalError(
        getCatalogApiErrorMessage(
          caught,
          'No se pudo vincular el contrato. La póliza ya existe; puedes completar el alta desde su ficha o reintentar.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePrimaryAction() {
    setGlobalError(null)

    if (activeTab === 'summary') {
      if (!createdPolicy) {
        const policy = await ensurePolicyCreated()
        if (!policy) {
          setActiveTab('policy')
          return
        }
        await finalizeOnboarding(policy)
        return
      }

      await finalizeOnboarding(createdPolicy)
      return
    }

    if (activeTab === 'policy') {
      if (!validatePolicyTab()) {
        return
      }

      const policy = await ensurePolicyCreated()
      if (!policy) {
        return
      }

      const nextTab = getNextTab(activeTab)
      if (nextTab) {
        setActiveTab(nextTab)
      }
      return
    }

    if (activeTab === 'contract') {
      if (!validateContractTab()) {
        return
      }

      const nextTab = getNextTab(activeTab)
      if (nextTab) {
        setActiveTab(nextTab)
      }
    }
  }

  function handleBack() {
    const previousTab = getPreviousTab(activeTab)
    if (previousTab) {
      setGlobalError(null)
      setActiveTab(previousTab)
    }
  }

  function handleTabChange(tabId: string) {
    if (!createdPolicy && tabId !== 'policy') {
      return
    }

    setGlobalError(null)
    setActiveTab(tabId as PolicyWizardTab)
  }

  const primaryLabel = activeTab === 'summary' ? 'Finalizar' : 'Continuar'
  const showBack = activeTab !== 'policy'
  const primaryDisabled =
    activeTab === 'summary' && !contractDraft.file

  return (
    <CompositionWizardModal
      open={open}
      title="Nueva póliza"
      tabs={tabs}
      activeTabId={activeTab}
      onTabChange={handleTabChange}
      onClose={handleClose}
      isDirty={isDirty}
      isSubmitting={isSubmitting || isLoadingOptions}
      error={modalError}
      primaryLabel={primaryLabel}
      primaryDisabled={primaryDisabled}
      onPrimaryAction={() => {
        void handlePrimaryAction()
      }}
      showBack={showBack}
      onBack={handleBack}
    >
      {activeTab === 'policy' && (
        <>
          <p className="composition-wizard-modal__section-desc">
            Completa los datos de la póliza. Al continuar se creará el registro y
            podrás adjuntar el contrato obligatorio.
          </p>
          <InsurancePolicyFormFields
            formId={formId}
            values={policyValues}
            customers={customers}
            assuranceCompanies={assuranceCompanies}
            isSubmitting={isSubmitting}
            isLoadingOptions={isLoadingOptions}
            showCancellation={false}
            fieldErrors={policyFieldErrors}
            showErrors={policySubmitted}
            touchedFields={policyTouchedFields}
            onFieldChange={updatePolicyField}
            onEffectiveAtChange={handleEffectiveAtChange}
            onFieldBlur={touchPolicyField}
          />
        </>
      )}

      {activeTab === 'contract' && (
        <>
          <p className="composition-wizard-modal__section-desc">
            Adjunta el contrato de la póliza. Este documento es obligatorio para
            finalizar el alta.
          </p>
          <AttachmentDraftFields
            draft={contractDraft}
            isSubmitting={isSubmitting}
            lockDocumentType
            fieldErrors={contractFieldErrors}
            showErrors={contractSubmitted}
            onChange={(nextDraft) => {
              for (const key of [
                'documentType',
                'documentCode',
                'file',
                'issuedAt',
                'expiredAt',
              ] as const) {
                if (contractDraft[key] !== nextDraft[key]) {
                  clearContractFieldError(key)
                }
              }
              setContractDraft(nextDraft)
            }}
          />
        </>
      )}

      {activeTab === 'summary' && createdPolicy && (
        <div className="composition-wizard-summary">
          <div className="composition-wizard-summary__row">
            <span className="composition-wizard-summary__label">Cliente</span>
            <span className="composition-wizard-summary__value">
              {summaryCustomerLabel}
            </span>
          </div>
          <div className="composition-wizard-summary__row">
            <span className="composition-wizard-summary__label">Aseguradora</span>
            <span className="composition-wizard-summary__value">
              {summaryCompanyLabel}
            </span>
          </div>
          <div className="composition-wizard-summary__row">
            <span className="composition-wizard-summary__label">Póliza</span>
            <span className="composition-wizard-summary__value">
              {createdPolicy.identifierId} · {createdPolicy.branch}
            </span>
          </div>
          <div className="composition-wizard-summary__row">
            <span className="composition-wizard-summary__label">Contrato</span>
            <span className="composition-wizard-summary__value">
              {contractDraft.file
                ? `${getAttachmentDocumentTypeLabel(contractDraft.documentType)} (${contractDraft.file.name})`
                : 'Pendiente de adjuntar'}
            </span>
          </div>
        </div>
      )}
    </CompositionWizardModal>
  )
}
