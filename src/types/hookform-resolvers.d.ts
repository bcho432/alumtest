declare module '@hookform/resolvers/zod' {
  import { Resolver } from 'react-hook-form';
  import { z } from 'zod';

  export function zodResolver<T extends z.ZodType<any, any>>(
    schema: T,
    schemaOptions?: Partial<z.ParseParams>,
    resolverOptions?: {
      mode?: 'async' | 'sync';
      rawValues?: boolean;
    }
  ): Resolver<z.infer<T>>;
} 