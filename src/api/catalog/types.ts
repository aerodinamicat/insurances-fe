/** Shared timestamps for catalog list entities. */
import { formatStructuredAddress } from '../../utils/address'

export interface CatalogEntityTimestamps {
  id: string
  alias: string
  createdAt: string
  updatedAt: string
}

export type CustomerType = 'Particular' | 'Empresa'

export type BiologicalGender = 'Femenino' | 'Masculino'

export type MaritalStatus =
  | 'Soltero/a'
  | 'Casado/a'
  | 'Divorciado/a'
  | 'Viudo/a'

export type ContactType = 'Personal' | 'Laboral' | 'Familiar' | 'Servicio'

export type StreetType = 'Calle' | 'Avenida' | 'Carretera' | 'Plaza'

/** HTTP response shape for a customer resource. */
export interface CustomerResponse extends CatalogEntityTimestamps {
  type: CustomerType
  taxId: string
  firstName: string | null
  lastName: string | null
  birthAt: string | null
  age: number | null
  biologicalGender: BiologicalGender | null
  maritalStatus: MaritalStatus | null
  cnae: string | null
  businessName: string | null
  tradeName: string | null
}

export interface CreateParticularCustomerPayload {
  type: 'Particular'
  taxId: string
  firstName: string
  lastName: string
  birthAt: string
  biologicalGender: BiologicalGender
  maritalStatus?: MaritalStatus | null
  cnae?: string | null
}

export interface CreateEmpresaCustomerPayload {
  type: 'Empresa'
  taxId: string
  businessName: string
  tradeName?: string | null
  cnae?: string | null
}

export type CreateCustomerPayload =
  | CreateParticularCustomerPayload
  | CreateEmpresaCustomerPayload

/** Partial update; `type` is immutable and must not be sent. */
export interface UpdateCustomerPayload {
  taxId?: string
  firstName?: string
  lastName?: string
  birthAt?: string
  biologicalGender?: BiologicalGender
  maritalStatus?: MaritalStatus | null
  cnae?: string | null
  businessName?: string
  tradeName?: string | null
}

/** HTTP response shape for an assurance company resource. */
export interface AssuranceCompanyResponse extends CatalogEntityTimestamps {
  businessName: string
  tradeName: string | null
}

export interface CreateAssuranceCompanyPayload {
  businessName: string
  tradeName?: string | null
}

export interface UpdateAssuranceCompanyPayload {
  businessName?: string
  tradeName?: string | null
}

/** HTTP response shape for a contact resource. */
export interface ContactResponse extends CatalogEntityTimestamps {
  customerId: string
  type: ContactType
  reference: string | null
  phoneNumber: string
  email: string | null
  streetType: StreetType | null
  streetName: string | null
  streetNumber: string | null
  building: string | null
  stairs: string | null
  floor: string | null
  door: string | null
  postalCode: string | null
  city: string | null
  region: string | null
  gpsCoordinates: string | null
}

export interface CreateContactPayload {
  customerId: string
  type: ContactType
  phoneNumber: string
  reference?: string | null
  email?: string | null
  streetType?: StreetType | null
  streetName?: string | null
  streetNumber?: string | null
  building?: string | null
  stairs?: string | null
  floor?: string | null
  door?: string | null
  postalCode?: string | null
  city?: string | null
  region?: string | null
  gpsCoordinates?: string | null
}

export interface UpdateContactPayload {
  customerId?: string
  type?: ContactType
  phoneNumber?: string
  reference?: string | null
  email?: string | null
  streetType?: StreetType | null
  streetName?: string | null
  streetNumber?: string | null
  building?: string | null
  stairs?: string | null
  floor?: string | null
  door?: string | null
  postalCode?: string | null
  city?: string | null
  region?: string | null
  gpsCoordinates?: string | null
}

export interface FetchContactsParams {
  customerId?: string
}

export type PolicyBranch =
  | 'Accidentes'
  | 'Automóvil'
  | 'Comunidad de vecinos'
  | 'Decesos'
  | 'Hogar'
  | 'Patrimonio'
  | 'Responsabilidad civil'
  | 'Riesgo'
  | 'SAC'
  | 'Salud'
  | 'Viaje'

export type PolicyStatus = 'Cancelada' | 'En renovación' | 'Vigente'

export type InsuredAssetType =
  | 'Automóvil'
  | 'Inmueble'
  | 'Instalación'
  | 'Invernadero'
  | 'SAC'
  | 'Persona/s'

/** HTTP response shape for an insurance policy resource. */
export interface InsurancePolicyResponse extends CatalogEntityTimestamps {
  identifierId: string
  branch: PolicyBranch
  effectiveAt: string
  nextRenewalAt: string
  cancelledAt: string | null
  cancellationReason: string | null
  customerId: string
  assuranceCompanyId: string
  attachedContractId: string | null
  status: PolicyStatus
}

export interface CreateInsurancePolicyPayload {
  identifierId: string
  branch: PolicyBranch
  effectiveAt: string
  nextRenewalAt?: string
  customerId: string
  assuranceCompanyId: string
  cancelledAt?: string | null
  cancellationReason?: string | null
}

