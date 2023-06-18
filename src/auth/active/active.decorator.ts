import { SetMetadata } from '@nestjs/common';

export const IS_ACTIVE_CUSTOMER_KEY = 'isActive';
export const ActiveCustomer = () => SetMetadata(IS_ACTIVE_CUSTOMER_KEY, true);
