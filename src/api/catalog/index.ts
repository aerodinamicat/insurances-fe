export {
  createAssuranceCompany,
  deleteAssuranceCompany,
  fetchAssuranceCompanies,
  fetchAssuranceCompany,
  updateAssuranceCompany,
} from './assurance-companies.api'

export {
  deleteAttachment,
  downloadAttachment,
  fetchAttachment,
  fetchAttachments,
  updateAttachment,
  uploadAttachment,
} from './attachments.api'

export {
  getCatalogApiErrorMessage,
  getCatalogFormErrorState,
  isCatalogConflictError,
  isCatalogFormError,
  isCatalogValidationError,
  parseApiFieldErrors,
  type CatalogEntity,
} from './catalog-errors'

export {
  createContact,
  deleteContact,
  fetchContact,
  fetchContacts,
  updateContact,
} from './contacts.api'

export {
  createCustomer,
  deleteCustomer,
  fetchCustomer,
  fetchCustomers,
  updateCustomer,
} from './customers.api'

export {
  createInsurancePolicy,
  deleteInsurancePolicy,
  fetchInsurancePolicies,
  fetchInsurancePolicy,
  updateInsurancePolicy,
} from './insurance-policies.api'

export {
  createInsuredAsset,
  deleteInsuredAsset,
  fetchInsuredAsset,
  fetchInsuredAssets,
  updateInsuredAsset,
} from './insured-assets.api'

export type {
  AssuranceCompanyResponse,
  AttachmentResponse,
  BiologicalGender,
  CatalogEntityTimestamps,
  ContactResponse,
  ContactType,
  CreateAssuranceCompanyPayload,
  CreateContactPayload,
  CreateCustomerPayload,
  CreateEmpresaCustomerPayload,
  CreateInsurancePolicyPayload,
  CreateInsuredAssetPayload,
  CreateParticularCustomerPayload,
  CustomerResponse,
  CustomerType,
  DeleteCatalogEntityOptions,
  FetchAttachmentsParams,
  FetchContactsParams,
  FetchInsurancePoliciesParams,
  FetchInsuredAssetsParams,
  InsuredAssetResponse,
  InsuredAssetType,
  InsurancePolicyResponse,
  MaritalStatus,
  PolicyBranch,
  PolicyStatus,
  StreetType,
  UpdateAssuranceCompanyPayload,
  UpdateAttachmentPayload,
  UpdateContactPayload,
  UpdateCustomerPayload,
  UpdateInsurancePolicyPayload,
  UpdateInsuredAssetPayload,
} from './types'

export { getCustomerAlias, getInsuredAssetAlias } from './types'
