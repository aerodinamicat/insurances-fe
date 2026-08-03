import '../../Catalog/catalog-shared.css'
import '../../../components/CatalogModal/CatalogModal.css'
import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../../api/client'
import { fetchRoles } from '../../../api/roles'
import type { RoleResponse, UpdateUserPayload, UserResponse } from '../../../api/types'
import {
  createUser,
  deleteUser,
  disableUserLogin,
  enableUserLogin,
  fetchUsers,
  resendUserOnboarding,
  resetUserPassword,
  revokeUserSessions,
  updateUser,
} from '../../../api/users'
import { useAuth } from '../../../auth'
import {
  TableLayout,
  type TableLayoutColumn,
} from '../../../components/TableLayout'
import { buildCatalogActionsColumn } from '../../../components/CatalogRowActions'
import { useGuardedDialog } from '../../../hooks/useGuardedDialog'
import { formatDisplayDateTime } from '../../../utils/date/format-display-datetime'
import { UserForm, type UserFormValues } from './UserForm'
import { sortRolesByImpact } from './role-order'
import './UsersPage.css'

type DialogMode =
  | 'create'
  | 'edit'
  | 'delete'
  | 'reset-password'
  | 'resend-onboarding'
  | 'revoke-sessions'
  | 'disable-login'
  | 'enable-login'
  | null

function formatUserName(user: UserResponse): string {
  return `${user.firstName} ${user.lastName}`.trim()
}

function sortUsers(users: UserResponse[]): UserResponse[] {
  return [...users].sort((a, b) =>
    a.email.localeCompare(b.email, undefined, { sensitivity: 'base' }),
  )
}

function getUserStatusSearchText(user: UserResponse): string {
  const parts: string[] = []

  if (user.confirmedEmailAt) {
    parts.push('Email confirmed')
  } else {
    parts.push('Pending onboarding')
  }

  if (user.mustChangePassword) {
    parts.push('Must change password')
  }

  if (user.loginDisabled) {
    parts.push('Acceso deshabilitado')
  }

  if (user.hasActiveSession) {
    parts.push('Sesión activa')
  } else {
    parts.push('Sin sesión')
  }

  return parts.join(' ')
}

