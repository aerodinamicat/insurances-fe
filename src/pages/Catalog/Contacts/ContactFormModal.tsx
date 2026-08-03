import { useId, useState } from 'react'
import {
  createContact,
  updateContact,
} from '../../../api/catalog'
import type { ContactResponse, CustomerResponse } from '../../../api/catalog'
import { CatalogModal } from '../../../components/CatalogModal'
import { getFieldFeedbackId, getVisibleFieldError } from '../../../components/FormField'
import { useCatalogFormErrors } from '../../../hooks/useCatalogFormErrors'
import { ContactDraftFields } from './ContactDraftFields'
import { CustomerCombobox } from '../components/CustomerCombobox'
import {
  buildContactCreatePayload,
  buildContactDraftFromContact,
  buildContactUpdatePayload,
  validateContactFormWithCustomer,
  type ContactDraft,
  type ContactDraftFieldErrors,
} from './contact-draft-utils'

type ContactFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  contact?: ContactResponse
  customers: CustomerResponse[]
  defaultCustomerId?: string | null
  customerLocked?: boolean
  onClose: () => void
  onSuccess: (contact: ContactResponse) => void
}

function buildInitialCustomerId(
  contact?: ContactResponse,
  defaultCustomerId?: string | null,
): string | null {
  return contact?.customerId ?? defaultCustomerId ?? null
}

export function ContactFormModal({
  open,
  mode,
  contact,
  customers,
  defaultCustomerId,
  customerLocked = false,
  onClose,
  onSuccess,
}: ContactFormModalProps) {
  const formId = useId()
  const [customerId, setCustomerId] = useState<string | null>(() =>
    buildInitialCustomerId(contact, defaultCustomerId),
  )
  const [draft, setDraft] = useState<ContactDraft>(() =>
    buildContactDraftFromContact(contact),
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
  } = useCatalogFormErrors<keyof ContactDraftFieldErrors>()

  function handleResetAction() {
    setCustomerId(initialCustomerId)
    setDraft(initialDraft)
    resetFormErrors()
  }

  async function handleSubmit() {
    if (
      applyValidationErrors(validateContactFormWithCustomer(customerId, draft))
    ) {
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        if (!customerId) {
          return
        }

        const created = await createContact(
          buildContactCreatePayload(customerId, draft),
        )
        onSuccess(created)
        return
      }

      if (!contact) {
        return
      }

      const updated = await updateContact(
        contact.id,
        buildContactUpdatePayload(draft),
      )
      onSuccess(updated)
    } catch (caught) {
      applyApiError(caught, {
        entity: 'contact',
        fallback:
          mode === 'create'
            ? 'No se pudo crear el contacto. Inténtalo de nuevo.'
            : 'No se pudo actualizar el contacto. Inténtalo de nuevo.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = mode === 'create' ? 'Nuevo contacto' : 'Editar contacto'
  const initialCustomerId = buildInitialCustomerId(contact, defaultCustomerId)
  const initialDraft = buildContactDraftFromContact(contact)
  const isDirty =
    customerId !== initialCustomerId ||
    JSON.stringify(draft.values) !== JSON.stringify(initialDraft.values) ||
    JSON.stringify(draft.phoneField) !== JSON.stringify(initialDraft.phoneField)

  const customerFieldError = getVisibleFieldError('customerId', {
    fieldErrors,
    showErrors: submitted,
    touchedFields,
  })

  return (
    <CatalogModal
      open={open}
      title={title}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={formError}
      isDirty={isDirty}
      autoFocusFirstField={false}
      resetActionLabel={
        mode === 'create' ? 'Vaciar campos' : 'Restablecer valores'
      }
      onResetAction={handleResetAction}
    >
      <CustomerCombobox
        customers={customers}
        value={customerId}
        onChange={(nextCustomerId) => {
          clearFieldError('customerId')
          setCustomerId(nextCustomerId)
        }}
        label="Cliente"
        required
        disabled={isSubmitting || customerLocked}
        openOnFocus={false}
        feedbackId={getFieldFeedbackId(formId, 'customerId')}
        fieldError={customerFieldError}
        onFieldBlur={() => touchField('customerId')}
      />

      <ContactDraftFields
        formId={formId}
        draft={draft}
        isSubmitting={isSubmitting}
        fieldErrors={fieldErrors}
        showErrors={submitted}
        touchedFields={touchedFields}
        onValuesChange={(nextValues) => {
          setDraft((current) => {
            for (const key of Object.keys(nextValues) as (keyof typeof nextValues)[]) {
              if (current.values[key] !== nextValues[key]) {
                clearFieldError(key)
              }
            }
            return { ...current, values: nextValues }
          })
        }}
        onPhoneFieldChange={(phoneField) => {
          clearFieldError('phoneNumber')
          setDraft((current) => ({ ...current, phoneField }))
        }}
        onFieldBlur={touchField}
      />
    </CatalogModal>
  )
}
