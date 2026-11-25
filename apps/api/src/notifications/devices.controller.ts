import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { deviceSchema, type DeviceInput } from '@tandems/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import type { Model } from 'mongoose';
import { openApiSchema, ZodPipe } from '../common/zod.js';
import { UsersService } from '../users/users.service.js';
import { DeviceToken } from './device-token.schema.js';

@ApiTags('me')
@ApiCookieAuth()
@Controller('me/devices')
export class DevicesController {
  constructor(
    private readonly users: UsersService,
    @InjectModel(DeviceToken.name) private readonly tokens: Model<DeviceToken>,
  ) {}

  /** Registrar este dispositivo para avisos push (PermisoNotificaciones). */
  @Post()
  @HttpCode(204)
  @ApiBody({ schema: openApiSchema(deviceSchema) })
  @ApiNoContentResponse()
  async register(
    @Session() auth: UserSession,
    @Body(new ZodPipe(deviceSchema)) body: DeviceInput,
  ): Promise<void> {
    const me = await this.users.ensureProfile(auth.user);
    // Un token es de un solo dispositivo: si cambia de cuenta, pasa a la nueva
    await this.tokens.updateOne(
      { expo_push_token: body.token },
      { user_id: me._id, platform: body.platform, last_seen_at: new Date() },
      { upsert: true },
    );
  }

  /** Al cerrar sesión: este dispositivo deja de recibir avisos de esta cuenta. */
  @Post('unregister')
  @HttpCode(204)
  @ApiBody({ schema: openApiSchema(deviceSchema) })
  @ApiNoContentResponse()
  async unregister(
    @Session() auth: UserSession,
    @Body(new ZodPipe(deviceSchema)) body: DeviceInput,
  ): Promise<void> {
    const me = await this.users.ensureProfile(auth.user);
    await this.tokens.deleteOne({ expo_push_token: body.token, user_id: me._id });
  }
}
