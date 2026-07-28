import type {
  CreateInsuredAssetPayload,
  InsuredAssetResponse,
  InsuredAssetType,
  UpdateInsuredAssetPayload,
} from '../../../api/catalog'
import { getInsuredAssetAlias } from '../../../api/catalog'
import {
  buildAddressPayload,
  createAddressFieldState,
  getGpsFieldValidationError,
  type AddressFormValues,
} from '../../../components/AddressFormBlock'
import type { BuilderResult, FieldErrors } from '../../../types/form-errors'
import { hasFieldErrors } from '../../../types/form-errors'
import {
  formatStructuredAddress,
  type StructuredAddressFields,
} from '../../../utils/address'

export const INSURED_ASSET_TYPES: InsuredAssetType[] = [
  'Automóvil',
  'Inmueble',
  'Instalación',
  'Invernadero',
  'SAC',
  'Persona/s',
]

export type InsuredAssetFormValues = {
  insurancePolicyId: string | null
  type: InsuredAssetType | ''
  insuredSum: string
  plateNumber: string
  brand: string
  model: string
  motor: string
  color: string
  vinNumber: string
  manufacturedAt: string
  area: string
  builtAt: string
  block: string
  parcel: string
  sowedAt: string
  crop: string
  insuredProduction: string
  customerIds: string[]
} & AddressFormValues

export type InsuredAssetFieldErrors = FieldErrors<keyof InsuredAssetFormValues>

export function isInmuebleType(type: InsuredAssetType): boolean {
  return type === 'Inmueble'
}

export function isInstalacionType(type: InsuredAssetType): boolean {
  return type === 'Instalación'
}

export function isBuildingType(type: InsuredAssetType): boolean {
  return isInmuebleType(type) || isInstalacionType(type)
}

export function isLocationType(type: InsuredAssetType): boolean {
  return isBuildingType(type) || isInvernaderoType(type)
}

export function isAutomovilType(type: InsuredAssetType): boolean {
  return type === 'Automóvil'
}

export function isInvernaderoType(type: InsuredAssetType): boolean {
  return type === 'Invernadero'
}

export function isSacType(type: InsuredAssetType): boolean {
  return type === 'SAC'
}

export function isPersonasType(type: InsuredAssetType): boolean {
  return type === 'Persona/s'
}

export function parseCustomerIds(value: string | null | undefined): string[] {
  if (!value?.trim()) {
    return []
  }
  return value.split(';').filter(Boolean)
}

export function formatCustomerIds(ids: string[]): string {
  return ids.join(';')
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return ''
  }
  return value.slice(0, 10)
}

export function normalizePlateNumber(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function normalizeVinNumber(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase()
}

export function formatInsuredSum(value: string | number): string {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value)
  if (Number.isNaN(numeric)) {
    return String(value)
  }

  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric)
}

export function getAssetTypeBadgeModifier(type: InsuredAssetType): string {
  switch (type) {
    case 'Automóvil':
      return 'automovil'
    case 'Inmueble':
      return 'inmueble'
    case 'Instalación':
      return 'instalacion'
    case 'Invernadero':
      return 'invernadero'
    case 'SAC':
      return 'sac'
    case 'Persona/s':
      return 'personas'
  }
}

export function formatInsuredAssetAddress(
  asset: StructuredAddressFields,
): string {
  return formatStructuredAddress(asset)
}

export function getAssetSummary(asset: InsuredAssetResponse): string {
  const alias = getInsuredAssetAlias(asset)
  return alias || '—'
}

export function buildInitialValues(
  asset?: InsuredAssetResponse,
  defaultPolicyId?: string | null,
): InsuredAssetFormValues {
  return {
    insurancePolicyId: asset?.insurancePolicyId ?? defaultPolicyId ?? null,
    type: asset?.type ?? '',
    insuredSum: asset?.insuredSum ?? '',
    plateNumber: asset?.plateNumber ?? '',
    brand: asset?.brand ?? '',
    model: asset?.model ?? '',
    motor: asset?.motor ?? '',
    color: asset?.color ?? '',
    vinNumber: asset?.vinNumber ?? '',
    manufacturedAt: toDateInputValue(asset?.manufacturedAt),
    area: asset?.area != null ? String(asset.area) : '',
    builtAt: toDateInputValue(asset?.builtAt),
    block: asset?.block ?? '',
    parcel: asset?.parcel ?? '',
    sowedAt: toDateInputValue(asset?.sowedAt),
    crop: asset?.crop ?? '',
    insuredProduction:
      asset?.insuredProduction != null ? String(asset.insuredProduction) : '',
    customerIds: parseCustomerIds(asset?.customerIds),
    ...createAddressFieldState(asset ?? undefined),
  }
}