export function UsersPage() {
  const { user: currentUser } = useAuth()

  const [users, setUsers] = useState<UserResponse[]>([])
  const [roles, setRoles] = useState<RoleResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [createFormKey, setCreateFormKey] = useState(0)
  const [createFormDirty, setCreateFormDirty] = useState(false)
  const [editFormDirty, setEditFormDirty] = useState(false)

  const resetCreateDialog = useCallback(() => {
    setDialogMode((mode) => (mode === 'create' ? null : mode))
    setFormError(null)
    setCreateFormDirty(false)
  }, [])

  const resetEditDialog = useCallback(() => {
    setDialogMode((mode) => (mode === 'edit' ? null : mode))
    setSelectedUser(null)
    setFormError(null)
    setEditFormDirty(false)
  }, [])

  const resetConfirmDialog = useCallback(() => {
    setDialogMode((current) =>
      current === 'delete' ||
      current === 'reset-password' ||
      current === 'resend-onboarding' ||
      current === 'revoke-sessions' ||
      current === 'disable-login' ||
      current === 'enable-login'
        ? null
        : current,
    )
    setSelectedUser(null)
    setActionError(null)
  }, [])

  const isCreateDialogOpen = dialogMode === 'create'
  const isEditDialogOpen = dialogMode === 'edit'
  const isConfirmDialogOpen =
    dialogMode === 'delete' ||
    dialogMode === 'reset-password' ||
    dialogMode === 'resend-onboarding' ||
    dialogMode === 'revoke-sessions' ||
    dialogMode === 'disable-login' ||
    dialogMode === 'enable-login'

  const createDialog = useGuardedDialog({
    isOpen: isCreateDialogOpen,
    isDirty: createFormDirty,
    onClose: resetCreateDialog,
  })

  const editDialog = useGuardedDialog({
    isOpen: isEditDialogOpen,
    isDirty: editFormDirty,
    onClose: resetEditDialog,
  })

  const confirmActionDialog = useGuardedDialog({
    isOpen: isConfirmDialogOpen,
    isDirty: false,
    onClose: resetConfirmDialog,
  })
  const {
    dialogRef: createDialogRef,
    handleDialogClose: handleCreateDialogClose,
    handleDialogCancel: handleCreateDialogCancel,
    confirmDialog: createConfirmDialog,
  } = createDialog
  const {
    dialogRef: editDialogRef,
    handleDialogClose: handleEditDialogClose,
    handleDialogCancel: handleEditDialogCancel,
    confirmDialog: editConfirmDialog,
  } = editDialog
  const {
    dialogRef: confirmActionDialogRef,
    handleDialogClose: handleConfirmActionDialogClose,
    handleDialogCancel: handleConfirmActionDialogCancel,
    confirmDialog: confirmActionConfirmDialog,
  } = confirmActionDialog

  const loadData = useCallback(async () => {
    setLoadError(null)

    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        fetchUsers(),
        fetchRoles(),
      ])
      setUsers(sortUsers(usersResponse))
      setRoles(sortRolesByImpact(rolesResponse))
    } catch (caught) {
      setLoadError(
        caught instanceof ApiError
          ? caught.message
          : 'Unable to load users. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const [usersResponse, rolesResponse] = await Promise.all([
          fetchUsers(),
          fetchRoles(),
        ])
        if (cancelled) {
          return
        }
        setUsers(sortUsers(usersResponse))
        setRoles(sortRolesByImpact(rolesResponse))
      } catch (caught) {
        if (cancelled) {
          return
        }
        setLoadError(
          caught instanceof ApiError
            ? caught.message
            : 'Unable to load users. Please try again.',
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  function openCreateDialog() {
    setFormError(null)
    setCreateFormDirty(false)
    setCreateFormKey((key) => key + 1)
    setDialogMode('create')
    createDialog.dialogRef.current?.showModal()
  }

  function openEditDialog(user: UserResponse) {
    setSelectedUser(user)
    setFormError(null)
    setEditFormDirty(false)
    setDialogMode('edit')
    editDialog.dialogRef.current?.showModal()
  }

  function openConfirmDialog(
    mode: Exclude<DialogMode, 'create' | 'edit' | null>,
    user: UserResponse,
  ) {
    setSelectedUser(user)
    setActionError(null)
    setDialogMode(mode)
    confirmActionDialog.dialogRef.current?.showModal()
  }

  function closeCreateDialog() {
    createDialog.close()
  }

  function closeEditDialog() {
    editDialog.close()
  }

  function closeConfirmDialog() {
    confirmActionDialog.close()
  }

  async function handleCreateSubmit(values: UserFormValues) {
    setFormError(null)
    setIsSubmitting(true)

    try {
      const created = await createUser({
        email: values.email.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        roleId: values.roleId,
      })
      setUsers((current) => sortUsers([...current, created]))
      closeCreateDialog()
      setFeedback({
        type: 'success',
        message: `User ${created.email} created. Onboarding email sent.`,
      })
    } catch (caught) {
      setFormError(
        caught instanceof ApiError
          ? caught.message
          : 'Unable to create user. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEditSubmit(values: UserFormValues) {
    if (!selectedUser) {
      return
    }

    setFormError(null)
    setIsSubmitting(true)

    try {
      const payload: UpdateUserPayload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
      }

      if (selectedUser.roleCode !== 'Admin') {
        payload.roleId = values.roleId
      }

      const updated = await updateUser(selectedUser.id, payload)
      setUsers((current) =>
        sortUsers(
          current.map((user) => (user.id === updated.id ? updated : user)),
        ),
      )
      closeEditDialog()
      setFeedback({
        type: 'success',
        message: `User ${updated.email} updated.`,
      })
    } catch (caught) {
      setFormError(
        caught instanceof ApiError
          ? caught.message
          : 'Unable to update user. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleConfirmAction() {
    if (!selectedUser || !dialogMode) {
      return
    }

    setActionError(null)
    setIsSubmitting(true)

    try {
      if (dialogMode === 'delete') {
        await deleteUser(selectedUser.id)
        setUsers((current) =>
          current.filter((user) => user.id !== selectedUser.id),
        )
        setFeedback({
          type: 'success',
          message: `User ${selectedUser.email} permanently deleted.`,
        })
      } else if (dialogMode === 'reset-password') {
        await resetUserPassword(selectedUser.id)
        setUsers((current) =>
          current.map((user) =>
            user.id === selectedUser.id
              ? {
                  ...user,
                  mustChangePassword: true,
                  hasActiveSession: false,
                  activeSessionCount: 0,
                }
              : user,
          ),
        )
        setFeedback({
          type: 'success',
          message: `Password reset requested for ${selectedUser.email}.`,
        })
      } else if (dialogMode === 'resend-onboarding') {
        await resendUserOnboarding(selectedUser.id)
        setFeedback({
          type: 'success',
          message: `Onboarding email resent to ${selectedUser.email}.`,
        })
      } else if (dialogMode === 'revoke-sessions') {
        await revokeUserSessions(selectedUser.id)
        setUsers((current) =>
          current.map((user) =>
            user.id === selectedUser.id
              ? {
                  ...user,
                  hasActiveSession: false,
                  activeSessionCount: 0,
                }
              : user,
          ),
        )
        setFeedback({
          type: 'success',
          message: `All sessions revoked for ${selectedUser.email}.`,
        })
      } else if (dialogMode === 'disable-login') {
        await disableUserLogin(selectedUser.id)
        setUsers((current) =>
          current.map((user) =>
            user.id === selectedUser.id
              ? {
                  ...user,
                  loginDisabled: true,
                  hasActiveSession: false,
                  activeSessionCount: 0,
                }
              : user,
          ),
        )
        setFeedback({
          type: 'success',
          message: `Login disabled for ${selectedUser.email}.`,
        })
      } else if (dialogMode === 'enable-login') {
        await enableUserLogin(selectedUser.id)
        setUsers((current) =>
          current.map((user) =>
            user.id === selectedUser.id
              ? { ...user, loginDisabled: false }
              : user,
          ),
        )
        setFeedback({
          type: 'success',
          message: `Login enabled for ${selectedUser.email}.`,
        })
      }

      closeConfirmDialog()
    } catch (caught) {
      setActionError(
        caught instanceof ApiError
          ? caught.message
          : 'Action failed. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function getConfirmCopy(): { title: string; description: string; confirmLabel: string; danger: boolean } {
    switch (dialogMode) {
      case 'delete':
        return {
          title: 'Delete user permanently',
          description: selectedUser
            ? `This will permanently delete ${selectedUser.email}. This action cannot be undone.`
            : 'This action cannot be undone.',
          confirmLabel: 'Delete permanently',
          danger: true,
        }
      case 'reset-password':
        return {
          title: 'Reset password',
          description: selectedUser
            ? `Force ${selectedUser.email} to set a new password on next sign-in. Active sessions will be revoked.`
            : 'The user will need to set a new password on next sign-in.',
          confirmLabel: 'Reset password',
          danger: false,
        }
      case 'resend-onboarding':
        return {
          title: 'Resend onboarding email',
          description: selectedUser
            ? `Send a new onboarding link to ${selectedUser.email}.`
            : 'Send a new onboarding link to this user.',
          confirmLabel: 'Resend email',
          danger: false,
        }
      case 'revoke-sessions':
        return {
          title: 'Cerrar todas las sesiones',
          description: selectedUser
            ? `Revocar todas las sesiones activas de ${selectedUser.email}. El usuario deberá iniciar sesión de nuevo.`
            : 'Revocar todas las sesiones activas de este usuario.',
          confirmLabel: 'Cerrar sesiones',
          danger: false,
        }
      case 'disable-login':
        return {
          title: 'Deshabilitar acceso',
          description: selectedUser
            ? `Impedir que ${selectedUser.email} inicie sesión. Sus sesiones activas se cerrarán.`
            : 'Impedir que este usuario inicie sesión.',
          confirmLabel: 'Deshabilitar acceso',
          danger: true,
        }
      case 'enable-login':
        return {
          title: 'Habilitar acceso',
          description: selectedUser
            ? `Permitir de nuevo que ${selectedUser.email} inicie sesión.`
            : 'Permitir de nuevo que este usuario inicie sesión.',
          confirmLabel: 'Habilitar acceso',
          danger: false,
        }
      default:
        return {
          title: 'Confirm action',
          description: '',
          confirmLabel: 'Confirm',
          danger: false,
        }
    }
  }

  const confirmCopy = getConfirmCopy()
  const isSelf = selectedUser?.id === currentUser?.id

  const userColumns: TableLayoutColumn<UserResponse>[] = [
      buildCatalogActionsColumn<UserResponse>({
        canEdit: true,
        canDelete: true,
        custom: [
          {
            label: 'Reenviar onboarding',
            onClick: (user) => openConfirmDialog('resend-onboarding', user),
            hidden: (user) => Boolean(user.confirmedEmailAt),
          },
        ],
        edit: { onClick: openEditDialog },
        delete: {
          onClick: (user) => openConfirmDialog('delete', user),
          disabled: (user) => user.id === currentUser?.id,
          title: (user) =>
            user.id === currentUser?.id
              ? 'No puedes borrar tu propia cuenta'
              : undefined,
        },
      }),
      {
        key: 'password',
        header: 'Contraseña',
        headerClassName: 'table-layout__actions',
        cellClassName: 'table-layout__actions',
        render: (user) => (
          <button
            type="button"
            className="catalog-table-action-btn"
            onClick={() => openConfirmDialog('reset-password', user)}
          >
            Restablecer
          </button>
        ),
        getSearchValue: () => '',
        getSortValue: () => '',
      },
      {
        key: 'access',
        header: 'Acceso',
        headerClassName: 'table-layout__actions',
        cellClassName: 'table-layout__actions',
        render: (user) =>
          user.loginDisabled ? (
            <button
              type="button"
              className="catalog-table-action-btn"
              onClick={() => openConfirmDialog('enable-login', user)}
            >
              Habilitar
            </button>
          ) : (
            <button
              type="button"
              className="catalog-table-action-btn"
              onClick={() => openConfirmDialog('disable-login', user)}
              disabled={user.id === currentUser?.id}
              title={
                user.id === currentUser?.id
                  ? 'No puedes deshabilitar tu propio acceso'
                  : undefined
              }
            >
              Deshabilitar
            </button>
          ),
        getSearchValue: () => '',
        getSortValue: (user) => (user.loginDisabled ? '1' : '0'),
      },
      {
        key: 'sessions',
        header: 'Sesiones',
        headerClassName: 'table-layout__actions',
        cellClassName: 'table-layout__actions',
        render: (user) => {
          const isCurrentUser = user.id === currentUser?.id
          const sessionLabel = user.hasActiveSession
            ? user.activeSessionCount > 1
              ? `Activa (${user.activeSessionCount})`
              : 'Activa'
            : 'Inactiva'

          return (
            <span className="users-table__session-cell">
              <button
                type="button"
                className="catalog-table-action-btn"
                onClick={() => openConfirmDialog('revoke-sessions', user)}
                disabled={!user.hasActiveSession || isCurrentUser}
                title={
                  isCurrentUser
                    ? 'No puedes cerrar tus propias sesiones desde aquí'
                    : !user.hasActiveSession
                      ? 'No hay sesiones activas'
                      : undefined
                }
              >
                Cerrar todas
              </button>
              <span
                className={
                  user.hasActiveSession
                    ? 'catalog-badge catalog-badge--session-active'
                    : 'catalog-badge catalog-badge--session-inactive'
                }
              >
                {sessionLabel}
              </span>
            </span>
          )
        },
        getSearchValue: (user) =>
          user.hasActiveSession ? 'Sesión activa' : 'Sin sesión',
        getSortValue: (user) => (user.hasActiveSession ? '1' : '0'),
      },
      {
        key: 'user',
        header: 'Usuario',
        render: (user) => {
          const isCurrentUser = user.id === currentUser?.id

          return (
            <span className="users-table__identity">
              <span className="catalog-table__name">
                {formatUserName(user)}
                {isCurrentUser && (
                  <span className="catalog-badge catalog-badge--you">you</span>
                )}
              </span>
              <span className="users-table__identity-separator"> · </span>
              <span className="users-table__email">{user.email}</span>
            </span>
          )
        },
        getSearchValue: (user) => `${formatUserName(user)} ${user.email}`,
        getSortValue: (user) => user.email,
      },
      {
        key: 'role',
        header: 'Rol',
        render: (user) => (
          <span className="catalog-badge catalog-badge--user-role">
            {user.roleCode ?? '—'}
          </span>
        ),
        getSortValue: (user) => user.roleCode ?? '',
      },
      {
        key: 'status',
        header: 'Estado',
        render: (user) => (
          <div className="users-table__badges">
            {user.confirmedEmailAt ? (
              <span className="catalog-badge catalog-badge--email-confirmed">
                Email confirmed
              </span>
            ) : (
              <span className="catalog-badge catalog-badge--onboarding-pending">
                Pending onboarding
              </span>
            )}
            {user.mustChangePassword && (
              <span className="catalog-badge catalog-badge--must-change-password">
                Must change password
              </span>
            )}
            {user.loginDisabled && (
              <span className="catalog-badge catalog-badge--login-disabled">
                Acceso deshabilitado
              </span>
            )}
          </div>
        ),
        getSearchValue: getUserStatusSearchText,
        getSortValue: getUserStatusSearchText,
      },
      {
        key: 'lastLoginAt',
        header: 'Último acceso',
        render: (user) => formatDisplayDateTime(user.lastLoginAt),
        getSearchValue: (user) => formatDisplayDateTime(user.lastLoginAt),
        getSortValue: (user) => user.lastLoginAt ?? '',
      },
    ]

  return (
    <div className="page-content catalog-page catalog-page--modal-narrow">
      <div className="catalog-page__header">
        <div className="catalog-page__intro">
          <h1 className="page-content__title">Usuarios</h1>
          <p className="page-content__subtitle">
            Gestiona las cuentas de los usuarios, los roles y el onboarding.
          </p>
        </div>
        <button
          type="button"
          className="catalog-btn catalog-btn--add"
          onClick={openCreateDialog}
          disabled={isLoading || Boolean(loadError)}
        >
          Añadir
        </button>
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
        <p className="catalog-empty">Loading users…</p>
      )}

      {!isLoading && loadError && (
        <div className="auth-alert auth-alert--error" role="alert">
          {loadError}
          <div className="catalog-page__retry">
            <button
              type="button"
              className="catalog-btn catalog-btn--secondary"
              onClick={() => {
                setIsLoading(true)
                void loadData()
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!isLoading && !loadError && users.length === 0 && (
        <p className="catalog-empty">No users found.</p>
      )}

      {!isLoading && !loadError && users.length > 0 && (
        <TableLayout
          columns={userColumns}
          items={users}
          getItemKey={(user) => user.id}
        />
      )}

      <dialog
        ref={createDialogRef}
        className="catalog-modal"
        onClose={handleCreateDialogClose}
        onCancel={handleCreateDialogCancel}
        aria-labelledby="create-user-title"
      >
        <div className="catalog-modal__inner">
          <h2 id="create-user-title" className="catalog-modal__title">
            Create user
          </h2>
          <p className="catalog-modal__description">
            Add a new staff member. They will receive an email to confirm their
            address and set a password.
          </p>
          <UserForm
            key={createFormKey}
            mode="create"
            roles={roles}
            isSubmitting={isSubmitting}
            error={formError}
            onSubmit={handleCreateSubmit}
            onCancel={() => void createDialog.attemptClose()}
            onDirtyChange={setCreateFormDirty}
          />
        </div>
      </dialog>
      {createConfirmDialog}

      <dialog
        ref={editDialogRef}
        className="catalog-modal"
        onClose={handleEditDialogClose}
        onCancel={handleEditDialogCancel}
        aria-labelledby="edit-user-title"
      >
        <div className="catalog-modal__inner">
          <h2 id="edit-user-title" className="catalog-modal__title">
            Edit user
          </h2>
          <p className="catalog-modal__description">
            Update account details for {selectedUser?.email ?? 'this user'}.
          </p>
          {selectedUser && (
            <UserForm
              key={selectedUser.id}
              mode="edit"
              roles={roles}
              initialUser={selectedUser}
              isSubmitting={isSubmitting}
              error={formError}
              onSubmit={handleEditSubmit}
              onCancel={() => void editDialog.attemptClose()}
              onDirtyChange={setEditFormDirty}
            />
          )}
        </div>
      </dialog>
      {editConfirmDialog}

      <dialog
        ref={confirmActionDialogRef}
        className="catalog-modal catalog-delete-dialog"
        onClose={handleConfirmActionDialogClose}
        onCancel={handleConfirmActionDialogCancel}
        aria-labelledby="confirm-action-title"
      >
        <div className="catalog-modal__inner">
          <h2 id="confirm-action-title" className="catalog-modal__title">
            {confirmCopy.title}
          </h2>
          <p className="catalog-delete-dialog__description">{confirmCopy.description}</p>

          {actionError && (
            <div className="auth-alert auth-alert--error" role="alert">
              {actionError}
            </div>
          )}

          {dialogMode === 'delete' && isSelf && (
            <div className="auth-alert auth-alert--error" role="alert">
              You cannot delete your own account.
            </div>
          )}

          {dialogMode === 'disable-login' && isSelf && (
            <div className="auth-alert auth-alert--error" role="alert">
              No puedes deshabilitar tu propio acceso.
            </div>
          )}

          <div className="catalog-modal__actions">
            <button
              type="button"
              className="catalog-modal-btn catalog-modal-btn--secondary"
              disabled={isSubmitting}
              onClick={() => void confirmActionDialog.attemptClose()}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`catalog-modal-btn ${confirmCopy.danger ? 'catalog-btn--danger' : 'catalog-modal-btn--primary'}`}
              disabled={
                isSubmitting ||
                (dialogMode === 'delete' && isSelf) ||
                (dialogMode === 'disable-login' && isSelf)
              }
              onClick={() => void handleConfirmAction()}
            >
              {isSubmitting ? 'Processing…' : confirmCopy.confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
      {confirmActionConfirmDialog}
    </div>
  )
}
