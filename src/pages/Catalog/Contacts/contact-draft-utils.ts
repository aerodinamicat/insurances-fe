import type {
  ContactResponse,
  ContactType,
  CreateContactPayload,
  CustomerType,
  UpdateContactPayload,
} from '../../../api/catalog'
import {
  buildAddressPayload,
  createAddressFieldState,
  validateAddressFormValues,
  type AddressFormValues,
  type AddressFieldErrors,
} from '../../../components/AddressFormBlock'
import type { FieldErrors } from '../../../types/form-errors'
import {
  createPhoneFieldState,
  getPhoneFieldValidationError,
  normalizePhoneFieldState,
  type PhoneFieldState,
} from './phone-field-state'

const CONTACT_TYPES: ContactType[] = [
  'Personal',
  'Laboral',
  'Familiar',
  'Servicio',
]

export type ContactDraftValues = {
  type: ContactType
  reference: string
  email: string
} & AddressFormValues

export type ContactDraftFieldErrors = FieldErrors<
  keyof ContactDraftValues | 'phoneNumber' | 'customerId'
>

export type ContactDraft = {
  id: string
  phoneField: PhoneFieldState
  values: ContactDraftValues
}

let contactDraftCounter = 0

export function createContactDraftId(): string {
  contactDraftCounter += 1
  return `contact-draft-${contactDraftCounter}`
}

export function createEmptyContactDraft(
  customerType: CustomerType,
): ContactDraft {
  return {
    id: createContactDraftId(),
    phoneField: createPhoneFieldState(),
    values: {
      type: customerType === 'Empresa' ? 'Laboral' : 'Personal',
      reference: '',
      email: '',
      ...createAddressFieldState(),
    },
  }
}

export function buildContactDraftFromContact(
  contact?: ContactResponse,
): ContactDraft {
  return {
    id: createContactDraftId(),
    phoneField: createPhoneFieldState(contact?.phoneNumber),
    values: {
      type: contact?.type ?? 'Personal',
      reference: contact?.reference ?? '',
      email: contact?.email ?? '',
      ...createAddressFieldState(contact ?? undefined),
    },
  }
}

function validateEmail(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Introduce un correo electrónico válido.'
  }
  return null
}

export function validateContactFormWithCustomer(
  customerId: string | null | undefined,
  draft: ContactDraft,
): ContactDraftFieldErrors {
  if (!customerId) {
    return { customerId: 'Debes seleccionar un cliente.' }
  }

  return validateContactDraft(draft)
}

export function validateContactDraft(draft: ContactDraft): ContactDraftFieldErrors {
  const errors: ContactDraftFieldErrors = {}

  const phoneError = getPhoneFieldValidationError(draft.phoneField)
  if (phoneError) {
    errors.phoneNumber = phoneError
  }

  const emailError = validateEmail(draft.values.email)
  if (emailError) {
    errors.email = emailError
  }

  const addressErrors: AddressFieldErrors = validateAddressFormValues(draft.values)
  for (const [field, message] of Object.entries(addressErrors)) {
    if (message) {
      errors[field as keyof ContactDraftValues] = message
    }
  }

  return errors
}

export function buildContactUpdatePayload(
  draft: ContactDraft,
): UpdateContactPayload {
  return buildContactPayloadFields(draft)
}

export function buildContactCreatePayload(
  customerId: string,
  draft: ContactDraft,
): CreateContactPayload {
  return {
    customerId,
    ...buildContactPayloadFields(draft),
  }
}

function buildContactPayloadFields(draft: ContactDraft) {
  const phoneNumber = normalizePhoneFieldState(draft.phoneField)
  const reference = draft.values.reference.trim() || null
  const email = draft.values.email.trim() || null
  const addressPayload = buildAddressPayload(draft.values)

  return {
    type: draft.values.type,
    phoneNumber,
    reference,
    email,
    ...addressPayload,
  }
}

export { CONTACT_TYPES }
