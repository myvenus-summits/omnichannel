import { Injectable, Logger } from '@nestjs/common';
import Twilio from 'twilio';
import type { TwilioConfig } from '../interfaces/omnichannel-options.interface';
import type { ApprovalStatus } from '../interfaces/master-template.interface';

export interface TwilioContentItem {
  sid: string;
  name: string;
  language: string;
  variables: Record<string, unknown>;
  types: Record<string, unknown>;
  body: string;
  dateUpdated: Date;
  approvalStatus?: string;
  category?: string;
  rejectionReason?: string;
}

export interface CreateTwilioContentData {
  friendlyName: string;
  language: string;
  body: string;
  types?: Record<string, unknown>;
  variables?: Record<string, unknown>;
}

@Injectable()
export class TwilioContentClient {
  private readonly logger = new Logger(TwilioContentClient.name);
  private readonly clients = new Map<string, ReturnType<typeof Twilio>>();

  private getClient(config: TwilioConfig) {
    const key = `${config.accountSid}:${config.authToken}`;
    let client = this.clients.get(key);
    if (!client) {
      client = Twilio(config.accountSid, config.authToken);
      this.clients.set(key, client);
    }
    return client;
  }

  private extractBody(types: Record<string, unknown>): string {
    if (!types) return '';
    for (const value of Object.values(types)) {
      if (value && typeof value === 'object' && 'body' in value) {
        return (value as { body: string }).body;
      }
    }
    return '';
  }

  async listApproved(
    config: TwilioConfig,
    search?: string,
  ): Promise<TwilioContentItem[]> {
    const client = this.getClient(config);
    const contents = await client.content.v2.contents.list({
      channelEligibility: ['whatsapp:approved'],
      limit: 200,
    });

    const templates: TwilioContentItem[] = contents.map((c) => ({
      sid: c.sid,
      name: c.friendlyName,
      language: c.language,
      variables: c.variables as Record<string, unknown>,
      types: c.types as Record<string, unknown>,
      body: this.extractBody(c.types as Record<string, unknown>),
      dateUpdated: c.dateUpdated,
    }));

    if (search) {
      const lower = search.toLowerCase();
      return templates.filter(
        (t) =>
          t.name.toLowerCase().includes(lower) ||
          t.body.toLowerCase().includes(lower),
      );
    }

    return templates;
  }

  async listAll(
    config: TwilioConfig,
    search?: string,
  ): Promise<TwilioContentItem[]> {
    const client = this.getClient(config);
    const results = await (client.content.v2 as any).contentAndApprovals.list();

    const templates: TwilioContentItem[] = results.map((r: any) => {
      const approval = r.approvalRequests?.whatsapp ?? r.approvalRequests;
      return {
        sid: r.sid ?? r.contentSid,
        name: r.friendlyName,
        language: r.language,
        variables: (r.variables ?? {}) as Record<string, unknown>,
        types: (r.types ?? {}) as Record<string, unknown>,
        body: this.extractBody((r.types ?? {}) as Record<string, unknown>),
        dateUpdated: r.dateUpdated,
        approvalStatus: approval?.status,
        category: approval?.category,
        rejectionReason: approval?.rejection_reason ?? approval?.rejectionReason,
      };
    });

    if (search) {
      const lower = search.toLowerCase();
      return templates.filter(
        (t) =>
          t.name.toLowerCase().includes(lower) ||
          t.body.toLowerCase().includes(lower),
      );
    }

    return templates;
  }

  async getOne(sid: string, config: TwilioConfig): Promise<TwilioContentItem> {
    const client = this.getClient(config);
    const content = await client.content.v1.contents.get(sid).fetch();

    return {
      sid: content.sid,
      name: content.friendlyName,
      language: content.language,
      variables: content.variables as Record<string, unknown>,
      types: content.types as Record<string, unknown>,
      body: this.extractBody(content.types as Record<string, unknown>),
      dateUpdated: content.dateUpdated,
    };
  }

  async create(
    data: CreateTwilioContentData,
    config: TwilioConfig,
  ): Promise<TwilioContentItem> {
    const client = this.getClient(config);
    const types = data.types ?? { 'twilio/text': { body: data.body } };
    const content = await client.content.v1.contents.create({
      friendly_name: data.friendlyName,
      language: data.language,
      variables: data.variables ?? {},
      types,
    } as any);

    return {
      sid: content.sid,
      name: content.friendlyName,
      language: content.language,
      variables: content.variables as Record<string, unknown>,
      types: content.types as Record<string, unknown>,
      body: this.extractBody(content.types as Record<string, unknown>),
      dateUpdated: content.dateUpdated,
    };
  }

  async submitApproval(
    sid: string,
    data: { name: string; category: string },
    config: TwilioConfig,
  ): Promise<void> {
    const client = this.getClient(config);
    const contentContext = client.content.v1.contents(sid) as any;
    if (contentContext.approvalCreate?.create) {
      await contentContext.approvalCreate.create({
        name: data.name,
        category: data.category,
      });
    } else {
      await contentContext.approvalRequests.create({
        name: data.name,
        category: data.category,
      });
    }
  }

  async getApprovalStatus(
    sid: string,
    config: TwilioConfig,
  ): Promise<{
    status: ApprovalStatus;
    category?: string;
    rejectionReason?: string;
  }> {
    const client = this.getClient(config);
    try {
      const contentContext = client.content.v1.contents(sid) as any;
      const approval = contentContext.approvalFetch?.fetch
        ? await contentContext.approvalFetch.fetch()
        : await contentContext.approvalRequests().fetch();

      return {
        status: (approval as any).status ?? 'draft',
        category: (approval as any).category,
        rejectionReason: (approval as any).rejectionReason,
      };
    } catch (error: any) {
      if (error?.status === 404) {
        return { status: 'unsubmitted' };
      }
      throw error;
    }
  }

  async delete(sid: string, config: TwilioConfig): Promise<void> {
    const client = this.getClient(config);
    await client.content.v1.contents(sid).remove();
  }
}
