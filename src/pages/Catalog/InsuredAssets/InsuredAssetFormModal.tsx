import { useId, useMemo, useState } from 'react'
import {
  createInsuredAsset,
  updateInsuredAsset,
} from '../../../api/catalog'
import type {
  AssuranceCompanyResponse,
  CustomerResponse,
  InsuredAssetResponse,
  InsuredAssetType,
  InsurancePolicyResponse,
} from '../../../api/catalog'
import { CatalogModal } from '../../../components/CatalogModal'
import { FieldHelpTrigger } from '../../../components/FieldHelp'
import {
  FieldFeedback,
  RequiredMark,
  getFieldAriaProps,
  getFieldFeedbackId,
  getFieldInputErrorClass,
  getVisibleFieldError,
} from '../../../components/FormField'
import { useCatalogFormErrors } from '../../../hooks/useCatalogFormErrors'
import { isBuilderSuccessValue } from '../../../types/form-errors'
import {
  AddressFormBlock,
  type AddressFormValues,
} from '../../../components/AddressFormBlock'
import { CustomerMultiSelect } from './CustomerMultiSelect'
import { InsurancePolicyCombobox } from '../components/InsurancePolicyCombobox'
import {
  INSURED_ASSET_TYPES,
  buildCreatePayload,
  buildInitialValues,
  buildUpdatePayload,
  filterFieldErrorsForInsuredAssetType,
  getVisibleInsuredAssetFieldKeys,
  isAutomovilType,
  isInvernaderoType,
  isLocationType,
  isPersonasType,
  isSacType,
  type InsuredAssetFormValues,
  type InsuredAssetFieldErrors,
} from './insured-asset-form-utils'

function isPolicyEligibleForNewAsset(policy: InsurancePolicyResponse): boolean {
  return policy.status !== 'Cancelada' && !policy.cancelledAt
}

type InsuredAssetFormModalProps = {
  open: boolean
  mode: 'create' | 'edit'
  asset?: InsuredAssetResponse
  policies: InsurancePolicyResponse[]
  customers: CustomerResponse[]
  assuranceCompanies?: AssuranceCompanyResponse[]
  defaultPolicyId?: string | null
  policyLocked?: boolean
  isLoadingOptions?: boolean
  onClose: () => void
  onSuccess: (asset: InsuredAssetResponse) => void
}