function getInsuredSumFieldError(value: string): string | null {
  const trimmed = value.trim().replace(',', '.')
  if (!trimmed) {
    return 'La suma asegurada es obligatoria.'
  }

  const numeric = Number.parseFloat(trimmed)
  if (Number.isNaN(numeric) || numeric < 0) {
    return 'La suma asegurada debe ser un número mayor o igual a 0.'
  }

  return null
}

function parseInsuredSum(value: string): number | null {
  const error = getInsuredSumFieldError(value)
  if (error) {
    return null
  }

  const trimmed = value.trim().replace(',', '.')
  const numeric = Number.parseFloat(trimmed)
  return Math.round(numeric * 100) / 100
}

function getAreaFieldError(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'La superficie es obligatoria.'
  }

  const numeric = Number.parseInt(trimmed, 10)
  if (Number.isNaN(numeric) || numeric < 0 || numeric > 999999) {
    return 'La superficie debe ser un entero entre 0 y 999999.'
  }

  return null
}

function parseArea(value: string): number | null {
  if (getAreaFieldError(value)) {
    return null
  }

  return Number.parseInt(value.trim(), 10)
}

function getInsuredProductionFieldError(value: string): string | null {
  const trimmed = value.trim().replace(',', '.')
  if (!trimmed) {
    return 'La producción asegurada es obligatoria.'
  }

  const numeric = Number.parseFloat(trimmed)
  if (Number.isNaN(numeric) || numeric < 0) {
    return 'La producción asegurada debe ser un número mayor o igual a 0.'
  }

  return null
}

function parseInsuredProduction(value: string): number | null {
  if (getInsuredProductionFieldError(value)) {
    return null
  }

  const trimmed = value.trim().replace(',', '.')
  const numeric = Number.parseFloat(trimmed)
  return Math.round(numeric * 100) / 100
}

function getPlateNumberFieldError(value: string): string | null {
  const normalized = normalizePlateNumber(value)
  if (!normalized) {
    return 'La matrícula es obligatoria.'
  }
  if (!/^[A-Z0-9]{1,32}$/.test(normalized)) {
    return 'La matrícula solo puede contener letras y números en mayúsculas.'
  }
  return null
}

function getLocationAddressFieldErrors(
  values: AddressFormValues,
): InsuredAssetFieldErrors {
  const errors: InsuredAssetFieldErrors = {}

  if (!values.streetName.trim()) {
    errors.streetName = 'El nombre de la vía es obligatorio.'
  }
  if (!values.city.trim()) {
    errors.city = 'La población es obligatoria.'
  }
  if (values.door.trim().length > 1) {
    errors.door = 'La puerta solo puede tener un carácter.'
  }

  const gpsError = getGpsFieldValidationError(values.gpsCoordinates)
  if (gpsError) {
    errors.gpsCoordinates = gpsError
  }

  return errors
}

