import { useId, useMemo, useState } from 'react'
import {
  createContact,
  createCustomer,
  getCatalogApiErrorMessage,
  getCustomerAlias,
  uploadAttachment,
} from '../../../api/catalog'
import type { CustomerResponse } from '../../../api/catalog'
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
  buildCustomerAttachmentFormData,
  createEmptyAttachmentDraft,
  validateAttachmentDraft,
  type AttachmentDraft,
  type AttachmentDraftFieldErrors,
} from '../Attachments/attachment-draft-utils'
import { ContactDraftFields } from '../Contacts/ContactDraftFields'
import {
  buildContactCreatePayload,
  createEmptyContactDraft,
  validateContactDraft,
  type ContactDraft,
  type ContactDraftFieldErrors,
} from '../Contacts/contact-draft-utils'
import { CustomerFormFields } from './CustomerFormFields'
import {
  buildCreateCustomerPayload,
  buildInitialCustomerValues,
  validateCustomerValues,
  type CustomerFormValues,
} from './customer-form-utils'
import '../Contacts/ContactsPage.css'
import './CustomersPage.css'

const TAB_ORDER = ['customer', 'contacts', 'documents', 'summary'] as const

type CustomerWizardTab = (typeof TAB_ORDER)[number]

type CustomerOnboardingWizardProps = {
  open: boolean
  onClose: () => void
  onSuccess: (customer: CustomerResponse) => void
}

function getNextTab(tab: CustomerWizardTab): CustomerWizardTab | null {
  const index = TAB_ORDER.indexOf(tab)
  return index < TAB_ORDER.length - 1 ? TAB_ORDER[index + 1]! : null
}

function getPreviousTab(tab: CustomerWizardTab): CustomerWizardTab | null {
  const index = TAB_ORDER.indexOf(tab)
  return index > 0 ? TAB_ORDER[index - 1]! : null
}

function hasAnyItemFieldErrors<T extends string>(
  errorsById: Record<string, Partial<Record<T, string>>>,
): boolean {
  return Object.values(errorsById).some((errors) => hasFieldErrors(errors))
}

