import {
  Injectable,
  Inject,
  Logger,
  Optional,
  NotFoundException,
} from '@nestjs/common';
import {
  OMNICHANNEL_MODULE_OPTIONS,
  type OmnichannelModuleOptions,
  type TwilioConfig,
} from '../interfaces/omnichannel-options.interface';
import {
  MASTER_TEMPLATE_REPOSITORY,
  DEPLOYMENT_REPOSITORY,
  type IMasterTemplateRepository,
  type ITemplateDeploymentRepository,
  type IMasterTemplate,
  type ITemplateDeployment,
  type DeployResult,
} from '../interfaces/master-template.interface';
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
  contentTransformer?: (
    clinicId: number,
    content: DeployContentOverride,
  ) => DeployContentOverride | Promise<DeployContentOverride>;
}

const DEFAULT_DEPLOY_DELAY = 500;
const DEFAULT_MAX_RETRIES = 3;

@Injectable()
export class MasterTemplateService {
  private readonly logger = new Logger(MasterTemplateService.name);

  constructor(
    @Inject(OMNICHANNEL_MODULE_OPTIONS)
    private readonly options: OmnichannelModuleOptions,
    private readonly twilioContentClient: TwilioContentClient,
    @Optional()
    @Inject(MASTER_TEMPLATE_REPOSITORY)
    private readonly masterTemplateRepo: IMasterTemplateRepository | null,
    @Optional()
    @Inject(DEPLOYMENT_REPOSITORY)
    private readonly deploymentRepo: ITemplateDeploymentRepository | null,
  ) {
    if (!masterTemplateRepo) {
      this.logger.warn(
        'MasterTemplateRepository not provided. MasterTemplateService will not function.',
      );
    }
  }

  private ensureRepos(): {
    masterTemplateRepo: IMasterTemplateRepository;
    deploymentRepo: ITemplateDeploymentRepository;
  } {
    if (!this.masterTemplateRepo || !this.deploymentRepo) {
      throw new Error(
        'MasterTemplate/Deployment repositories not configured. ' +
          'Provide masterTemplateRepository and deploymentRepository in OmnichannelModule options.',
      );
    }
    return {
      masterTemplateRepo: this.masterTemplateRepo,
      deploymentRepo: this.deploymentRepo,
    };
  }

  private async resolveCredentials(clinicId: number): Promise<TwilioConfig> {
    const resolver = this.options.clinicCredentialsResolver;
    if (!resolver) {
      if (this.options.twilio) return this.options.twilio;
      throw new Error(
        'clinicCredentialsResolver or default twilio config is required for master template operations.',
      );
    }
    return resolver(clinicId);
  }

  async importFromTwilio(
    clinicId: number,
    twilioSid: string,
    data: {
      name: string;
      category: string;
      variableMapping?: Record<string, string>;
    },
  ): Promise<IMasterTemplate> {
    const { masterTemplateRepo, deploymentRepo } = this.ensureRepos();
    const config = await this.resolveCredentials(clinicId);
    const template = await this.twilioContentClient.getOne(twilioSid, config);

    const created = await masterTemplateRepo.create({
      name: data.name,
      friendlyName: template.name,
      language: template.language,
      category: data.category,
      body: template.body,
      types: template.types,
      variables: template.variables,
      variableMapping: data.variableMapping ?? null,
      sourceClinicId: clinicId,
      sourceTwilioSid: twilioSid,
      rawContent: {
        sid: template.sid,
        types: template.types,
        variables: template.variables,
      },
    });

    await deploymentRepo.create({
      masterTemplateId: created.id,
      clinicId,
      twilioContentSid: twilioSid,
      approvalStatus: 'approved',
      deployedAt: new Date(),
    });

    this.logger.log(
      `Imported master template: ${created.name} (id=${created.id}) from clinic ${clinicId}`,
    );
    return created;
  }

  async list(filter?: { search?: string }): Promise<IMasterTemplate[]> {
    const { masterTemplateRepo } = this.ensureRepos();
    return masterTemplateRepo.findAll(filter);
  }

  async getOne(id: number): Promise<IMasterTemplate> {
    const { masterTemplateRepo } = this.ensureRepos();
    const template = await masterTemplateRepo.findOne(id);
    if (!template) {
      throw new NotFoundException(`Master template #${id} not found`);
    }
    return template;
  }

  async updateName(
    id: number,
    name: string,
  ): Promise<IMasterTemplate> {
    const { masterTemplateRepo } = this.ensureRepos();
    await this.getOne(id);
    return masterTemplateRepo.update(id, { name });
  }

  async updateVariableMapping(
    id: number,
    variableMapping: Record<string, string>,
  ): Promise<IMasterTemplate> {
    const { masterTemplateRepo } = this.ensureRepos();
    await this.getOne(id);
    return masterTemplateRepo.update(id, { variableMapping });
  }

  async delete(id: number): Promise<void> {
    const { masterTemplateRepo } = this.ensureRepos();
    const template = await this.getOne(id);
    await masterTemplateRepo.delete(id);
    this.logger.log(
      `Deleted master template: ${template.name} (id=${id})`,
    );
  }

