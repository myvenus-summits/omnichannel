export type ApprovalStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'paused'
  | 'pending'
  | 'unsubmitted';

export interface IMasterTemplate {
  id: number;
  name: string;
  friendlyName: string;
  language: string;
  category: string;
  body: string;
  types: Record<string, unknown> | null;
  variables: Record<string, unknown> | null;
  variableMapping: Record<string, string> | null;
  sourceClinicId: number;
  sourceTwilioSid: string;
  rawContent: Record<string, unknown> | null;
  deployments?: ITemplateDeployment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITemplateDeployment {
  id: number;
  masterTemplateId: number;
  clinicId: number;
  twilioContentSid: string | null;
  approvalStatus: string;
  rejectionReason: string | null;
  deployedAt: Date | null;
  masterTemplate?: IMasterTemplate;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMasterTemplateData {
  name: string;
  friendlyName: string;
  language: string;
  category: string;
  body: string;
  types?: Record<string, unknown> | null;
  variables?: Record<string, unknown> | null;
  variableMapping?: Record<string, string> | null;
  sourceClinicId: number;
  sourceTwilioSid: string;
  rawContent?: Record<string, unknown> | null;
}

export interface UpdateMasterTemplateData {
  name?: string;
  variableMapping?: Record<string, string> | null;
}

export interface CreateDeploymentData {
  masterTemplateId: number;
  clinicId: number;
  twilioContentSid?: string | null;
  approvalStatus?: string;
  deployedAt?: Date | null;
}

export interface UpdateDeploymentData {
  twilioContentSid?: string | null;
  approvalStatus?: string;
  rejectionReason?: string | null;
  deployedAt?: Date | null;
}

export interface IMasterTemplateRepository {
  findAll(filter?: { search?: string }): Promise<IMasterTemplate[]>;
  findOne(id: number): Promise<IMasterTemplate | null>;
  create(data: CreateMasterTemplateData): Promise<IMasterTemplate>;
  update(id: number, data: UpdateMasterTemplateData): Promise<IMasterTemplate>;
  delete(id: number): Promise<void>;
}

export interface ITemplateDeploymentRepository {
  findByMasterTemplate(masterTemplateId: number): Promise<ITemplateDeployment[]>;
  findOne(id: number): Promise<ITemplateDeployment | null>;
  findByMasterTemplateAndClinic(
    masterTemplateId: number,
    clinicId: number,
  ): Promise<ITemplateDeployment | null>;
  findByTemplateNameAndClinic(
    templateName: string,
    clinicId: number,
  ): Promise<ITemplateDeployment | null>;
  create(data: CreateDeploymentData): Promise<ITemplateDeployment>;
  update(id: number, data: UpdateDeploymentData): Promise<ITemplateDeployment>;
  delete(id: number): Promise<void>;
}

export interface DeployResult {
  clinicId: number;
  success: boolean;
  twilioContentSid?: string;
  error?: string;
}

export const MASTER_TEMPLATE_REPOSITORY = 'MASTER_TEMPLATE_REPOSITORY';
export const DEPLOYMENT_REPOSITORY = 'DEPLOYMENT_REPOSITORY';
