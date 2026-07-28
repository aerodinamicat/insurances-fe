import '@testing-library/jest-dom/vitest'

if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true
  }
}

if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function close(returnValue?: string) {
    this.open = false
    this.dispatchEvent(
      new Event('close', { bubbles: false, cancelable: false }),
    )
    if (returnValue) {
      this.returnValue = returnValue
    }
  }
}

afterEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})
