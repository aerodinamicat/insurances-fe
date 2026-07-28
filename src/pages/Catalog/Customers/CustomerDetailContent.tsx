import { useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../../api/client'
import {
  fetchInsurancePolicies,
} from '../../../api/catalog'
import type {
  AssuranceCompanyResponse,
  ContactResponse,
  ContactType,
  CustomerResponse,
  InsurancePolicyResponse,
} from '../../../api/catalog'
import {
  TableLayout,
  type TableLayoutColumn,
} from '../../../components/TableLayout'
import { ViewOnMapCell } from '../../../components/ViewOnMapCell'
import { EDITOR_RANK, RoleGate } from '../../../routes/RoleGate'
import {
  formatDisplayDate,
  formatRemainingValidity,
  getRemainingValiditySortKey,
} from '../../../utils/date'
import {
  formatStructuredAddress,
  getStructuredAddressSearchText,
} from '../../../utils/address'
import { parsePhoneE164 } from '../../../utils/phone'
import { AttachmentUploadModal } from '../Attachments/AttachmentUploadModal'
import { getAttachmentDocumentTypeLabel } from '../Attachments/attachment-form-utils'
import { useAttachments } from '../Attachments/useAttachments'
import { ContactFormModal } from '../Contacts/ContactFormModal'
import { useContacts } from '../Contacts/useContacts'
import '../Contacts/ContactsPage.css'
import {
  getPolicyRenewalTargetDate,
  getPolicyStatusBadgeModifier,
} from '../InsurancePolicies/policy-form-utils'
import { InsurancePolicyFormModal } from '../InsurancePolicies/InsurancePolicyFormModal'
import { buildCustomerDetailFields } from './customer-detail-utils'

type CustomerDetailContentProps = {
  customer: CustomerResponse
  assuranceCompanies: AssuranceCompanyResponse[]
  excludePolicyId?: string | null
}

type CustomerDetailTab = 'resumen' | 'contactos' | 'documentos' | 'polizas'

function getContactTypeBadgeModifier(type: ContactType): string {
  switch (type) {
    case 'Personal':
      return 'personal'
    case 'Laboral':
      return 'laboral'
    case 'Familiar':
      return 'familiar'
    case 'Servicio':
      return 'servicio'
  }
}

function ContactPhoneCell({ phoneNumber }: { phoneNumber: string }) {
  const presentation = parsePhoneE164(phoneNumber)

  if (!presentation.parseable) {
    return (
      <span
        className="contacts-table__phone contacts-table__phone--unrecognized"
        aria-label={presentation.accessibleLabel}
      >
        <span className="contacts-table__phone-raw">{presentation.source}</span>
        <span className="contacts-table__phone-unrecognized-hint">
          Formato no reconocido
        </span>
      </span>
    )
  }

  return (
    <span
      className="contacts-table__phone"
      aria-label={presentation.accessibleLabel}
    >
      {presentation.flag ? (
        <span className="contacts-table__phone-flag" aria-hidden="true">
          {presentation.flag}
        </span>
      ) : null}
      {presentation.callingCode ? (
        <span className="contacts-table__phone-prefix">
          {presentation.callingCode}
        </span>
      ) : null}
      {presentation.formattedNationalNumber ? (
        <span className="contacts-table__phone-national">
          {presentation.formattedNationalNumber}
        </span>
      ) : null}
      {presentation.isNeutralCountry ? (
        <span className="contacts-table__phone-country">
          {presentation.countryLabel}
        </span>
      ) : null}
    </span>
  )
}

export function CustomerDetailContent({
  customer,
  assuranceCompanies,
  excludePolicyId,
}: CustomerDetailContentProps) {
  const tabsId = useId()
  const [activeTab, setActiveTab] = useState<CustomerDetailTab>('resumen')
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false)
  const [policyModalOpen, setPolicyModalOpen] = useState(false)
  const customerId = customer.id
  const policiesSectionTitle = excludePolicyId ? 'Otras pólizas' : 'Pólizas'

  const {
    contacts,
    isLoading: isContactsLoading,
    loadError: contactsLoadError,
    upsertContact,
  } = useContacts(customerId)

  const {
    attachments,
    isLoading: isAttachmentsLoading,
    loadError: attachmentsLoadError,
    upsertAttachment,
  } = useAttachments(customerId, null, null)

  const [policies, setPolicies] = useState<InsurancePolicyResponse[]>([])
  const [isPoliciesLoading, setIsPoliciesLoading] = useState(true)
  const [policiesLoadError, setPoliciesLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setIsPoliciesLoading(true)
      setPoliciesLoadError(null)

      try {
        const response = await fetchInsurancePolicies({ customerId })
        if (cancelled) {
          return
        }

        setPolicies(
          response
            .filter((item) =>
              excludePolicyId ? item.id !== excludePolicyId : true,
            )
            .sort((left, right) =>
              left.identifierId.localeCompare(right.identifierId, undefined, {
                sensitivity: 'base',
              }),
            ),
        )
      } catch (caught) {
        if (cancelled) {
          return
        }

        setPolicies([])
        setPoliciesLoadError(
          caught instanceof ApiError
            ? caught.message
            : 'No se pudieron cargar las pólizas del cliente. Inténtalo de nuevo.',
        )
      } finally {
        if (!cancelled) {
          setIsPoliciesLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [customerId, excludePolicyId])

  const companyById = useMemo(() => {
    const map = new Map<string, AssuranceCompanyResponse>()
    for (const company of assuranceCompanies) {
      map.set(company.id, company)
    }
    return map
  }, [assuranceCompanies])

  const contactColumns: TableLayoutColumn<ContactResponse>[] = [
    {
      key: 'type',
      header: 'Tipo',
      render: (contact) => (
        <span
          className={`catalog-badge catalog-badge--${getContactTypeBadgeModifier(contact.type)}`}
        >
          {contact.type}
        </span>
      ),
    },
    {
      key: 'reference',
      header: 'Referencia',
      render: (contact) => contact.reference?.trim() || '—',
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (contact) => <ContactPhoneCell phoneNumber={contact.phoneNumber} />,
    },
    {
      key: 'email',
      header: 'Correo electrónico',
      render: (contact) => (
        <span className="catalog-table__muted">{contact.email ?? '—'}</span>
      ),
    },
    {
      key: 'address',
      header: 'Dirección',
      render: (contact) => (
        <span className="catalog-table__muted">
          {formatStructuredAddress(contact)}
        </span>
      ),
      getSearchValue: (contact) => getStructuredAddressSearchText(contact),
    },
    {
      key: 'view-on-map',
      header: 'Mapa',
      headerClassName: 'table-layout__actions',
      cellClassName: 'table-layout__actions',
      render: (contact) => (
        <ViewOnMapCell gpsCoordinates={contact.gpsCoordinates} />
      ),
      getSearchValue: () => '',
      getSortValue: () => '',
    },
  ]

  const attachmentColumns: TableLayoutColumn<
    (typeof attachments)[number]
  >[] = [
    {
      key: 'type',
      header: 'Tipo',
      render: (attachment) =>
        getAttachmentDocumentTypeLabel(attachment.documentType),
    },
    {
      key: 'code',
      header: 'Código',
      render: (attachment) => attachment.documentCode ?? '—',
    },
    {
      key: 'issued-at',
      header: 'Emisión',
      render: (attachment) => formatDisplayDate(attachment.issuedAt),
    },
    {
      key: 'expired-at',
      header: 'Caducidad',
      render: (attachment) => formatDisplayDate(attachment.expiredAt),
    },
    {
      key: 'remaining-validity',
      header: 'Vigencia restante',
      headerClassName: 'table-layout__actions',
      render: (attachment) => formatRemainingValidity(attachment.expiredAt),
      getSortValue: (attachment) =>
        String(getRemainingValiditySortKey(attachment.expiredAt)),
    },
  ]

  const policyColumns: TableLayoutColumn<InsurancePolicyResponse>[] = [
    {
      key: 'identifier',
      header: 'Identificador',
      render: (policy) => (
        <Link
          to={`/catalog/insurance-policies/${policy.id}`}
          className="insurance-policies-table__link"
        >
          {policy.identifierId}
        </Link>
      ),
    },
    {
      key: 'branch',
      header: 'Ramo',
      render: (policy) => (
        <span className="catalog-badge catalog-badge--branch">
          {policy.branch}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (policy) => (
        <span
          className={`catalog-badge catalog-badge--status catalog-badge--${getPolicyStatusBadgeModifier(policy.status)}`}
        >
          {policy.status}
        </span>
      ),
    },
    {
      key: 'effective-at',
      header: 'Fecha efecto',
      render: (policy) => formatDisplayDate(policy.effectiveAt),
    },
    {
      key: 'next-renewal-at',
      header: 'Próxima renovación',
      render: (policy) =>
        formatDisplayDate(getPolicyRenewalTargetDate(policy)),
    },
    {
      key: 'assurance-company',
      header: 'Aseguradora',
      render: (policy) =>
        companyById.get(policy.assuranceCompanyId)?.businessName ??
        policy.assuranceCompanyId,
    },
  ]

  const customerFields = buildCustomerDetailFields(customer, formatDisplayDate)
  const policiesEmptyMessage = excludePolicyId
    ? 'Este cliente no tiene otras pólizas registradas.'
    : 'Este cliente no tiene pólizas registradas.'
  const tabs: { id: CustomerDetailTab; label: string }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'contactos', label: `Contactos (${contacts.length})` },
    { id: 'documentos', label: `Documentos (${attachments.length})` },
    { id: 'polizas', label: `${policiesSectionTitle} (${policies.length})` },
  ]
  const activeTabPanelId = `${tabsId}-${activeTab}-panel`
  const activeTabId = `${tabsId}-${activeTab}-tab`

  function handleContactSuccess(contact: ContactResponse) {
    upsertContact(contact)
    setContactModalOpen(false)
  }

  function handleAttachmentSuccess(
    attachment: (typeof attachments)[number],
  ) {
    upsertAttachment(attachment)
    setAttachmentModalOpen(false)
  }

  function handlePolicySuccess(policy: InsurancePolicyResponse) {
    setPolicies((current) =>
      [...current, policy].sort((left, right) =>
        left.identifierId.localeCompare(right.identifierId, undefined, {
          sensitivity: 'base',
        }),
      ),
    )
    setPolicyModalOpen(false)
  }

  return (
    <div className="customer-detail-content">
      <div
        className="customer-detail-tabs"
        role="tablist"
        aria-label="Secciones del cliente"
      >
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id
          const tabId = `${tabsId}-${tab.id}-tab`
          const panelId = `${tabsId}-${tab.id}-panel`

          return (
            <button
              key={tab.id}
              type="button"
              id={tabId}
              role="tab"
              className="customer-detail-tabs__tab"
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        id={activeTabPanelId}
        role="tabpanel"
        aria-labelledby={activeTabId}
        className="customer-detail-tabpanel"
      >
        {activeTab === 'resumen' && (
          <dl className="customer-detail-summary">
            {customerFields.map((field) => (
              <div key={field.label} className="customer-detail-summary__item">
                <dt>{field.label}</dt>
                <dd>
                  {field.label === 'Tipo' ? (
                    <span
                      className={`catalog-badge catalog-badge--${customer.type === 'Particular' ? 'particular' : 'empresa'}`}
                    >
                      {field.value}
                    </span>
                  ) : (
                    field.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {activeTab === 'contactos' && (
          <>
            <div className="catalog-page__toolbar">
              <RoleGate minRoleRank={EDITOR_RANK}>
                <button
                  type="button"
                  className="catalog-btn catalog-btn--add"
                  onClick={() => setContactModalOpen(true)}
                  disabled={isContactsLoading || Boolean(contactsLoadError)}
                >
                  Añadir
                </button>
              </RoleGate>
            </div>
            {isContactsLoading && (
              <p className="catalog-empty">Cargando contactos…</p>
            )}
            {!isContactsLoading && contactsLoadError && (
              <div className="auth-alert auth-alert--error" role="alert">
                {contactsLoadError}
              </div>
            )}
            {!isContactsLoading &&
              !contactsLoadError &&
              contacts.length === 0 && (
                <p className="catalog-empty">
                  Este cliente no tiene contactos.
                </p>
              )}
            {!isContactsLoading &&
              !contactsLoadError &&
              contacts.length > 0 && (
                <TableLayout
                  columns={contactColumns}
                  items={contacts}
                  getItemKey={(contact) => contact.id}
                />
              )}
          </>
        )}

        {activeTab === 'documentos' && (
          <>
            <div className="catalog-page__toolbar">
              <RoleGate minRoleRank={EDITOR_RANK}>
                <button
                  type="button"
                  className="catalog-btn catalog-btn--add"
                  onClick={() => setAttachmentModalOpen(true)}
                  disabled={
                    isAttachmentsLoading || Boolean(attachmentsLoadError)
                  }
                >
                  Añadir
                </button>
              </RoleGate>
            </div>
            {isAttachmentsLoading && (
              <p className="catalog-empty">Cargando documentos…</p>
            )}
            {!isAttachmentsLoading && attachmentsLoadError && (
              <div className="auth-alert auth-alert--error" role="alert">
                {attachmentsLoadError}
              </div>
            )}
            {!isAttachmentsLoading &&
              !attachmentsLoadError &&
              attachments.length === 0 && (
                <p className="catalog-empty">
                  Este cliente no tiene documentos.
                </p>
              )}
            {!isAttachmentsLoading &&
              !attachmentsLoadError &&
              attachments.length > 0 && (
                <TableLayout
                  columns={attachmentColumns}
                  items={attachments}
                  getItemKey={(attachment) => attachment.id}
                />
              )}
          </>
        )}

        {activeTab === 'polizas' && (
          <>
            <div className="catalog-page__toolbar">
              <RoleGate minRoleRank={EDITOR_RANK}>
                <button
                  type="button"
                  className="catalog-btn catalog-btn--add"
                  onClick={() => setPolicyModalOpen(true)}
                  disabled={
                    isPoliciesLoading || Boolean(policiesLoadError)
                  }
                >
                  Añadir
                </button>
              </RoleGate>
            </div>
            {isPoliciesLoading && (
              <p className="catalog-empty">Cargando pólizas…</p>
            )}
            {!isPoliciesLoading && policiesLoadError && (
              <div className="auth-alert auth-alert--error" role="alert">
                {policiesLoadError}
              </div>
            )}
            {!isPoliciesLoading &&
              !policiesLoadError &&
              policies.length === 0 && (
                <p className="catalog-empty">{policiesEmptyMessage}</p>
              )}
            {!isPoliciesLoading &&
              !policiesLoadError &&
              policies.length > 0 && (
                <TableLayout
                  columns={policyColumns}
                  items={policies}
                  getItemKey={(policy) => policy.id}
                />
              )}
          </>
        )}
      </div>

      <ContactFormModal
        key={contactModalOpen ? `create-${customerId}` : 'contact-closed'}
        open={contactModalOpen}
        mode="create"
        customers={[customer]}
        defaultCustomerId={customerId}
        customerLocked
        onClose={() => setContactModalOpen(false)}
        onSuccess={handleContactSuccess}
      />

      <AttachmentUploadModal
        key={
          attachmentModalOpen
            ? `upload-${customerId}`
            : 'attachment-closed'
        }
        open={attachmentModalOpen}
        customers={[customer]}
        policies={policies}
        assuranceCompanies={assuranceCompanies}
        assets={[]}
        customerFilterId={customerId}
        policyFilterId={null}
        assetFilterId={null}
        parentLocked
        onClose={() => setAttachmentModalOpen(false)}
        onSuccess={handleAttachmentSuccess}
      />

      <InsurancePolicyFormModal
        key={policyModalOpen ? `create-${customerId}` : 'policy-closed'}
        mode="create"
        open={policyModalOpen}
        customers={[customer]}
        assuranceCompanies={assuranceCompanies}
        defaultCustomerId={customerId}
        customerLocked
        onClose={() => setPolicyModalOpen(false)}
        onSuccess={handlePolicySuccess}
      />
    </div>
  )
}