export function InsuredAssetFormModal({
  open,
  mode,
  asset,
  policies,
  customers,
  assuranceCompanies = [],
  defaultPolicyId = null,
  policyLocked = false,
  isLoadingOptions = false,
  onClose,
  onSuccess,
}: InsuredAssetFormModalProps) {
  const formId = useId()
  const selectablePolicies =
    mode === 'create' ? policies.filter(isPolicyEligibleForNewAsset) : policies
  const selectableDefaultPolicyId =
    mode === 'create' &&
    defaultPolicyId &&
    !selectablePolicies.some((policy) => policy.id === defaultPolicyId)
      ? null
      : defaultPolicyId
  const [values, setValues] = useState<InsuredAssetFormValues>(() =>
    buildInitialValues(asset, selectableDefaultPolicyId),
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
    applyBuilderResult,
    applyApiError,
    applyFormError,
    retainFieldErrors,
  } = useCatalogFormErrors<keyof InsuredAssetFieldErrors>()

  const effectiveType =
    mode === 'edit' && asset ? asset.type : (values.type as InsuredAssetType | '')
  const isDisabled = isSubmitting || isLoadingOptions
  const visibleFieldErrors = useMemo(
    () => filterFieldErrorsForInsuredAssetType(fieldErrors, effectiveType),
    [fieldErrors, effectiveType],
  )
  const errorOptions = {
    fieldErrors: visibleFieldErrors,
    showErrors: submitted,
    touchedFields,
  }

  function visibleError(field: keyof InsuredAssetFormValues): string | null {
    return getVisibleFieldError(field, errorOptions)
  }

  function updateField<K extends keyof InsuredAssetFormValues>(
    field: K,
    value: InsuredAssetFormValues[K],
  ) {
    clearFieldError(field)
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleTypeChange(nextType: InsuredAssetType | '') {
    setValues((current) => ({
      ...buildInitialValues(undefined, current.insurancePolicyId),
      insurancePolicyId: current.insurancePolicyId,
      type: nextType,
      insuredSum: current.insuredSum,
    }))
    retainFieldErrors(getVisibleInsuredAssetFieldKeys(nextType))
  }

  function handleAddressChange(addressValues: AddressFormValues) {
    for (const key of Object.keys(addressValues) as (keyof AddressFormValues)[]) {
      if (values[key] !== addressValues[key]) {
        clearFieldError(key)
      }
    }
    setValues((current) => ({ ...current, ...addressValues }))
  }

  async function handleSubmit() {
    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        const payload = buildCreatePayload(values)
        if (applyBuilderResult(payload)) {
          return
        }
        if (!isBuilderSuccessValue(payload)) {
          return
        }

        const created = await createInsuredAsset(payload)
        onSuccess(created)
        return
      }

      if (!asset) {
        applyFormError('No se encontró el bien a editar.')
        return
      }

      const payload = buildUpdatePayload(values, asset)
      if (applyBuilderResult(payload)) {
        return
      }
      if (!isBuilderSuccessValue(payload)) {
        return
      }

      const updated = await updateInsuredAsset(asset.id, payload)
      onSuccess(updated)
    } catch (caught) {
      applyApiError(caught, {
        entity: 'insured-asset',
        fallback:
          mode === 'create'
            ? 'No se pudo crear el bien asegurado. Inténtalo de nuevo.'
            : 'No se pudo actualizar el bien asegurado. Inténtalo de nuevo.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const title =
    mode === 'create' ? 'Nuevo bien asegurado' : 'Editar bien asegurado'
  const initialValues = useMemo(
    () => buildInitialValues(asset, selectableDefaultPolicyId),
    [asset, selectableDefaultPolicyId],
  )
  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [values, initialValues],
  )

  function handleResetAction() {
    setValues(initialValues)
    resetFormErrors()
  }

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
      <InsurancePolicyCombobox
        policies={selectablePolicies}
        customers={customers}
        assuranceCompanies={assuranceCompanies}
        value={values.insurancePolicyId}
        onChange={(policyId) => updateField('insurancePolicyId', policyId)}
        label="Póliza"
        required
        disabled={isDisabled || policyLocked}
        isLoading={isLoadingOptions}
        feedbackId={getFieldFeedbackId(formId, 'insurancePolicyId')}
        fieldError={visibleError('insurancePolicyId')}
        onFieldBlur={() => touchField('insurancePolicyId')}
      />

      <div className="catalog-form__row insured-assets-form__row--summary">
        <div className="auth-form__field">
          <div className="catalog-form__label-row">
            <label className="auth-form__label" htmlFor={`${formId}-type`}>
              Tipo de bien
              <RequiredMark />
            </label>
            {mode === 'edit' && (
              <FieldHelpTrigger
                label="Ayuda sobre el tipo de bien"
              >
                El tipo no se puede modificar tras crear el bien.
              </FieldHelpTrigger>
            )}
          </div>
          <select
            id={`${formId}-type`}
            className={`auth-form__input catalog-form__select${getFieldInputErrorClass(visibleError('type'))}`}
            name="type"
            value={mode === 'edit' && asset ? asset.type : values.type}
            required
            disabled={isDisabled || mode === 'edit'}
            {...getFieldAriaProps(
              getFieldFeedbackId(formId, 'type'),
              visibleError('type'),
            )}
            onBlur={() => touchField('type')}
            onChange={(event) =>
              handleTypeChange(event.target.value as InsuredAssetType | '')
            }
          >
            <option value="" disabled>
              Selecciona un tipo
            </option>
            {INSURED_ASSET_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'type')}
            message={visibleError('type')}
          />
        </div>

        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-insuredSum`}>
            Suma asegurada
            <RequiredMark />
          </label>
          <input
            id={`${formId}-insuredSum`}
            className={`auth-form__input${getFieldInputErrorClass(visibleError('insuredSum'))}`}
            type="number"
            name="insuredSum"
            value={values.insuredSum}
            min={0}
            step={0.01}
            required
            disabled={isDisabled}
            {...getFieldAriaProps(
              getFieldFeedbackId(formId, 'insuredSum'),
              visibleError('insuredSum'),
            )}
            onBlur={() => touchField('insuredSum')}
            onChange={(event) => updateField('insuredSum', event.target.value)}
          />
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'insuredSum')}
            message={visibleError('insuredSum')}
          />
        </div>

        <div className="auth-form__field">
          <label className="auth-form__label" htmlFor={`${formId}-currency`}>
            Moneda
          </label>
          <input
            id={`${formId}-currency`}
            className="auth-form__input"
            type="text"
            name="currency"
            value={asset?.currency ?? 'EUR'}
            readOnly
            disabled
            aria-readonly="true"
          />
          <FieldFeedback
            id={getFieldFeedbackId(formId, 'currency')}
            message={null}
          />
        </div>
      </div>

      {effectiveType && isAutomovilType(effectiveType) && (
        <div>
          <div className="catalog-form__row">
            <div className="auth-form__field">
              <label
                className="auth-form__label"
                htmlFor={`${formId}-plateNumber`}
              >
                Matrícula
                <RequiredMark />
              </label>
              <input
                id={`${formId}-plateNumber`}
                className={`auth-form__input${getFieldInputErrorClass(visibleError('plateNumber'))}`}
                type="text"
                name="plateNumber"
                value={values.plateNumber}
                maxLength={32}
                required
                disabled={isDisabled}
                {...getFieldAriaProps(
                  getFieldFeedbackId(formId, 'plateNumber'),
                  visibleError('plateNumber'),
                )}
                onBlur={() => touchField('plateNumber')}
                onChange={(event) =>
                  updateField('plateNumber', event.target.value.toUpperCase())
                }
              />
              <FieldFeedback
                id={getFieldFeedbackId(formId, 'plateNumber')}
                message={visibleError('plateNumber')}
              />
            </div>

            <div className="auth-form__field">
              <label
                className="auth-form__label"
                htmlFor={`${formId}-vinNumber`}
              >
                Número de bastidor
                <RequiredMark />
              </label>
              <input
                id={`${formId}-vinNumber`}
                className={`auth-form__input${getFieldInputErrorClass(visibleError('vinNumber'))}`}
                type="text"
                name="vinNumber"
                value={values.vinNumber}
                maxLength={64}
                required
                disabled={isDisabled}
                {...getFieldAriaProps(
                  getFieldFeedbackId(formId, 'vinNumber'),
                  visibleError('vinNumber'),
                )}
                onBlur={() => touchField('vinNumber')}
                onChange={(event) =>
                  updateField(
                    'vinNumber',
                    event.target.value.replace(/\s+/g, '').toUpperCase(),
                  )
                }
              />
              <FieldFeedback
                id={getFieldFeedbackId(formId, 'vinNumber')}
                message={visibleError('vinNumber')}
              />
            </div>
          </div>

          <div className="catalog-form__row">
            <div className="auth-form__field">
              <label
                className="auth-form__label"
                htmlFor={`${formId}-manufacturedAt`}
              >
                Fecha de fabricación
                <RequiredMark />
              </label>
              <input
                id={`${formId}-manufacturedAt`}
                className={`auth-form__input${getFieldInputErrorClass(visibleError('manufacturedAt'))}`}
                type="date"
                name="manufacturedAt"
                value={values.manufacturedAt}
                required
                disabled={isDisabled}
                {...getFieldAriaProps(
                  getFieldFeedbackId(formId, 'manufacturedAt'),
                  visibleError('manufacturedAt'),
                )}
                onBlur={() => touchField('manufacturedAt')}
                onChange={(event) =>
                  updateField('manufacturedAt', event.target.value)
                }
              />
              <FieldFeedback
                id={getFieldFeedbackId(formId, 'manufacturedAt')}
                message={visibleError('manufacturedAt')}
              />
            </div>

            <div className="auth-form__field">
              <label className="auth-form__label" htmlFor={`${formId}-color`}>
                Color
              </label>
              <input
                id={`${formId}-color`}
                className={`auth-form__input${getFieldInputErrorClass(visibleError('color'))}`}
                type="text"
                name="color"
                value={values.color}
                maxLength={32}
                disabled={isDisabled}
                {...getFieldAriaProps(
                  getFieldFeedbackId(formId, 'color'),
                  visibleError('color'),
                )}
                onBlur={() => touchField('color')}
                onChange={(event) => updateField('color', event.target.value)}
              />
              <FieldFeedback
                id={getFieldFeedbackId(formId, 'color')}
                message={visibleError('color')}
              />
            </div>
          </div>

          <div className="catalog-form__row insured-assets-form__row--summary">
            <div className="auth-form__field">
              <label className="auth-form__label" htmlFor={`${formId}-brand`}>
                Marca
                <RequiredMark />
              </label>
              <input
                id={`${formId}-brand`}
                className={`auth-form__input${getFieldInputErrorClass(visibleError('brand'))}`}
                type="text"
                name="brand"
                value={values.brand}
                maxLength={64}
                required
                disabled={isDisabled}
                {...getFieldAriaProps(
                  getFieldFeedbackId(formId, 'brand'),
                  visibleError('brand'),
                )}
                onBlur={() => touchField('brand')}
                onChange={(event) => updateField('brand', event.target.value)}
              />
              <FieldFeedback
                id={getFieldFeedbackId(formId, 'brand')}
                message={visibleError('brand')}
              />
            </div>

            <div className="auth-form__field">
              <label className="auth-form__label" htmlFor={`${formId}-model`}>
                Modelo
                <RequiredMark />
              </label>
              <input
                id={`${formId}-model`}
                className={`auth-form__input${getFieldInputErrorClass(visibleError('model'))}`}
                type="text"
                name="model"
                value={values.model}
                maxLength={64}
                required
                disabled={isDisabled}
                {...getFieldAriaProps(
                  getFieldFeedbackId(formId, 'model'),
                  visibleError('model'),
                )}
                onBlur={() => touchField('model')}
                onChange={(event) => updateField('model', event.target.value)}
              />
              <FieldFeedback
                id={getFieldFeedbackId(formId, 'model')}
                message={visibleError('model')}
              />
            </div>

            <div className="auth-form__field">
              <label className="auth-form__label" htmlFor={`${formId}-motor`}>
                Motor
              </label>
              <input
                id={`${formId}-motor`}
                className={`auth-form__input${getFieldInputErrorClass(visibleError('motor'))}`}
                type="text"
                name="motor"
                value={values.motor}
                maxLength={32}
                disabled={isDisabled}
                {...getFieldAriaProps(
                  getFieldFeedbackId(formId, 'motor'),
                  visibleError('motor'),
                )}
                onBlur={() => touchField('motor')}
                onChange={(event) => updateField('motor', event.target.value)}
              />
              <FieldFeedback
                id={getFieldFeedbackId(formId, 'motor')}
                message={visibleError('motor')}
              />
            </div>
          </div>
        </div>
      )}

      {effectiveType && isLocationType(effectiveType) && (
        <div>
          <AddressFormBlock
            formId={formId}
            values={values}
            disabled={isDisabled}
            fieldErrors={visibleFieldErrors}
            showErrors={submitted}
            touchedFields={touchedFields}
            onChange={handleAddressChange}
            onFieldBlur={touchField}
          />

          <div className="catalog-form__row">
            <div className="auth-form__field">
              <label className="auth-form__label" htmlFor={`${formId}-area`}>
                Superficie (m²)
                <RequiredMark />
              </label>
              <input
                id={`${formId}-area`}
                className={`auth-form__input${getFieldInputErrorClass(visibleError('area'))}`}
                type="number"
                name="area"
                value={values.area}
                min={0}
                max={999999}
                step={1}
                required
                disabled={isDisabled}
                {...getFieldAriaProps(
                  getFieldFeedbackId(formId, 'area'),
                  visibleError('area'),
                )}
                onBlur={() => touchField('area')}
                onChange={(event) => updateField('area', event.target.value)}
              />
              <FieldFeedback
                id={getFieldFeedbackId(formId, 'area')}
                message={visibleError('area')}
              />
            </div>

            <div className="auth-form__field">
              <label
                className="auth-form__label"
                htmlFor={`${formId}-builtAt`}
              >
                Fecha de construcción
                <RequiredMark />
              </label>
              <input
                id={`${formId}-builtAt`}
                className={`auth-form__input${getFieldInputErrorClass(visibleError('builtAt'))}`}
                type="date"
                name="builtAt"
                value={values.builtAt}
                required
                disabled={isDisabled}
                {...getFieldAriaProps(
                  getFieldFeedbackId(formId, 'builtAt'),
                  visibleError('builtAt'),
                )}
                onBlur={() => touchField('builtAt')}
                onChange={(event) =>
                  updateField('builtAt', event.target.value)
                }
              />
              <FieldFeedback
                id={getFieldFeedbackId(formId, 'builtAt')}
                message={visibleError('builtAt')}
              />
            </div>
          </div>

          {isInvernaderoType(effectiveType) && (
            <div className="catalog-form__row">
              <div className="auth-form__field">
                <label
                  className="auth-form__label"
                  htmlFor={`${formId}-block`}
                >
                  Polígono
                  <RequiredMark />
                </label>
                <input
                  id={`${formId}-block`}
                  className={`auth-form__input${getFieldInputErrorClass(visibleError('block'))}`}
                  type="text"
                  name="block"
                  value={values.block}
                  maxLength={64}
                  required
                  disabled={isDisabled}
                  {...getFieldAriaProps(
                    getFieldFeedbackId(formId, 'block'),
                    visibleError('block'),
                  )}
                  onBlur={() => touchField('block')}
                  onChange={(event) => updateField('block', event.target.value)}
                />
                <FieldFeedback
                  id={getFieldFeedbackId(formId, 'block')}
                  message={visibleError('block')}
                />
              </div>

              <div className="auth-form__field">
                <label
                  className="auth-form__label"
                  htmlFor={`${formId}-parcel`}
                >
                  Parcela
                  <RequiredMark />
                </label>
                <input
                  id={`${formId}-parcel`}
                  className={`auth-form__input${getFieldInputErrorClass(visibleError('parcel'))}`}
                  type="text"
                  name="parcel"
                  value={values.parcel}
                  maxLength={64}
                  required
                  disabled={isDisabled}
                  {...getFieldAriaProps(
                    getFieldFeedbackId(formId, 'parcel'),
                    visibleError('parcel'),
                  )}
                  onBlur={() => touchField('parcel')}
                  onChange={(event) =>
                    updateField('parcel', event.target.value)
                  }
                />
                <FieldFeedback
                  id={getFieldFeedbackId(formId, 'parcel')}
                  message={visibleError('parcel')}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {effectiveType && isSacType(effectiveType) && (
        <div>
          <div className="catalog-form__row">
            <div className="auth-form__field">
              <label
                className="auth-form__label"
                htmlFor={`${formId}-sowedAt`}
              >
                Fecha de siembra
                <RequiredMark />
              </label>
              <input
                id={`${formId}-sowedAt`}
                className={`auth-form__input${getFieldInputErrorClass(visibleError('sowedAt'))}`}
                type="date"
                name="sowedAt"
                value={values.sowedAt}
                required
                disabled={isDisabled}
                {...getFieldAriaProps(
                  getFieldFeedbackId(formId, 'sowedAt'),
                  visibleError('sowedAt'),
                )}
                onBlur={() => touchField('sowedAt')}
                onChange={(event) => updateField('sowedAt', event.target.value)}
              />
              <FieldFeedback
                id={getFieldFeedbackId(formId, 'sowedAt')}
                message={visibleError('sowedAt')}
              />
            </div>

            <div className="auth-form__field">
              <label className="auth-form__label" htmlFor={`${formId}-crop`}>
                Cultivo (con nombre de variedad)
                <RequiredMark />
              </label>
              <input
                id={`${formId}-crop`}
                className={`auth-form__input${getFieldInputErrorClass(visibleError('crop'))}`}
                type="text"
                name="crop"
                value={values.crop}
                maxLength={64}
                required
                disabled={isDisabled}
                {...getFieldAriaProps(
                  getFieldFeedbackId(formId, 'crop'),
                  visibleError('crop'),
                )}
                onBlur={() => touchField('crop')}
                onChange={(event) => updateField('crop', event.target.value)}
              />
              <FieldFeedback
                id={getFieldFeedbackId(formId, 'crop')}
                message={visibleError('crop')}
              />
            </div>
          </div>

          <div className="auth-form__field">
            <label
              className="auth-form__label"
              htmlFor={`${formId}-insuredProduction`}
            >
              Producción asegurada (Kg)
              <RequiredMark />
            </label>
            <input
              id={`${formId}-insuredProduction`}
              className={`auth-form__input${getFieldInputErrorClass(visibleError('insuredProduction'))}`}
              type="number"
              name="insuredProduction"
              value={values.insuredProduction}
              min={0}
              step={0.01}
              required
              disabled={isDisabled}
              {...getFieldAriaProps(
                getFieldFeedbackId(formId, 'insuredProduction'),
                visibleError('insuredProduction'),
              )}
              onBlur={() => touchField('insuredProduction')}
              onChange={(event) =>
                updateField('insuredProduction', event.target.value)
              }
            />
            <FieldFeedback
              id={getFieldFeedbackId(formId, 'insuredProduction')}
              message={visibleError('insuredProduction')}
            />
          </div>
        </div>
      )}

      {effectiveType && isPersonasType(effectiveType) && (
        <div>
          <CustomerMultiSelect
            customers={customers}
            value={values.customerIds}
            onChange={(customerIds) => updateField('customerIds', customerIds)}
            label="Personas aseguradas"
            required
            disabled={isDisabled}
            isLoading={isLoadingOptions}
            formId={formId}
            fieldError={visibleError('customerIds')}
            onFieldBlur={() => touchField('customerIds')}
          />
        </div>
      )}
    </CatalogModal>
  )
}
