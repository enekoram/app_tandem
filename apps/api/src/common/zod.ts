import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { z, type ZodType } from 'zod';

/** Valida y transforma el cuerpo con un esquema Zod de `@tandems/shared`. */
export class ZodPipe<T extends ZodType> implements PipeTransform<unknown, z.output<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    throw new BadRequestException({
      code: 'VALIDATION',
      message: 'Datos no válidos',
      issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
}

/** JSON Schema (OpenAPI 3.0) de un esquema Zod, para `@ApiBody({ schema })`. */
export function openApiSchema(schema: ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { target: 'openapi-3.0', io: 'input' }) as Record<
    string,
    unknown
  >;
  delete json.$schema;
  return json;
}
