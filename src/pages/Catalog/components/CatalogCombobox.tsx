import '../catalog-shared.css'
import {
  type FocusEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { FieldFeedback, getFieldAriaProps } from '../../../components/FormField'

type CatalogComboboxItem = {
  id: string
}

export type CatalogComboboxMetaItem = {
  value: string | null | undefined
  label?: string
}

type CatalogComboboxProps<TItem extends CatalogComboboxItem> = {
  items: TItem[]
  value: string | null
  onChange: (itemId: string | null) => void
  label: string
  getItemLabel: (item: TItem) => string
  getItemMeta?: (item: TItem) => string | null | undefined
  getItemMetaItems?: (item: TItem) => CatalogComboboxMetaItem[]
  getItemSearchText?: (item: TItem) => string
  disabled?: boolean
  required?: boolean
  allowEmpty?: boolean
  emptyLabel?: string
  emptyMessage?: string
  isLoading?: boolean
  openOnFocus?: boolean
  placeholder?: string
  feedbackId?: string
  fieldError?: string | null
  helpId?: string
  onFieldBlur?: () => void
}

export function CatalogCombobox<TItem extends CatalogComboboxItem>({
  items,
  value,
  onChange,
  label,
  getItemLabel,
  getItemMeta,
  getItemMetaItems,
  getItemSearchText,
  disabled = false,
  required = false,
  allowEmpty = false,
  emptyLabel = 'Sin filtrar',
  emptyMessage = 'No se encontraron elementos.',
  isLoading = false,
  openOnFocus = true,
  placeholder = 'Buscar…',
  feedbackId,
  fieldError = null,
  helpId,
  onFieldBlur,
}: CatalogComboboxProps<TItem>) {
  const inputId = useId()
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === value) ?? null,
    [items, value],
  )
  const selectedLabel = selectedItem ? getItemLabel(selectedItem) : ''

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputValue = isOpen ? query : selectedLabel

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return items
    }

    return items.filter((item) => {
      const labelText = getItemLabel(item)
      const metaText = getItemMeta?.(item) ?? ''
      const metaItemsText = getItemMetaItems
        ? getItemMetaItems(item)
            .map((metaItem) =>
              [metaItem.label, metaItem.value].filter(Boolean).join(' '),
            )
            .join(' ')
        : ''
      const searchText =
        getItemSearchText?.(item) ??
        `${labelText} ${metaText} ${metaItemsText}`.trim()

      return searchText.toLowerCase().includes(normalizedQuery)
    })
  }, [
    items,
    query,
    getItemLabel,
    getItemMeta,
    getItemMetaItems,
    getItemSearchText,
  ])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        if (!selectedItem && allowEmpty) {
          setQuery('')
        }
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [selectedItem, allowEmpty])

  function selectItem(itemId: string | null) {
    onChange(itemId)
    if (itemId) {
      const item = items.find((currentItem) => currentItem.id === itemId)
      setQuery(item ? getItemLabel(item) : '')
    } else {
      setQuery('')
    }
    setIsOpen(false)
  }

  function handleInputChange(nextQuery: string) {
    setQuery(nextQuery)
    setIsOpen(true)

    if (allowEmpty && !nextQuery.trim()) {
      onChange(null)
    }
  }

  function handleInputFocus() {
    if (!disabled && !isLoading && openOnFocus) {
      setQuery(selectedLabel)
      setIsOpen(true)
    }
  }

  function handleInputClick() {
    if (!disabled && !isLoading) {
      setQuery(selectedLabel)
      setIsOpen(true)
    }
  }

  function handleContainerBlur(event: FocusEvent<HTMLDivElement>) {
    const nextFocusedElement = event.relatedTarget
    if (
      nextFocusedElement instanceof Node &&
      containerRef.current?.contains(nextFocusedElement)
    ) {
      return
    }

    setIsOpen(false)
    onFieldBlur?.()
  }

  const showEmptyOption =
    allowEmpty &&
    (!query.trim() ||
      emptyLabel.toLowerCase().includes(query.trim().toLowerCase()))

  function getRenderableMetaItems(item: TItem): CatalogComboboxMetaItem[] {
    if (getItemMetaItems) {
      return getItemMetaItems(item).filter((metaItem) => metaItem.value)
    }

    const meta = getItemMeta?.(item)
    return meta ? [{ value: meta }] : []
  }

  return (
    <div
      className="catalog-combobox auth-form__field"
      ref={containerRef}
      onBlur={handleContainerBlur}
    >
      <label className="auth-form__label" htmlFor={inputId}>
        {label}
        {required && (
          <span className="catalog-form__required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>

      <input
        id={inputId}
        className={`auth-form__input catalog-combobox__input${fieldError ? ' auth-form__input--error' : ''}`}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-required={required || undefined}
        aria-invalid={fieldError ? true : undefined}
        {...(feedbackId
          ? getFieldAriaProps(feedbackId, fieldError, helpId)
          : helpId
            ? { 'aria-describedby': helpId }
            : {})}
        autoComplete="off"
        disabled={disabled || isLoading}
        placeholder={allowEmpty ? emptyLabel : placeholder}
        value={inputValue}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={handleInputFocus}
        onClick={handleInputClick}
      />

      {isOpen && !disabled && !isLoading && (
        <ul
          id={listboxId}
          className="catalog-combobox__list"
          role="listbox"
          aria-label={label}
        >
          {showEmptyOption && (
            <li
              role="option"
              aria-selected={value === null}
              className={`catalog-combobox__option${value === null ? ' catalog-combobox__option--selected' : ''}`}
            >
              <button
                type="button"
                className="catalog-combobox__option-btn"
                onClick={() => selectItem(null)}
              >
                {emptyLabel}
              </button>
            </li>
          )}

          {filteredItems.length === 0 && (
            <li
              className="catalog-combobox__empty"
              aria-live="polite"
            >
              {emptyMessage}
            </li>
          )}

          {filteredItems.map((item) => {
            const itemMetaItems = getRenderableMetaItems(item)

            return (
              <li
                key={item.id}
                role="option"
                aria-selected={value === item.id}
                className={`catalog-combobox__option${value === item.id ? ' catalog-combobox__option--selected' : ''}`}
              >
                <button
                  type="button"
                  className="catalog-combobox__option-btn"
                  onClick={() => selectItem(item.id)}
                >
                  <span className="catalog-combobox__option-name">
                    {getItemLabel(item)}
                  </span>
                  {itemMetaItems.length > 0 && (
                    <span className="catalog-combobox__option-meta">
                      {itemMetaItems.map((metaItem, index) => {
                        const separator =
                          index < itemMetaItems.length - 1 ? ' · ' : ''

                        return (
                          <span
                            key={`${metaItem.label ?? 'meta'}-${metaItem.value}-${index}`}
                            className="catalog-combobox__option-meta-item"
                          >
                            {metaItem.label && (
                              <span className="catalog-combobox__option-meta-label">
                                {metaItem.label}:{' '}
                              </span>
                            )}
                            {metaItem.value}
                            {separator}
                          </span>
                        )
                      })}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {feedbackId && (
        <FieldFeedback id={feedbackId} message={fieldError} />
      )}
    </div>
  )
}
