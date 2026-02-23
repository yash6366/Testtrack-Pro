import z from 'zod';

const SignupRoleSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toUpperCase() : value),
  z.enum(['DEVELOPER', 'TESTER'])
);

const StrongPasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .refine((password) => /[a-z]/.test(password), {
    message: 'Password must contain at least one lowercase letter',
  })
  .refine((password) => /[A-Z]/.test(password), {
    message: 'Password must contain at least one uppercase letter',
  })
  .refine((password) => /[0-9]/.test(password), {
    message: 'Password must contain at least one number',
  })
  .refine((password) => /[!@#$%^&*(),.?":{}|<>]/.test(password), {
    message: 'Password must contain at least one special character',
  });

export const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: StrongPasswordSchema,
  role: SignupRoleSchema.default('DEVELOPER'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const AuthResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.string(),
  }),
  token: z.string(),
});
