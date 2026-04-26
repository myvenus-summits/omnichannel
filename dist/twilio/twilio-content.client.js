"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var TwilioContentClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioContentClient = void 0;
const common_1 = require("@nestjs/common");
const twilio_1 = __importDefault(require("twilio"));
let TwilioContentClient = TwilioContentClient_1 = class TwilioContentClient {
    logger = new common_1.Logger(TwilioContentClient_1.name);
    clients = new Map();
    getClient(config) {
        const key = `${config.accountSid}:${config.authToken}`;
        let client = this.clients.get(key);
        if (!client) {
            client = (0, twilio_1.default)(config.accountSid, config.authToken);
            this.clients.set(key, client);
        }
        return client;
    }
    extractBody(types) {
        if (!types)
            return '';
        for (const value of Object.values(types)) {
            if (value && typeof value === 'object' && 'body' in value) {
                return value.body;
            }
        }
        return '';
    }
    async listApproved(config, search) {
        const client = this.getClient(config);
        const contents = await client.content.v2.contents.list({
            channelEligibility: ['whatsapp:approved'],
            limit: 200,
        });
        const templates = contents.map((c) => ({
            sid: c.sid,
            name: c.friendlyName,
            language: c.language,
            variables: c.variables,
            types: c.types,
            body: this.extractBody(c.types),
            dateUpdated: c.dateUpdated,
        }));
        if (search) {
            const lower = search.toLowerCase();
            return templates.filter((t) => t.name.toLowerCase().includes(lower) ||
                t.body.toLowerCase().includes(lower));
        }
        return templates;
    }
    async listAll(config, search) {
        const client = this.getClient(config);
        const results = await client.content.v2.contentAndApprovals.list();
        const templates = results.map((r) => {
            const approval = r.approvalRequests?.whatsapp ?? r.approvalRequests;
            return {
                sid: r.sid ?? r.contentSid,
                name: r.friendlyName,
                language: r.language,
                variables: (r.variables ?? {}),
                types: (r.types ?? {}),
                body: this.extractBody((r.types ?? {})),
                dateUpdated: r.dateUpdated,
                approvalStatus: approval?.status,
                category: approval?.category,
                rejectionReason: approval?.rejection_reason ?? approval?.rejectionReason,
            };
        });
        if (search) {
            const lower = search.toLowerCase();
            return templates.filter((t) => t.name.toLowerCase().includes(lower) ||
                t.body.toLowerCase().includes(lower));
        }
        return templates;
    }
    async getOne(sid, config) {
        const client = this.getClient(config);
        const content = await client.content.v1.contents.get(sid).fetch();
        return {
            sid: content.sid,
            name: content.friendlyName,
            language: content.language,
            variables: content.variables,
            types: content.types,
            body: this.extractBody(content.types),
            dateUpdated: content.dateUpdated,
        };
    }
    async create(data, config) {
        const client = this.getClient(config);
        const types = data.types ?? { 'twilio/text': { body: data.body } };
        const content = await client.content.v1.contents.create({
            friendly_name: data.friendlyName,
            language: data.language,
            variables: data.variables ?? {},
            types,
        });
        return {
            sid: content.sid,
            name: content.friendlyName,
            language: content.language,
            variables: content.variables,
            types: content.types,
            body: this.extractBody(content.types),
            dateUpdated: content.dateUpdated,
        };
    }
    async submitApproval(sid, data, config) {
        const client = this.getClient(config);
        const contentContext = client.content.v1.contents(sid);
        if (contentContext.approvalCreate?.create) {
            await contentContext.approvalCreate.create({
                name: data.name,
                category: data.category,
            });
        }
        else {
            await contentContext.approvalRequests.create({
                name: data.name,
                category: data.category,
            });
        }
    }
    async getApprovalStatus(sid, config) {
        const client = this.getClient(config);
        try {
            const contentContext = client.content.v1.contents(sid);
            const approval = contentContext.approvalFetch?.fetch
                ? await contentContext.approvalFetch.fetch()
                : await contentContext.approvalRequests().fetch();
            return {
                status: approval.status ?? 'draft',
                category: approval.category,
                rejectionReason: approval.rejectionReason,
            };
        }
        catch (error) {
            if (error?.status === 404) {
                return { status: 'unsubmitted' };
            }
            throw error;
        }
    }
    async delete(sid, config) {
        const client = this.getClient(config);
        await client.content.v1.contents(sid).remove();
    }
};
exports.TwilioContentClient = TwilioContentClient;
exports.TwilioContentClient = TwilioContentClient = TwilioContentClient_1 = __decorate([
    (0, common_1.Injectable)()
], TwilioContentClient);
//# sourceMappingURL=twilio-content.client.js.map