/** Partial update; cancellation fields must be sent together or both cleared. */
export interface UpdateInsurancePolicyPayload {
  identifierId?: string
  branch?: PolicyBranch
  effectiveAt?: string
  nextRenewalAt?: string
  customerId?: string
  assuranceCompanyId?: string
  attachedContractId?: string | null
  cancelledAt?: string | null
  cancellationReason?: string | null
}

export interface FetchInsurancePoliciesParams {
  customerId?: string
  assuranceCompanyId?: string
  branch?: PolicyBranch
  status?: PolicyStatus
}

/** HTTP response shape for an insured asset resource. */
export interface InsuredAssetResponse extends CatalogEntityTimestamps {
  aliasDetail: string | null
  insurancePolicyId: string
  type: InsuredAssetType
  insuredSum: string
  currency: string
  plateNumber: string | null
  brand: string | null
  model: string | null
  motor: string | null
  color: string | null
  vinNumber: string | null
  manufacturedAt: string | null
  streetType: StreetType | null
  streetName: string | null
  streetNumber: string | null
  building: string | null
  stairs: string | null
  floor: string | null
  door: string | null
  postalCode: string | null
  city: string | null
  region: string | null
  gpsCoordinates: string | null
  area: number | null
  builtAt: string | null
  block: string | null
  parcel: string | null
  sowedAt: string | null
  crop: string | null
  insuredProduction: string | null
  customerIds: string | null
}

export interface CreateInsuredAssetPayload {
  insurancePolicyId: string
  type: InsuredAssetType
  insuredSum: number
  plateNumber?: string
  brand?: string
  model?: string
  motor?: string
  color?: string
  vinNumber?: string
  manufacturedAt?: string
  streetType?: StreetType | null
  streetName?: string | null
  streetNumber?: string | null
  building?: string | null
  stairs?: string | null
  floor?: string | null
  door?: string | null
  postalCode?: string | null
  city?: string | null
  region?: string | null
  gpsCoordinates?: string | null
  area?: number
  builtAt?: string
  block?: string
  parcel?: string
  sowedAt?: string
  crop?: string
  insuredProduction?: number
  customerIds?: string
}

/** Partial update; `type` is immutable and must not be sent. */
export interface UpdateInsuredAssetPayload {
  insurancePolicyId?: string
  insuredSum?: number
  plateNumber?: string | null
  brand?: string | null
  model?: string | null
  motor?: string | null
  color?: string | null
  vinNumber?: string | null
  manufacturedAt?: string | null
  streetType?: StreetType | null
  streetName?: string | null
  streetNumber?: string | null
  building?: string | null
  stairs?: string | null
  floor?: string | null
  door?: string | null
  postalCode?: string | null
  city?: string | null
  region?: string | null
  gpsCoordinates?: string | null
  area?: number | null
  builtAt?: string | null
  block?: string | null
  parcel?: string | null
  sowedAt?: string | null
  crop?: string | null
  insuredProduction?: number | null
  customerIds?: string | null
}

export interface FetchInsuredAssetsParams {
  insurancePolicyId?: string
  type?: InsuredAssetType
}

/** HTTP response shape for an attachment resource. */
export interface AttachmentResponse extends CatalogEntityTimestamps {
  documentType: string
  documentCode: string | null
  issuedAt: string | null
  expiredAt: string | null
  customerId: string | null
  insurancePolicyId: string | null
  insuredAssetId: string | null
  originalFileName: string
  mimeType: string
  byteSize: string
  fileExtension: string
}

/** Metadata-only update; parent FK and file content are immutable. */
export interface UpdateAttachmentPayload {
  documentType?: string
  documentCode?: string | null
  issuedAt?: string | null
  expiredAt?: string | null
}

export interface FetchAttachmentsParams {
  customerId?: string
  insurancePolicyId?: string
  insuredAssetId?: string
}

export interface DeleteCatalogEntityOptions {
  permanent?: boolean
}

/** Alias for customer list rows (particular vs empresa). */
export function getCustomerAlias(customer: CustomerResponse): string {
  if (customer.alias) {
    return customer.alias
  }

  if (customer.type === 'Empresa') {
    return customer.businessName ?? customer.tradeName ?? customer.taxId
  }

  const fullName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()

  return fullName || customer.taxId
}

/** Alias for insured asset list rows and comboboxes. */
export function getInsuredAssetAlias(
  asset: InsuredAssetResponse,
  getCustomerName?: (customerId: string) => string,
): string {
  if (asset.alias?.trim()) {
    return asset.alias.trim()
  }

  switch (asset.type) {
    case 'Automóvil':
      return [asset.plateNumber, asset.brand, asset.model, asset.color]
        .filter(Boolean)
        .join(' · ')
    case 'Inmueble':
    case 'Instalación': {
      const address = formatStructuredAddress(asset)
      return address !== '—' ? address : ''
    }
    case 'Invernadero':
      return [asset.block, asset.parcel, asset.crop].filter(Boolean).join(' · ')
    case 'SAC':
      return asset.crop?.trim() ?? ''
    case 'Persona/s': {
      if (!asset.customerIds) {
        return ''
      }

      if (getCustomerName) {
        const names = asset.customerIds
          .split(';')
          .map((id) => getCustomerName(id))
          .filter(Boolean)

        return names.join(', ')
      }

      return asset.customerIds
    }
  }
}