  async deploy(
    masterTemplateId: number,
    clinicIds: number[],
    options?: DeployOptions,
  ): Promise<DeployResult[]> {
    const { masterTemplateRepo, deploymentRepo } = this.ensureRepos();
    const master = await masterTemplateRepo.findOne(masterTemplateId);
    if (!master) {
      throw new NotFoundException(
        `Master template #${masterTemplateId} not found`,
      );
    }

    const delay = options?.delayBetweenDeploys ?? DEFAULT_DEPLOY_DELAY;

    const deployOne = async (clinicId: number): Promise<DeployResult> => {
      try {
        const existing =
          await deploymentRepo.findByMasterTemplateAndClinic(
            masterTemplateId,
            clinicId,
          );
        if (existing?.twilioContentSid) {
          return {
            clinicId,
            success: true,
            twilioContentSid: existing.twilioContentSid,
            error: 'already deployed',
          };
        }

        const config = await this.resolveCredentials(clinicId);

        // contentTransformer가 있으면 병원별로 내용 변환
        let deployBody = master.body;
        let deployTypes = master.types ?? undefined;
        let deployVariables = master.variables ?? undefined;

        if (options?.contentTransformer) {
          const transformed = await options.contentTransformer(clinicId, {
            body: master.body,
            types: master.types ?? undefined,
            variables: master.variables ?? undefined,
          });
          deployBody = transformed.body;
          deployTypes = transformed.types ?? deployTypes;
          deployVariables = transformed.variables ?? deployVariables;
        }

        const created = await this.twilioContentClient.create(
          {
            friendlyName: master.friendlyName,
            language: master.language,
            body: deployBody,
            types: deployTypes,
            variables: deployVariables,
          },
          config,
        );

        await this.twilioContentClient.submitApproval(
          created.sid,
          { name: master.friendlyName, category: master.category },
          config,
        );

        if (existing) {
          await deploymentRepo.update(existing.id, {
            twilioContentSid: created.sid,
            approvalStatus: 'pending',
            deployedAt: new Date(),
          });
        } else {
          await deploymentRepo.create({
            masterTemplateId,
            clinicId,
            twilioContentSid: created.sid,
            approvalStatus: 'pending',
            deployedAt: new Date(),
          });
        }

        this.logger.log(
          `Deployed template "${master.name}" to clinic ${clinicId}: ${created.sid}`,
        );

        return {
          clinicId,
          success: true,
          twilioContentSid: created.sid,
        };
      } catch (error: any) {
        this.logger.error(
          `Failed to deploy template "${master.name}" to clinic ${clinicId}: ${error.message}`,
          error.stack,
        );
        return {
          clinicId,
          success: false,
          error: error.message,
        };
      }
    };

    const results: DeployResult[] = [];
    for (const clinicId of clinicIds) {
      const result = await deployOne(clinicId);
      results.push(result);
      if (clinicIds.indexOf(clinicId) < clinicIds.length - 1 && delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    return results;
  }

  async findDeploymentByNameAndClinic(
    templateName: string,
    clinicId: number,
  ): Promise<ITemplateDeployment | null> {
    const { deploymentRepo } = this.ensureRepos();
    return deploymentRepo.findByTemplateNameAndClinic(templateName, clinicId);
  }

  async getDeployments(
    masterTemplateId: number,
  ): Promise<ITemplateDeployment[]> {
    const { deploymentRepo } = this.ensureRepos();
    return deploymentRepo.findByMasterTemplate(masterTemplateId);
  }

  async refreshDeploymentStatus(
    deploymentId: number,
  ): Promise<ITemplateDeployment> {
    const { deploymentRepo } = this.ensureRepos();
    const deployment = await deploymentRepo.findOne(deploymentId);
    if (!deployment) {
      throw new NotFoundException(`Deployment #${deploymentId} not found`);
    }
    if (!deployment.twilioContentSid) {
      throw new NotFoundException('No Twilio SID for this deployment');
    }

    const config = await this.resolveCredentials(deployment.clinicId);
    try {
      const status = await this.twilioContentClient.getApprovalStatus(
        deployment.twilioContentSid,
        config,
      );

      return deploymentRepo.update(deploymentId, {
        approvalStatus: status.status,
        rejectionReason: status.rejectionReason ?? null,
      });
    } catch (error: any) {
      if (error?.status === 404 || error?.code === 20404) {
        this.logger.warn(
          `Twilio template ${deployment.twilioContentSid} not found (deleted). Marking as deleted.`,
        );
        return deploymentRepo.update(deploymentId, {
          approvalStatus: 'deleted',
          rejectionReason: 'Template deleted from Twilio',
        });
      }
      throw error;
    }
  }

  async undeploy(deploymentId: number): Promise<void> {
    const { deploymentRepo } = this.ensureRepos();
    const deployment = await deploymentRepo.findOne(deploymentId);
    if (!deployment) {
      throw new NotFoundException(`Deployment #${deploymentId} not found`);
    }

    if (deployment.twilioContentSid) {
      try {
        const config = await this.resolveCredentials(deployment.clinicId);
        await this.twilioContentClient.delete(
          deployment.twilioContentSid,
          config,
        );
      } catch (error: any) {
        this.logger.warn(
          `Failed to delete Twilio template ${deployment.twilioContentSid}: ${error.message}`,
        );
      }
    }

    await deploymentRepo.delete(deploymentId);
    this.logger.log(
      `Undeployed deployment #${deploymentId} from clinic ${deployment.clinicId}`,
    );
  }
}
