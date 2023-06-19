import { Customer, Role } from 'src/customer/customer';

export const customerMockPassword = 'test1234';
export const customerMock: Customer = {
  id: '1234',
  email: 'test@test.com',
  password: '$2a$10$UAGutHBbJbI1LLoh91GO7.tj1RBk24CwfVBd/mHMSYGcPdri5CTYC', // test1234
  name: 'Test',
  createdAt: new Date('2023-06-18T19:20:11.177Z'),
  updatedAt: new Date('2023-06-18T19:20:11.177Z'),
  isActive: true,
  role: Role.User,
};
