import { confirmUnsavedChangesClose } from './confirmUnsavedChangesClose'

describe('confirmUnsavedChangesClose', () => {
  it('returns true when the form is not dirty', async () => {
    await expect(confirmUnsavedChangesClose(false)).resolves.toBe(true)
  })

  it('returns true when the user confirms closing', async () => {
    let confirmCalled = false

    await expect(
      confirmUnsavedChangesClose(true, {
        confirm: () => {
          confirmCalled = true
          return true
        },
      }),
    ).resolves.toBe(true)

    expect(confirmCalled).toBe(true)
  })

  it('returns false when the user cancels closing', async () => {
    let confirmCalled = false

    await expect(
      confirmUnsavedChangesClose(true, {
        confirm: () => {
          confirmCalled = true
          return false
        },
      }),
    ).resolves.toBe(false)

    expect(confirmCalled).toBe(true)
  })
})