export function validateFormValues(
  values: InsuredAssetFormValues,
): InsuredAssetFieldErrors {
  const errors: InsuredAssetFieldErrors = {}

  if (!values.insurancePolicyId) {
    errors.insurancePolicyId = 'La póliza es obligatoria.'
  }

  if (!values.type) {
    errors.type = 'El tipo de bien es obligatorio.'
  }

  const insuredSumError = getInsuredSumFieldError(values.insuredSum)
  if (insuredSumError) {
    errors.insuredSum = insuredSumError
  }

  if (!values.type) {
    return errors
  }

  const type = values.type as InsuredAssetType

  if (isAutomovilType(type)) {
    const plateError = getPlateNumberFieldError(values.plateNumber)
    if (plateError) {
      errors.plateNumber = plateError
    }
    if (!values.brand.trim()) {
      errors.brand = 'La marca es obligatoria.'
    }
    if (!values.model.trim()) {
      errors.model = 'El modelo es obligatorio.'
    }
    if (!normalizeVinNumber(values.vinNumber)) {
      errors.vinNumber = 'El número de bastidor es obligatorio.'
    }
    if (values.color.length > 32) {
      errors.color = 'El color no puede superar 32 caracteres.'
    }
    if (values.vinNumber.length > 64) {
      errors.vinNumber = 'El número de bastidor no puede superar 64 caracteres.'
    }
    if (!values.manufacturedAt) {
      errors.manufacturedAt = 'La fecha de fabricación es obligatoria.'
    }
    return errors
  }

  if (isLocationType(type)) {
    Object.assign(errors, getLocationAddressFieldErrors(values))

    const areaError = getAreaFieldError(values.area)
    if (areaError) {
      errors.area = areaError
    }
    if (!values.builtAt) {
      errors.builtAt = 'La fecha de construcción es obligatoria.'
    }
  }

  if (isInvernaderoType(type)) {
    if (!values.block.trim()) {
      errors.block = 'El polígono es obligatorio.'
    }
    if (!values.parcel.trim()) {
      errors.parcel = 'La parcela es obligatoria.'
    }
  }

  if (isSacType(type)) {
    if (!values.sowedAt) {
      errors.sowedAt = 'La fecha de siembra es obligatoria.'
    }
    if (!values.crop.trim()) {
      errors.crop = 'El cultivo es obligatorio.'
    }
    const productionError = getInsuredProductionFieldError(values.insuredProduction)
    if (productionError) {
      errors.insuredProduction = productionError
    }
  }

  if (isPersonasType(type)) {
    if (values.customerIds.length === 0) {
      errors.customerIds = 'Selecciona al menos una persona asegurada.'
    }
  }

  return errors
}

function buildLocationTypeFields(
  values: InsuredAssetFormValues,
): Partial<CreateInsuredAssetPayload> | null {
  const area = parseArea(values.area)
  if (area === null) {
    return null
  }

  const addressPayload = buildAddressPayload(values)

  return {
    ...addressPayload,
    area,
    builtAt: values.builtAt,
  }
}

function buildTypeSpecificCreateFields(
  values: InsuredAssetFormValues,
): Partial<CreateInsuredAssetPayload> | null {
  const type = values.type as InsuredAssetType
  const insuredSum = parseInsuredSum(values.insuredSum)
  if (insuredSum === null) {
    return null
  }

  const base: Partial<CreateInsuredAssetPayload> = {
    insuredSum,
  }

  if (isAutomovilType(type)) {
    return {
      ...base,
      plateNumber: normalizePlateNumber(values.plateNumber),
      brand: values.brand.trim(),
      model: values.model.trim(),
      motor: values.motor.trim() || undefined,
      color: values.color.trim() || undefined,
      vinNumber: normalizeVinNumber(values.vinNumber),
      manufacturedAt: values.manufacturedAt,
    }
  }

  if (isBuildingType(type)) {
    const locationFields = buildLocationTypeFields(values)
    if (!locationFields) {
      return null
    }
    return {
      ...base,
      ...locationFields,
    }
  }

  if (isInvernaderoType(type)) {
    const locationFields = buildLocationTypeFields(values)
    if (!locationFields) {
      return null
    }
    return {
      ...base,
      ...locationFields,
      block: values.block.trim(),
      parcel: values.parcel.trim(),
    }
  }

  if (isSacType(type)) {
    const insuredProduction = parseInsuredProduction(values.insuredProduction)
    if (insuredProduction === null) {
      return null
    }
    return {
      ...base,
      sowedAt: values.sowedAt,
      crop: values.crop.trim(),
      insuredProduction,
    }
  }

  if (isPersonasType(type)) {
    return {
      ...base,
      customerIds: formatCustomerIds(values.customerIds),
    }
  }

  return base
}

