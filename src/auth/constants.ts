export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'super-secret-key-change-it',
  expiresIn: '7d',
};

export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';
