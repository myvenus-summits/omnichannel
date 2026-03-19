import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  UnauthorizedException,
  Req,
  Inject,
  Optional,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { validateRequest } from 'twilio';
import { WebhookService } from '../services/webhook.service';
import { TwilioWebhookDto, MetaVerifyDto } from '../dto';
import {
  OMNICHANNEL_MODULE_OPTIONS,
  type OmnichannelModuleOptions,
  type WebhookChannelResolver,
  type ResolvedChannelConfig,
} from '../interfaces';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly appUrl: string;
  private readonly twilioAuthToken: string;
  private readonly webhookChannelResolver: WebhookChannelResolver | null;

  constructor(
    @Optional()
    @Inject(OMNICHANNEL_MODULE_OPTIONS)
    private readonly options: OmnichannelModuleOptions | undefined,
    private readonly webhookService: WebhookService,
  ) {
    this.appUrl = options?.appUrl ?? '';
    this.twilioAuthToken = options?.twilio?.authToken ?? '';
    this.webhookChannelResolver = options?.webhookChannelResolver ?? null;
  }

  @Post('twilio')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Twilio Webhook 수신' })
  @ApiResponse({ status: 200, description: 'Webhook 처리 완료' })
  @ApiResponse({ status: 401, description: 'Invalid Twilio signature' })
  async handleTwilio(@Req() req: Request, @Body() payload: TwilioWebhookDto) {
    const webhookUrl = `${this.appUrl}/webhooks/twilio`;
    const resolvedConfig = await this.resolveAndValidateTwilioSignature(req, webhookUrl, 'inbound');

    // Log webhook format for debugging
    const webhookFormat = payload.EventType
      ? 'Conversations API'
      : payload.SmsMessageSid || payload.MessageSid
        ? 'Messaging API'
        : 'Unknown';
    this.logger.log(
      `Received Twilio webhook (${webhookFormat}): ${payload.EventType ?? payload.SmsMessageSid ?? payload.MessageSid ?? 'N/A'}`,
    );

    try {
      await this.webhookService.handleTwilioWebhook(payload, resolvedConfig);
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to process Twilio webhook', error);
      return { success: false, error: 'Processing failed' };
    }
  }

  @Get('meta')
  @ApiOperation({ summary: 'Meta Webhook 검증 (GET)' })
  @ApiResponse({ status: 200, description: 'Challenge 반환' })
  @ApiResponse({ status: 403, description: '검증 실패' })
  verifyMeta(@Query() query: MetaVerifyDto) {
    this.logger.log('Meta webhook verification request');

    if (query['hub.mode'] !== 'subscribe') {
      throw new BadRequestException('Invalid hub.mode');
    }

    const challenge = this.webhookService.verifyMetaWebhook(
      query['hub.verify_token'],
      query['hub.challenge'],
    );

    if (challenge) {
      return challenge;
    }

    throw new BadRequestException('Verification failed');
  }

  @Post('meta')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Meta Webhook 수신 (Instagram/Messenger)' })
  @ApiResponse({ status: 200, description: 'Webhook 처리 완료' })
  handleMeta(@Body() payload: unknown) {
    this.logger.log('Received Meta webhook');

    try {
      this.webhookService.handleMetaWebhook(payload);
      return 'EVENT_RECEIVED';
    } catch (error) {
      this.logger.error('Failed to process Meta webhook', error);
      return 'EVENT_RECEIVED';
    }
  }

  @Post('twilio/status')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleTwilioStatus(@Req() req: Request, @Body() payload: unknown) {
    const webhookUrl = `${this.appUrl}/webhooks/twilio/status`;
    const resolvedConfig = await this.resolveAndValidateTwilioSignature(req, webhookUrl, 'status');

    this.logger.log('Received Twilio status callback');

    try {
      await this.webhookService.handleTwilioWebhook(payload, resolvedConfig);
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to process Twilio status callback', error);
      return { success: false };
    }
  }

  private async resolveAndValidateTwilioSignature(
    req: Request,
    webhookUrl: string,
    webhookType: 'inbound' | 'status' = 'inbound',
  ): Promise<ResolvedChannelConfig | null> {
    const twilioSignature = req.headers['x-twilio-signature'] as string;
    const body = req.body as Record<string, string>;
    let resolvedConfig: ResolvedChannelConfig | null = null;
    let authToken = this.twilioAuthToken;

    // 병원별 authToken 조회 시도
    if (this.webhookChannelResolver) {
      // Status callback: From = 비즈니스 번호 → 먼저 시도
      // Inbound message: To = 비즈니스 번호 → 먼저 시도
      const identifiers = webhookType === 'status'
        ? [body.From, body.To].filter(Boolean)
        : [body.To, body.From].filter(Boolean);
      for (const id of identifiers) {
        try {
          const resolved = await this.webhookChannelResolver('whatsapp', id);
          if (resolved?.twilio?.authToken) {
            authToken = resolved.twilio.authToken;
            resolvedConfig = resolved;
            break;
          }
        } catch (e) {
          this.logger.warn(`Failed to resolve channel for ${id}: ${e}`);
        }
      }
    }

    // 서명 검증
    if (authToken && twilioSignature) {
      const isValid = validateRequest(authToken, twilioSignature, webhookUrl, body);
      if (!isValid) {
        this.logger.warn('Invalid Twilio signature detected');
        throw new UnauthorizedException('Invalid Twilio signature');
      }
    } else if (process.env['NODE_ENV'] === 'production') {
      this.logger.error('Missing Twilio signature or auth token in production');
      throw new UnauthorizedException('Twilio signature verification required');
    }

    return resolvedConfig;
  }
}