export function CustomerOnboardingWizard({
  open,
  onClose,
  onSuccess,
}: CustomerOnboardingWizardProps) {
  const formId = useId()
  const [activeTab, setActiveTab] = useState<CustomerWizardTab>('customer')
  const [customerValues, setCustomerValues] = useState<CustomerFormValues>(() =>
    buildInitialCustomerValues(),
  )
  const [createdCustomer, setCreatedCustomer] = useState<CustomerResponse | null>(
    null,
  )
  const [contacts, setContacts] = useState<ContactDraft[]>(() => [
    createEmptyContactDraft('Particular'),
  ])
  const [documents, setDocuments] = useState<AttachmentDraft[]>([])
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contactsPersistedCount, setContactsPersistedCount] = useState(0)
  const [documentsPersistedCount, setDocumentsPersistedCount] = useState(0)
  const [contactsSubmitted, setContactsSubmitted] = useState(false)
  const [documentsSubmitted, setDocumentsSubmitted] = useState(false)
  const [contactsFormError, setContactsFormError] = useState<string | null>(null)
  const [contactFieldErrorsById, setContactFieldErrorsById] = useState<
    Record<string, ContactDraftFieldErrors>
  >({})
  const [documentFieldErrorsById, setDocumentFieldErrorsById] = useState<
    Record<string, AttachmentDraftFieldErrors>
  >({})

  const {
    fieldErrors: customerFieldErrors,
    formError: customerFormError,
    submitted: customerSubmitted,
    touchedFields: customerTouchedFields,
    resetFormErrors: resetCustomerFormErrors,
    clearFieldError: clearCustomerFieldError,
    touchField: touchCustomerField,
    applyValidationErrors: applyCustomerValidationErrors,
    applyApiError: applyCustomerApiError,
    applyBuilderResult: applyCustomerBuilderResult,
  } = useCatalogFormErrors<keyof CustomerFormValues>()

  const isDirty = useMemo(() => {
    const initialCustomer = buildInitialCustomerValues()
    return (
      JSON.stringify(customerValues) !== JSON.stringify(initialCustomer) ||
      contacts.length > 1 ||
      documents.length > 0 ||
      createdCustomer !== null
    )
  }, [contacts.length, createdCustomer, customerValues, documents.length])

  const contactsTabHasFieldErrors = useMemo(
    () =>
      !!contactsFormError ||
      (contactsSubmitted && hasAnyItemFieldErrors(contactFieldErrorsById)),
    [contactFieldErrorsById, contactsFormError, contactsSubmitted],
  )

  const documentsTabHasFieldErrors = useMemo(
    () =>
      documentsSubmitted && hasAnyItemFieldErrors(documentFieldErrorsById),
    [documentFieldErrorsById, documentsSubmitted],
  )

  const tabs = useMemo(
    () => [
      {
        id: 'customer',
        label: 'Cliente',
        hasError:
          hasFieldErrors(customerFieldErrors) || !!customerFormError,
      },
      {
        id: 'contacts',
        label: 'Contactos',
        disabled: !createdCustomer,
        hasError: contactsTabHasFieldErrors,
      },
      {
        id: 'documents',
        label: 'Documentos',
        disabled: !createdCustomer,
        hasError: documentsTabHasFieldErrors,
      },
      {
        id: 'summary',
        label: 'Resumen',
        disabled: !createdCustomer,
        hasError:
          contactsTabHasFieldErrors || documentsTabHasFieldErrors || !!globalError,
      },
    ],
    [
      contactsTabHasFieldErrors,
      createdCustomer,
      customerFieldErrors,
      customerFormError,
      documentsTabHasFieldErrors,
      globalError,
    ],
  )

  const modalError = useMemo(() => {
    if (globalError) {
      return globalError
    }

    if (activeTab === 'customer') {
      return customerFormError
    }

    if (activeTab === 'contacts' || activeTab === 'summary') {
      return contactsFormError
    }

    return null
  }, [activeTab, contactsFormError, customerFormError, globalError])

  function resetWizard() {
    setActiveTab('customer')
    setCustomerValues(buildInitialCustomerValues())
    setCreatedCustomer(null)
    setContacts([createEmptyContactDraft('Particular')])
    setDocuments([])
    setGlobalError(null)
    setIsSubmitting(false)
    setContactsPersistedCount(0)
    setDocumentsPersistedCount(0)
    setContactsSubmitted(false)
    setDocumentsSubmitted(false)
    setContactsFormError(null)
    setContactFieldErrorsById({})
    setDocumentFieldErrorsById({})
    resetCustomerFormErrors()
  }

  function handleClose() {
    resetWizard()
    onClose()
  }

  function updateCustomerField<K extends keyof CustomerFormValues>(
    field: K,
    value: CustomerFormValues[K],
  ) {
    clearCustomerFieldError(field)
    setCustomerValues((current) => ({ ...current, [field]: value }))
    if (field === 'type') {
      setContacts([createEmptyContactDraft(value as CustomerFormValues['type'])])
      setContactsSubmitted(false)
      setContactsFormError(null)
      setContactFieldErrorsById({})
    }
  }

  function clearContactFieldError(
    contactId: string,
    field: keyof ContactDraftFieldErrors,
  ) {
    setContactFieldErrorsById((current) => {
      const itemErrors = current[contactId]
      if (!itemErrors?.[field]) {
        return current
      }

      const nextItemErrors = { ...itemErrors }
      delete nextItemErrors[field]

      if (!hasFieldErrors(nextItemErrors)) {
        const next = { ...current }
        delete next[contactId]
        return next
      }

      return { ...current, [contactId]: nextItemErrors }
    })
  }

  function updateContact(
    contactId: string,
    updater: (contact: ContactDraft) => ContactDraft,
  ) {
    setContacts((current) =>
      current.map((contact) =>
        contact.id === contactId ? updater(contact) : contact,
      ),
    )
  }

  function clearDocumentFieldError(
    documentId: string,
    field: keyof AttachmentDraftFieldErrors,
  ) {
    setDocumentFieldErrorsById((current) => {
      const itemErrors = current[documentId]
      if (!itemErrors?.[field]) {
        return current
      }

      const nextItemErrors = { ...itemErrors }
      delete nextItemErrors[field]

      if (!hasFieldErrors(nextItemErrors)) {
        const next = { ...current }
        delete next[documentId]
        return next
      }

      return { ...current, [documentId]: nextItemErrors }
    })
  }

  function validateCustomerTab(): boolean {
    return !applyCustomerValidationErrors(validateCustomerValues(customerValues))
  }

  function validateContactsTab(): boolean {
    setContactsSubmitted(true)
    setContactsFormError(null)
    setContactFieldErrorsById({})

    if (contacts.length === 0) {
      setContactsFormError('Debes añadir al menos un contacto.')
      return false
    }

    const nextErrors: Record<string, ContactDraftFieldErrors> = {}
    for (const contact of contacts) {
      const contactErrors = validateContactDraft(contact)
      if (hasFieldErrors(contactErrors)) {
        nextErrors[contact.id] = contactErrors
      }
    }

    if (hasAnyItemFieldErrors(nextErrors)) {
      setContactFieldErrorsById(nextErrors)
      return false
    }

    return true
  }

  function validateDocumentsTab(): boolean {
    setDocumentsSubmitted(true)
    setDocumentFieldErrorsById({})

    const nextErrors: Record<string, AttachmentDraftFieldErrors> = {}
    for (const document of documents) {
      const documentErrors = validateAttachmentDraft(document)
      if (hasFieldErrors(documentErrors)) {
        nextErrors[document.id] = documentErrors
      }
    }

    if (hasAnyItemFieldErrors(nextErrors)) {
      setDocumentFieldErrorsById(nextErrors)
      return false
    }

    return true
  }

  function validateTab(tab: CustomerWizardTab): boolean {
    switch (tab) {
      case 'customer':
        return validateCustomerTab()
      case 'contacts':
        return validateContactsTab()
      case 'documents':
        return validateDocumentsTab()
      case 'summary':
        return validateContactsTab() && validateDocumentsTab()
    }
  }

  async function ensureCustomerCreated(): Promise<CustomerResponse | null> {
    if (createdCustomer) {
      return createdCustomer
    }

    if (!validateCustomerTab()) {
      return null
    }

    const payload = buildCreateCustomerPayload(customerValues)
    if (applyCustomerBuilderResult(payload)) {
      return null
    }
    if (!isBuilderSuccessValue(payload)) {
      return null
    }

    setIsSubmitting(true)
    setGlobalError(null)

    try {
      const customer = await createCustomer(payload)
      setCreatedCustomer(customer)
      return customer
    } catch (caught) {
      applyCustomerApiError(caught, {
        entity: 'customer',
        fallback: 'No se pudo crear el cliente. Inténtalo de nuevo.',
      })
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  async function finalizeOnboarding(customer: CustomerResponse) {
    if (!validateContactsTab()) {
      setActiveTab('contacts')
      return
    }

    if (!validateDocumentsTab()) {
      setActiveTab('documents')
      return
    }

    setIsSubmitting(true)
    setGlobalError(null)

    try {
      for (let index = contactsPersistedCount; index < contacts.length; index += 1) {
        const contact = contacts[index]!
        await createContact(buildContactCreatePayload(customer.id, contact))
        setContactsPersistedCount(index + 1)
      }

      for (let index = documentsPersistedCount; index < documents.length; index += 1) {
        const document = documents[index]!
        const uploadResult = buildCustomerAttachmentFormData(customer.id, document)
        if (isBuilderFieldErrorResult(uploadResult)) {
          setDocumentsSubmitted(true)
          setDocumentFieldErrorsById({ [document.id]: uploadResult.fieldErrors })
          setActiveTab('documents')
          return
        }
        if (isBuilderFormErrorResult(uploadResult)) {
          setGlobalError(uploadResult.error)
          setActiveTab('documents')
          return
        }
        if (!isBuilderSuccessFormData(uploadResult)) {
          return
        }

        await uploadAttachment(uploadResult.formData)
        setDocumentsPersistedCount(index + 1)
      }

      onSuccess(customer)
      handleClose()
    } catch (caught) {
      setGlobalError(
        getCatalogApiErrorMessage(
          caught,
          contactsPersistedCount < contacts.length
            ? 'No se pudieron guardar todos los contactos. El cliente ya existe; puedes completar el alta desde su ficha o reintentar.'
            : 'No se pudieron subir todos los documentos. El cliente ya existe; puedes completar el alta desde su ficha o reintentar.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePrimaryAction() {
    setGlobalError(null)

    if (activeTab === 'summary') {
      if (!createdCustomer) {
        const customer = await ensureCustomerCreated()
        if (!customer) {
          setActiveTab('customer')
          return
        }
        await finalizeOnboarding(customer)
        return
      }

      await finalizeOnboarding(createdCustomer)
      return
    }

    if (!validateTab(activeTab)) {
      return
    }

    if (activeTab === 'customer') {
      const customer = await ensureCustomerCreated()
      if (!customer) {
        return
      }
    }

    const nextTab = getNextTab(activeTab)
    if (nextTab) {
      setActiveTab(nextTab)
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
    if (!createdCustomer && tabId !== 'customer') {
      return
    }

    setGlobalError(null)
    setActiveTab(tabId as CustomerWizardTab)
  }

  const primaryLabel = activeTab === 'summary' ? 'Finalizar' : 'Continuar'
  const showBack = activeTab !== 'customer'

  return (
    <CompositionWizardModal
      open={open}
      title="Nuevo cliente"
      tabs={tabs}
      activeTabId={activeTab}
      onTabChange={handleTabChange}
      onClose={handleClose}
      isDirty={isDirty}
      isSubmitting={isSubmitting}
      error={modalError}
      primaryLabel={primaryLabel}
      onPrimaryAction={() => {
        void handlePrimaryAction()
      }}
      showBack={showBack}
      onBack={handleBack}
    >
      {activeTab === 'customer' && (
        <>
          <p className="composition-wizard-modal__section-desc">
            Completa los datos del cliente. Al continuar se creará el registro y
            podrás añadir contactos y documentos.
          </p>
          <CustomerFormFields
            formId={formId}
            mode="create"
            values={customerValues}
            isSubmitting={isSubmitting}
            fieldErrors={customerFieldErrors}
            showErrors={customerSubmitted}
            touchedFields={customerTouchedFields}
            onFieldChange={updateCustomerField}
            onFieldBlur={touchCustomerField}
          />
        </>
      )}

      {activeTab === 'contacts' && (
        <>
          <p className="composition-wizard-modal__section-desc">
            Añade al menos un contacto. Puedes registrar varios antes de finalizar.
          </p>
          <div className="composition-wizard-draft-list">
            {contacts.map((contact, index) => (
              <div key={contact.id} className="composition-wizard-draft-card">
                <div className="composition-wizard-draft-card__header">
                  <h3 className="composition-wizard-draft-card__title">
                    Contacto {index + 1}
                  </h3>
                  {contacts.length > 1 && (
                    <button
                      type="button"
                      className="catalog-btn catalog-btn--ghost"
                      disabled={isSubmitting}
                      onClick={() =>
                        setContacts((current) =>
                          current.filter((item) => item.id !== contact.id),
                        )
                      }
                    >
                      Quitar
                    </button>
                  )}
                </div>
                <ContactDraftFields
                  formId={`${formId}-${contact.id}`}
                  draft={contact}
                  isSubmitting={isSubmitting}
                  fieldErrors={contactFieldErrorsById[contact.id]}
                  showErrors={contactsSubmitted}
                  onValuesChange={(values) => {
                    for (const key of Object.keys(values) as (keyof typeof values)[]) {
                      if (contact.values[key] !== values[key]) {
                        clearContactFieldError(contact.id, key)
                      }
                    }
                    updateContact(contact.id, (current) => ({
                      ...current,
                      values,
                    }))
                  }}
                  onPhoneFieldChange={(phoneField) => {
                    clearContactFieldError(contact.id, 'phoneNumber')
                    updateContact(contact.id, (current) => ({
                      ...current,
                      phoneField,
                    }))
                  }}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            className="catalog-btn catalog-btn--secondary"
            disabled={isSubmitting}
            onClick={() =>
              setContacts((current) => [
                ...current,
                createEmptyContactDraft(customerValues.type),
              ])
            }
          >
            Añadir contacto
          </button>
        </>
      )}

      {activeTab === 'documents' && (
        <>
          <p className="composition-wizard-modal__section-desc">
            Los documentos son opcionales. Puedes añadirlos ahora o más tarde desde
            la ficha del cliente.
          </p>
          {documents.length === 0 ? (
            <p className="catalog-empty">No hay documentos añadidos.</p>
          ) : (
            <div className="composition-wizard-draft-list">
              {documents.map((document, index) => (
                <div key={document.id} className="composition-wizard-draft-card">
                  <div className="composition-wizard-draft-card__header">
                    <h3 className="composition-wizard-draft-card__title">
                      Documento {index + 1}
                    </h3>
                    <button
                      type="button"
                      className="catalog-btn catalog-btn--ghost"
                      disabled={isSubmitting}
                      onClick={() =>
                        setDocuments((current) =>
                          current.filter((item) => item.id !== document.id),
                        )
                      }
                    >
                      Quitar
                    </button>
                  </div>
                  <AttachmentDraftFields
                    draft={document}
                    isSubmitting={isSubmitting}
                    fieldErrors={documentFieldErrorsById[document.id]}
                    showErrors={documentsSubmitted}
                    onChange={(nextDocument) => {
                      for (const key of [
                        'documentType',
                        'documentCode',
                        'file',
                        'issuedAt',
                        'expiredAt',
                      ] as const) {
                        if (document[key] !== nextDocument[key]) {
                          clearDocumentFieldError(document.id, key)
                        }
                      }
                      setDocuments((current) =>
                        current.map((item) =>
                          item.id === document.id ? nextDocument : item,
                        ),
                      )
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className="catalog-btn catalog-btn--secondary"
            disabled={isSubmitting}
            onClick={() =>
              setDocuments((current) => [...current, createEmptyAttachmentDraft()])
            }
          >
            Añadir documento
          </button>
        </>
      )}

      {activeTab === 'summary' && createdCustomer && (
        <div className="composition-wizard-summary">
          <div className="composition-wizard-summary__row">
            <span className="composition-wizard-summary__label">Cliente</span>
            <span className="composition-wizard-summary__value">
              {getCustomerAlias(createdCustomer)}
            </span>
          </div>
          <div className="composition-wizard-summary__row">
            <span className="composition-wizard-summary__label">Contactos</span>
            <span className="composition-wizard-summary__value">
              {contacts.length - contactsPersistedCount === 0
                ? `${contacts.length} contacto${contacts.length === 1 ? '' : 's'} guardado${contacts.length === 1 ? '' : 's'}`
                : `${contacts.length - contactsPersistedCount} contacto${contacts.length - contactsPersistedCount === 1 ? '' : 's'} pendiente${contacts.length - contactsPersistedCount === 1 ? '' : 's'} de guardar`}
            </span>
          </div>
          <div className="composition-wizard-summary__row">
            <span className="composition-wizard-summary__label">Documentos</span>
            <span className="composition-wizard-summary__value">
              {documents.length === 0
                ? 'Ninguno'
                : documents.length - documentsPersistedCount === 0
                  ? `${documents.length} documento${documents.length === 1 ? '' : 's'} subido${documents.length === 1 ? '' : 's'}`
                  : `${documents.length - documentsPersistedCount} documento${documents.length - documentsPersistedCount === 1 ? '' : 's'} pendiente${documents.length - documentsPersistedCount === 1 ? '' : 's'} de subir`}
            </span>
          </div>
        </div>
      )}
    </CompositionWizardModal>
  )
}
