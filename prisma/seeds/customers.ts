import { Prisma } from '@prisma/client';

export const customers: Prisma.CustomerUpsertArgs['create'][] = [
  {
    id: '9e391faf-64b2-4d4c-b879-463532920fd3',
    email: 'user@gmail.com',
    password: 'randow-password',
    name: 'User1',
    isActive: true,
  },
  {
    id: '9e391faf-64b2-4d4c-b879-463532920fd4',
    email: 'user2@gmail.com',
    password: 'randow-password',
    name: 'User2',
    isActive: true,
  },
  {
    id: '9e391faf-64b2-4d4c-b879-463532920fd5',
    email: 'admin@gmail.com',
    password: '$2a$10$3lvzF7VO0qJQ1fQ/GunxWeAiumiDcqaJZ5Uf2xtSFcOaQXHHZxDq.',
    name: 'Admin1',
    role: 'ADMIN',
    isActive: true,
  },
];
