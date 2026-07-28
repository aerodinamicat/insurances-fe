import '../catalog-shared.css'
import { useCallback, useMemo, useState } from 'react'
import {
  deleteContact,
  getCatalogApiErrorMessage,
  getCustomerAlias,
} from '../../../api/catalog'
import type { ContactResponse, ContactType, CustomerResponse } from '../../../api/catalog'
import { useAuth } from '../../../auth'
import {
  TableLayout,
  type TableLayoutColumn,
} from '../../../components/TableLayout'
import { buildCatalogActionsColumn } from '../../../components/CatalogRowActions'
import { useGuardedDialog } from '../../../hooks/useGuardedDialog'
import { EDITOR_RANK, RoleGate } from '../../../routes/RoleGate'
import { MANAGER_RANK } from '../../../routes/role-ranks'
import { ViewOnMapCell } from '../../../components/ViewOnMapCell'
import {
  formatStructuredAddress,
  getStructuredAddressSearchText,
} from '../../../utils/address'
import { parsePhoneE164 } from '../../../utils/phone'
import { ContactFormModal } from './ContactFormModal'
import { useContacts } from './useContacts'
import { useCustomers } from '../Customers/useCustomers'
import './ContactsPage.css'

type DialogMode = 'create' | 'edit' | 'delete' | null

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

function getContactLabel(contact: ContactResponse): string {
  return contact.reference?.trim() || contact.phoneNumber
}

