"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MasterTemplateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterTemplateService = void 0;
const common_1 = require("@nestjs/common");
const omnichannel_options_interface_1 = require("../interfaces/omnichannel-options.interface");
const master_template_interface_1 = require("../interfaces/master-template.interface");
const twilio_content_client_1 = require("../twilio/twilio-content.client");
const DEFAULT_DEPLOY_DELAY = 500;
const DEFAULT_MAX_RETRIES = 3;
let MasterTemplateService = MasterTemplateService_1 = class MasterTemplateService {
    options;
    twilioContentClient;
    masterTemplateRepo;
    deploymentRepo;
    logger = new common_1.Logger(MasterTemplateService_1.name);
    constructor(options, twilioContentClient, masterTemplateRepo, deploymentRepo) {
        this.options = options;
        this.twilioContentClient = twilioContentClient;
        this.masterTemplateRepo = masterTemplateRepo;
        this.deploymentRepo = deploymentRepo;
        if (!masterTemplateRepo) {
            this.logger.warn('MasterTemplateRepository not provided. MasterTemplateService will not function.');
        }
    }
    ensureRepos() {
        if (!this.masterTemplateRepo || !this.deploymentRepo) {
            throw new Error('MasterTemplate/Deployment repositories not configured. ' +
                'Provide masterTemplateRepository and deploymentRepository in OmnichannelModule options.');
        }
        return {
            masterTemplateRepo: this.masterTemplateRepo,
            deploymentRepo: this.deploymentRepo,
        };
    }
    async resolveCredentials(clinicId) {
        const resolver = this.options.clinicCredentialsResolver;
        if (!resolver) {
            if (this.options.twilio)
                return this.options.twilio;
            throw new Error('clinicCredentialsResolver or default twilio config is required for master template operations.');
        }
        return resolver(clinicId);
    }
    async importFromTwilio(clinicId, twilioSid, data) {
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
        this.logger.log(`Imported master template: ${created.name} (id=${created.id}) from clinic ${clinicId}`);
        return created;
    }
    async list(filter) {
        const { masterTemplateRepo } = this.ensureRepos();
        return masterTemplateRepo.findAll(filter);
    }
    async getOne(id) {
        const { masterTemplateRepo } = this.ensureRepos();
        const template = await masterTemplateRepo.findOne(id);
        if (!template) {
            throw new common_1.NotFoundException(`Master template #${id} not found`);
        }
        return template;
    }
    async updateName(id, name) {
        const { masterTemplateRepo } = this.ensureRepos();
        await this.getOne(id);
        return masterTemplateRepo.update(id, { name });
    }
    async updateVariableMapping(id, variableMapping) {
        const { masterTemplateRepo } = this.ensureRepos();
        await this.getOne(id);
        return masterTemplateRepo.update(id, { variableMapping });
    }
    async delete(id) {
        const { masterTemplateRepo } = this.ensureRepos();
        const template = await this.getOne(id);
        await masterTemplateRepo.delete(id);
        this.logger.log(`Deleted master template: ${template.name} (id=${id})`);
    }
    async deploy(masterTemplateId, clinicIds, options) {
        const { masterTemplateRepo, deploymentRepo } = this.ensureRepos();
        const master = await masterTemplateRepo.findOne(masterTemplateId);
        if (!master) {
            throw new common_1.NotFoundException(`Master template #${masterTemplateId} not found`);
        }
        const delay = options?.delayBetweenDeploys ?? DEFAULT_DEPLOY_DELAY;
        const deployOne = async (clinicId) => {
            try {
                const existing = await deploymentRepo.findByMasterTemplateAndClinic(masterTemplateId, clinicId);
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
                const created = await this.twilioContentClient.create({
                    friendlyName: master.friendlyName,
                    language: master.language,
                    body: deployBody,
                    types: deployTypes,
                    variables: deployVariables,
                }, config);
                await this.twilioContentClient.submitApproval(created.sid, { name: master.friendlyName, category: master.category }, config);
                if (existing) {
                    await deploymentRepo.update(existing.id, {
                        twilioContentSid: created.sid,
                        approvalStatus: 'pending',
                        deployedAt: new Date(),
                    });
                }
                else {
                    await deploymentRepo.create({
                        masterTemplateId,
                        clinicId,
                        twilioContentSid: created.sid,
                        approvalStatus: 'pending',
                        deployedAt: new Date(),
                    });
                }
                this.logger.log(`Deployed template "${master.name}" to clinic ${clinicId}: ${created.sid}`);
                return {
                    clinicId,
                    success: true,
                    twilioContentSid: created.sid,
                };
            }
            catch (error) {
                this.logger.error(`Failed to deploy template "${master.name}" to clinic ${clinicId}: ${error.message}`, error.stack);
                return {
                    clinicId,
                    success: false,
                    error: error.message,
                };
            }
        };
        const results = [];
        for (const clinicId of clinicIds) {
            const result = await deployOne(clinicId);
            results.push(result);
            if (clinicIds.indexOf(clinicId) < clinicIds.length - 1 && delay > 0) {
                await new Promise((r) => setTimeout(r, delay));
            }
        }
        return results;
    }
    async findDeploymentByNameAndClinic(templateName, clinicId) {
        const { deploymentRepo } = this.ensureRepos();
        return deploymentRepo.findByTemplateNameAndClinic(templateName, clinicId);
    }
    async getDeployments(masterTemplateId) {
        const { deploymentRepo } = this.ensureRepos();
        return deploymentRepo.findByMasterTemplate(masterTemplateId);
    }
    async refreshDeploymentStatus(deploymentId) {
        const { deploymentRepo } = this.ensureRepos();
        const deployment = await deploymentRepo.findOne(deploymentId);
        if (!deployment) {
            throw new common_1.NotFoundException(`Deployment #${deploymentId} not found`);
        }
        if (!deployment.twilioContentSid) {
            throw new common_1.NotFoundException('No Twilio SID for this deployment');
        }
        const config = await this.resolveCredentials(deployment.clinicId);
        try {
            const status = await this.twilioContentClient.getApprovalStatus(deployment.twilioContentSid, config);
            return deploymentRepo.update(deploymentId, {
                approvalStatus: status.status,
                rejectionReason: status.rejectionReason ?? null,
            });
        }
        catch (error) {
            if (error?.status === 404 || error?.code === 20404) {
                this.logger.warn(`Twilio template ${deployment.twilioContentSid} not found (deleted). Marking as deleted.`);
                return deploymentRepo.update(deploymentId, {
                    approvalStatus: 'deleted',
                    rejectionReason: 'Template deleted from Twilio',
                });
            }
            throw error;
        }
    }
    async undeploy(deploymentId) {
        const { deploymentRepo } = this.ensureRepos();
        const deployment = await deploymentRepo.findOne(deploymentId);
        if (!deployment) {
            throw new common_1.NotFoundException(`Deployment #${deploymentId} not found`);
        }
        if (deployment.twilioContentSid) {
            try {
                const config = await this.resolveCredentials(deployment.clinicId);
                await this.twilioContentClient.delete(deployment.twilioContentSid, config);
            }
            catch (error) {
                // 404 = 이미 Twilio에 콘텐츠가 없음 → 무시하고 기록 삭제 진행
                if (error?.status !== 404 && error?.code !== 20404) {
                    // 그 외 오류(네트워크/인증/rate limit 등)는 콘텐츠가 살아있을 수 있으므로
                    // DB 기록을 지우지 않고 중단한다. (orphan Twilio 콘텐츠 방지)
                    this.logger.error(`Failed to delete Twilio template ${deployment.twilioContentSid}: ${error.message}`, error.stack);
                    throw error;
                }
                this.logger.warn(`Twilio template ${deployment.twilioContentSid} already absent (404). Removing deployment record.`);
            }
        }
        await deploymentRepo.delete(deploymentId);
        this.logger.log(`Undeployed deployment #${deploymentId} from clinic ${deployment.clinicId}`);
    }
};
exports.MasterTemplateService = MasterTemplateService;
exports.MasterTemplateService = MasterTemplateService = MasterTemplateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(omnichannel_options_interface_1.OMNICHANNEL_MODULE_OPTIONS)),
    __param(2, (0, common_1.Optional)()),
    __param(2, (0, common_1.Inject)(master_template_interface_1.MASTER_TEMPLATE_REPOSITORY)),
    __param(3, (0, common_1.Optional)()),
    __param(3, (0, common_1.Inject)(master_template_interface_1.DEPLOYMENT_REPOSITORY)),
    __metadata("design:paramtypes", [Object, twilio_content_client_1.TwilioContentClient, Object, Object])
], MasterTemplateService);
//# sourceMappingURL=master-template.service.js.map