export function buildCreatePayload(
  values: InsuredAssetFormValues,
): BuilderResult<CreateInsuredAssetPayload, keyof InsuredAssetFormValues> {
  const fieldErrors = validateFormValues(values)
  if (hasFieldErrors(fieldErrors)) {
    return { fieldErrors }
  }

  const typeFields = buildTypeSpecificCreateFields(values)
  if (!typeFields) {
    return { fieldErrors: validateFormValues(values) }
  }

  return {
    insurancePolicyId: values.insurancePolicyId!,
    type: values.type as InsuredAssetType,
    ...typeFields,
  } as CreateInsuredAssetPayload
}

export function buildUpdatePayload(
  values: InsuredAssetFormValues,
  asset: InsuredAssetResponse,
): BuilderResult<UpdateInsuredAssetPayload, keyof InsuredAssetFormValues> {
  const fieldErrors = validateFormValues({ ...values, type: asset.type })
  if (hasFieldErrors(fieldErrors)) {
    return { fieldErrors }
  }

  const typeFields = buildTypeSpecificCreateFields({
    ...values,
    type: asset.type,
  })
  if (!typeFields) {
    return { fieldErrors: validateFormValues({ ...values, type: asset.type }) }
  }

  const { insuredSum, ...rest } = typeFields

  const payload: UpdateInsuredAssetPayload = {
    insurancePolicyId: values.insurancePolicyId!,
    insuredSum,
    ...rest,
  }

  if (isAutomovilType(asset.type)) {
    payload.motor = values.motor.trim() || null
    payload.color = values.color.trim() || null
    payload.vinNumber = normalizeVinNumber(values.vinNumber)
  }

  return payload
}

const BASE_INSURED_ASSET_FIELDS = [
  'insurancePolicyId',
  'type',
  'insuredSum',
] as const satisfies readonly (keyof InsuredAssetFormValues)[]

const AUTOMOVIL_FIELDS = [
  'plateNumber',
  'brand',
  'model',
  'motor',
  'color',
  'vinNumber',
  'manufacturedAt',
] as const satisfies readonly (keyof InsuredAssetFormValues)[]

const LOCATION_FIELDS = [
  'streetType',
  'streetName',
  'streetNumber',
  'building',
  'stairs',
  'floor',
  'door',
  'postalCode',
  'city',
  'region',
  'gpsCoordinates',
  'area',
  'builtAt',
] as const satisfies readonly (keyof InsuredAssetFormValues)[]

const INVERNADERO_FIELDS = ['block', 'parcel'] as const satisfies readonly (
  keyof InsuredAssetFormValues
)[]

const SAC_FIELDS = ['sowedAt', 'crop', 'insuredProduction'] as const satisfies readonly (
  keyof InsuredAssetFormValues
)[]

const PERSONAS_FIELDS = ['customerIds'] as const satisfies readonly (
  keyof InsuredAssetFormValues
)[]

export function getVisibleInsuredAssetFieldKeys(
  type: InsuredAssetType | '',
): Set<keyof InsuredAssetFormValues> {
  const keys = new Set<keyof InsuredAssetFormValues>(BASE_INSURED_ASSET_FIELDS)

  if (!type) {
    return keys
  }

  if (isAutomovilType(type)) {
    for (const field of AUTOMOVIL_FIELDS) {
      keys.add(field)
    }
    return keys
  }

  if (isLocationType(type)) {
    for (const field of LOCATION_FIELDS) {
      keys.add(field)
    }
    if (isInvernaderoType(type)) {
      for (const field of INVERNADERO_FIELDS) {
        keys.add(field)
      }
    }
    return keys
  }

  if (isSacType(type)) {
    for (const field of SAC_FIELDS) {
      keys.add(field)
    }
    return keys
  }

  if (isPersonasType(type)) {
    for (const field of PERSONAS_FIELDS) {
      keys.add(field)
    }
  }

  return keys
}

export function filterFieldErrorsForInsuredAssetType(
  errors: InsuredAssetFieldErrors,
  type: InsuredAssetType | '',
): InsuredAssetFieldErrors {
  const visibleKeys = getVisibleInsuredAssetFieldKeys(type)
  const filtered: InsuredAssetFieldErrors = {}

  for (const [field, message] of Object.entries(errors) as [
    keyof InsuredAssetFormValues,
    string | undefined,
  ][]) {
    if (visibleKeys.has(field) && message) {
      filtered[field] = message
    }
  }

  return filtered
}