function getContactTableAddress(contact: ContactResponse): string {
  return formatStructuredAddress({
    ...contact,
    city: null,
    region: null,
  })
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

export function ContactsPage() {
  const { roleRank } = useAuth()

  const {
    customers,
    isLoading: isCustomersLoading,
    loadError: customersLoadError,
  } = useCustomers()

  const [customerFilterId] = useState<string | null>(null)
  const {
    contacts,
    isLoading: isContactsLoading,
    loadError: contactsLoadError,
    reload,
    upsertContact,
    removeContact,
  } = useContacts(customerFilterId)

  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selectedContact, setSelectedContact] = useState<ContactResponse | null>(
    null,
  )
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletePermanent, setDeletePermanent] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const canHardDelete = (roleRank ?? 0) >= MANAGER_RANK
  const canEdit = (roleRank ?? 0) >= EDITOR_RANK
  const isLoading = isCustomersLoading || isContactsLoading
  const loadError = customersLoadError ?? contactsLoadError

  const resetDeleteDialog = useCallback(() => {
    setDialogMode((mode) => (mode === 'delete' ? null : mode))
    setSelectedContact(null)
    setDeletePermanent(false)
    setActionError(null)
  }, [])

  const deleteDialog = useGuardedDialog({
    isOpen: dialogMode === 'delete',
    isDirty: deletePermanent,
    onClose: resetDeleteDialog,
  })

  const customerById = useMemo(() => {
    const map = new Map<string, CustomerResponse>()
    for (const customer of customers) {
      map.set(customer.id, customer)
    }
    return map
  }, [customers])

  function getCustomerName(customerId: string): string {
    const customer = customerById.get(customerId)
    return customer ? getCustomerAlias(customer) : customerId
  }

  function openCreateModal() {
    setSelectedContact(null)
    setDialogMode('create')
    setFormModalOpen(true)
  }

  function openEditModal(contact: ContactResponse) {
    setSelectedContact(contact)
    setDialogMode('edit')
    setFormModalOpen(true)
  }

  function closeFormModal() {
    setFormModalOpen(false)
    setDialogMode((mode) => (mode === 'create' || mode === 'edit' ? null : mode))
    setSelectedContact(null)
  }

  function handleFormSuccess(contact: ContactResponse) {
    upsertContact(contact)
    closeFormModal()
    setFeedback({
      type: 'success',
      message:
        dialogMode === 'create'
          ? `Contacto ${getContactLabel(contact)} creado.`
          : `Contacto ${getContactLabel(contact)} actualizado.`,
    })
  }

  function openDeleteDialog(contact: ContactResponse) {
    setSelectedContact(contact)
    setDeletePermanent(false)
    setActionError(null)
    setDialogMode('delete')
    deleteDialog.dialogRef.current?.showModal()
  }

  function closeDeleteDialog() {
    deleteDialog.close()
  }

  async function handleDeleteConfirm() {
    if (!selectedContact) {
      return
    }

    setActionError(null)
    setIsSubmitting(true)

    try {
      await deleteContact(selectedContact.id, {
        permanent: deletePermanent && canHardDelete,
      })
      removeContact(selectedContact.id)
      closeDeleteDialog()
      setFeedback({
        type: 'success',
        message: deletePermanent
          ? `Contacto ${getContactLabel(selectedContact)} eliminado permanentemente.`
          : `Contacto ${getContactLabel(selectedContact)} eliminado.`,
      })
    } catch (caught) {
      setActionError(
        getCatalogApiErrorMessage(
          caught,
          'No se pudo eliminar el contacto. Inténtalo de nuevo.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactColumns: TableLayoutColumn<ContactResponse>[] = [
    buildCatalogActionsColumn<ContactResponse>({
      canEdit,
      edit: { onClick: openEditModal },
      delete: { onClick: openDeleteDialog },
    }),
    {
      key: 'alias',
      header: 'Alias',
      render: (contact) => (
        <div className="catalog-table__name">
          {getCustomerName(contact.customerId)}
        </div>
      ),
      getSortValue: (contact) => getCustomerName(contact.customerId),
    },
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
      getSortValue: (contact) => contact.type,
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (contact) => (
        <ContactPhoneCell phoneNumber={contact.phoneNumber} />
      ),
      getSortValue: (contact) => contact.phoneNumber,
    },
    {
      key: 'email',
      header: 'Correo electrónico',
      render: (contact) => (
        <span className="catalog-table__muted">
          {contact.email ?? '—'}
        </span>
      ),
      getSortValue: (contact) => contact.email ?? '',
    },
    {
      key: 'address',
      header: 'Dirección',
      cellClassName: 'contacts-table__address',
      render: (contact) => (
        <span className="catalog-table__muted">
          {getContactTableAddress(contact)}
        </span>
      ),
      getSearchValue: (contact) => getStructuredAddressSearchText(contact),
      getSortValue: (contact) => getContactTableAddress(contact),
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

  return (
    <div className="page-content catalog-page">
      <div className="catalog-page__header">
        <div className="catalog-page__intro">
          <h1 className="page-content__title">Contactos</h1>
          <p className="page-content__subtitle">
            Medios de contacto y direcciones asociadas a clientes.
          </p>
        </div>

        <RoleGate minRoleRank={EDITOR_RANK}>
          <button
            type="button"
            className="catalog-btn catalog-btn--add"
            onClick={openCreateModal}
            disabled={isLoading || Boolean(loadError) || customers.length === 0}
          >
            Añadir
          </button>
        </RoleGate>
      </div>

      {feedback && (
        <div
          className={`catalog-feedback auth-alert auth-alert--${feedback.type}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </div>
      )}

      {isLoading && (
        <p className="catalog-empty">Cargando contactos…</p>
      )}

      {!isLoading && loadError && (
        <div className="auth-alert auth-alert--error" role="alert">
          {loadError}
          <div className="catalog-page__retry">
            <button
              type="button"
              className="catalog-btn catalog-btn--secondary"
              onClick={() => {
                void reload()
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {!isLoading && !loadError && customers.length === 0 && (
        <p className="catalog-empty">
          No hay clientes registrados. Crea un cliente antes de añadir contactos.
        </p>
      )}

      {!isLoading &&
        !loadError &&
        customers.length > 0 &&
        contacts.length === 0 && (
          <p className="catalog-empty">
            {customerFilterId
              ? 'No hay contactos para el cliente seleccionado.'
              : 'No hay contactos registrados.'}
          </p>
        )}

      {!isLoading && !loadError && contacts.length > 0 && (
        <TableLayout
          columns={contactColumns}
          items={contacts}
          getItemKey={(contact) => contact.id}
          className="contacts-table"
        />
      )}

      <ContactFormModal
        key={
          formModalOpen
            ? `${dialogMode}-${selectedContact?.id ?? 'new'}-${customerFilterId ?? 'all'}`
            : 'closed'
        }
        open={formModalOpen}
        mode={dialogMode === 'edit' ? 'edit' : 'create'}
        contact={selectedContact ?? undefined}
        customers={customers}
        defaultCustomerId={customerFilterId}
        onClose={closeFormModal}
        onSuccess={handleFormSuccess}
      />

      <dialog
        ref={deleteDialog.dialogRef}
        className="catalog-modal catalog-delete-dialog"
        onClose={deleteDialog.handleDialogClose}
        onCancel={deleteDialog.handleDialogCancel}
        aria-labelledby="delete-contact-title"
      >
        <div className="catalog-modal__inner">
          <h2 id="delete-contact-title" className="catalog-modal__title">
            Eliminar contacto
          </h2>
          <p className="catalog-delete-dialog__description">
            {selectedContact
              ? deletePermanent
                ? `Se eliminará permanentemente el contacto ${getContactLabel(selectedContact)}. Esta acción no se puede deshacer.`
                : `¿Eliminar el contacto ${getContactLabel(selectedContact)}? Dejará de aparecer en el catálogo.`
              : 'El contacto dejará de aparecer en el catálogo.'}
          </p>

          {actionError && (
            <div className="auth-alert auth-alert--error" role="alert">
              {actionError}
            </div>
          )}

          {canHardDelete && (
            <label className="catalog-delete-dialog__checkbox">
              <input
                type="checkbox"
                checked={deletePermanent}
                disabled={isSubmitting}
                onChange={(event) => setDeletePermanent(event.target.checked)}
              />
              <span>Eliminar permanentemente (no se puede restaurar)</span>
            </label>
          )}

          <div className="catalog-modal__actions">
            <button
              type="button"
              className="catalog-modal-btn catalog-modal-btn--secondary"
              disabled={isSubmitting}
              onClick={() => void deleteDialog.attemptClose()}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={`catalog-modal-btn ${deletePermanent ? 'catalog-btn--danger' : 'catalog-modal-btn--primary'}`}
              disabled={isSubmitting}
              onClick={() => void handleDeleteConfirm()}
            >
              {isSubmitting
                ? 'Eliminando…'
                : deletePermanent
                  ? 'Borrar permanentemente'
                  : 'Borrar'}
            </button>
          </div>
        </div>
      </dialog>
      {deleteDialog.confirmDialog}
    </div>
  )
}
