/**
 * @myvenus-summits/omnichannel
 *
 * Omnichannel messaging module for NestJS
 * Supports WhatsApp, Instagram, LINE and more
 *
 * @version 1.0.0
 * @breaking-change v1.0.0: Entities removed. Use interfaces and inject repositories.
 */

// Module
export * from './omnichannel.module';

// Interfaces (includes entity interfaces and repository interfaces)
export * from './interfaces';

// Types
export * from './types';

// DTOs
export * from './dto';

// Services
export * from './services';

// Adapters
export * from './adapters';

// Gateways
export * from './gateways';

// Controllers
export * from './controllers';
