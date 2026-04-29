import { type OmnichannelModuleOptions } from '../interfaces/omnichannel-options.interface';
import { type IMasterTemplateRepository, type ITemplateDeploymentRepository, type IMasterTemplate, type ITemplateDeployment, type DeployResult } from '../interfaces/master-template.interface';
import { TwilioContentClient } from '../twilio/twilio-content.client';
export interface DeployContentOverride {
    body: string;
    types?: Record<string, unknown>;
    variables?: Record<string, unknown>;
}
export interface DeployOptions {
    delayBetweenDeploys?: number;
    maxRetries?: number;
    /**
     * 병원별로 템플릿 내용(body, types 등)을 변환하는 콜백.
     * 미제공 시 마스터 템플릿 원본을 그대로 사용.
     */
    contentTransformer?: (clinicId: number, content: DeployContentOverride) => DeployContentOverride | Promise<DeployContentOverride>;
}
export declare class MasterTemplateService {
    private readonly options;
    private readonly twilioContentClient;
    private readonly masterTemplateRepo;
    private readonly deploymentRepo;
    private readonly logger;
    constructor(options: OmnichannelModuleOptions, twilioContentClient: TwilioContentClient, masterTemplateRepo: IMasterTemplateRepository | null, deploymentRepo: ITemplateDeploymentRepository | null);
    private ensureRepos;
    private resolveCredentials;
    importFromTwilio(clinicId: number, twilioSid: string, data: {
        name: string;
        category: string;
        variableMapping?: Record<string, string>;
    }): Promise<IMasterTemplate>;
    list(filter?: {
        search?: string;
    }): Promise<IMasterTemplate[]>;
    getOne(id: number): Promise<IMasterTemplate>;
    updateName(id: number, name: string): Promise<IMasterTemplate>;
    updateVariableMapping(id: number, variableMapping: Record<string, string>): Promise<IMasterTemplate>;
    delete(id: number): Promise<void>;
    deploy(masterTemplateId: number, clinicIds: number[], options?: DeployOptions): Promise<DeployResult[]>;
    findDeploymentByNameAndClinic(templateName: string, clinicId: number): Promise<ITemplateDeployment | null>;
    getDeployments(masterTemplateId: number): Promise<ITemplateDeployment[]>;
    refreshDeploymentStatus(deploymentId: number): Promise<ITemplateDeployment>;
    undeploy(deploymentId: number): Promise<void>;
}
//# sourceMappingURL=master-template.service.d.ts.map