import { UNSAVED_CHANGES_MESSAGE } from './unsaved-changes-messages'

export type ConfirmUnsavedChangesOptions = {
  message?: string
  confirm?: (message: string) => boolean
}

export async function confirmUnsavedChangesClose(
  isDirty: boolean,
  options: ConfirmUnsavedChangesOptions = {},
): Promise<boolean> {
  if (!isDirty) {
    return true
  }

  const message = options.message ?? UNSAVED_CHANGES_MESSAGE
  const confirm = options.confirm ?? window.confirm.bind(window)
  return confirm(message)
}
