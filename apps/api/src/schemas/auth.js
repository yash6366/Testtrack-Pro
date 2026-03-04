import z from 'zod';
import { isCommonPassword } from '../lib/commonPasswords.js';

const SignupRoleSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toUpperCase() : value),
  z.enum(['DEVELOPER', 'TESTER']),
);

const StrongPasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be at most 128 characters long')
  .refine((password) => /[a-z]/.test(password), {
    message: 'Password must contain at least one lowercase letter',
  })
  .refine((password) => /[A-Z]/.test(password), {
    message: 'Password must contain at least one uppercase letter',
  })
  .refine((password) => /[0-9]/.test(password), {
    message: 'Password must contain at least one number',
  })
  .refine((password) => /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'`~]/.test(password), {
    message: 'Password must contain at least one special character',
  })
  .refine((password) => !isCommonPassword(password), {
    message: 'This password is too common. Please choose a stronger password.',
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
