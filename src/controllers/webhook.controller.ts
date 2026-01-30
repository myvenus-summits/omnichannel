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
} from '../interfaces';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly appUrl: string;
  private readonly twilioAuthToken: string;

  constructor(
    @Optional()
    @Inject(OMNICHANNEL_MODULE_OPTIONS)
    private readonly options: OmnichannelModuleOptions | undefined,
    private readonly webhookService: WebhookService,
  ) {
    this.appUrl = options?.appUrl ?? '';
    this.twilioAuthToken = options?.twilio?.authToken ?? '';
  }

  @Post('twilio')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Twilio Webhook 수신' })
  @ApiResponse({ status: 200, description: 'Webhook 처리 완료' })
  @ApiResponse({ status: 401, description: 'Invalid Twilio signature' })
  async handleTwilio(@Req() req: Request, @Body() payload: TwilioWebhookDto) {
    const twilioSignature = req.headers['x-twilio-signature'] as string;
    const webhookUrl = `${this.appUrl}/webhooks/twilio`;

    if (this.twilioAuthToken && twilioSignature) {
      const isValid = validateRequest(
        this.twilioAuthToken,
        twilioSignature,
        webhookUrl,
        req.body as Record<string, string>,
      );

      if (!isValid) {
        this.logger.warn('Invalid Twilio signature detected');
        throw new UnauthorizedException('Invalid Twilio signature');
      }
    } else if (process.env['NODE_ENV'] === 'production') {
      this.logger.error('Missing Twilio signature or auth token in production');
      throw new UnauthorizedException('Twilio signature verification required');
    }

    this.logger.log(`Received Twilio webhook: ${payload.EventType}`);

    try {
      await this.webhookService.handleTwilioWebhook(payload);
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
    const twilioSignature = req.headers['x-twilio-signature'] as string;
    const webhookUrl = `${this.appUrl}/webhooks/twilio/status`;

    if (this.twilioAuthToken && twilioSignature) {
      const isValid = validateRequest(
        this.twilioAuthToken,
        twilioSignature,
        webhookUrl,
        req.body as Record<string, string>,
      );

      if (!isValid) {
        this.logger.warn('Invalid Twilio signature on status callback');
        throw new UnauthorizedException('Invalid Twilio signature');
      }
    } else if (process.env['NODE_ENV'] === 'production') {
      throw new UnauthorizedException('Twilio signature verification required');
    }

    this.logger.log('Received Twilio status callback');

    try {
      await this.webhookService.handleTwilioWebhook(payload);
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to process Twilio status callback', error);
      return { success: false };
    }
  }
}
