import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthCheck, HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongo: MongooseHealthIndicator,
  ) {}

  /** Lo usa Render para saber si el servicio está vivo y conectado a la base de datos. */
  @Get()
  @HealthCheck()
  @ApiOkResponse({ description: 'La API y MongoDB responden' })
  @ApiServiceUnavailableResponse({ description: 'MongoDB no responde' })
  check() {
    return this.health.check([() => this.mongo.pingCheck('mongodb', { timeout: 1500 })]);
  }
}
