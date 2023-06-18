import { Field, InputType, Int } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { IsEmail, MinLength } from 'class-validator';

@InputType()
export class WhereCustomerInput {
  @Field(() => String, { nullable: true })
  id?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}

@InputType()
export class GetCustomerInput {
  @Field(() => String, { nullable: true })
  cursor?: Prisma.CustomerWhereUniqueInput;

  @Field(() => Int, { nullable: true })
  skip: number;

  @Field(() => Int, { nullable: true })
  take: number;

  @Field(() => WhereCustomerInput, { nullable: true })
  where: WhereCustomerInput;
}

@InputType()
export class CreateCustomerInput {
  @Field(() => String, { nullable: false })
  @IsEmail()
  email: string;

  @Field(() => String, { nullable: false })
  name: string;

  @Field(() => String, { nullable: false })
  @MinLength(8)
  password: string;
}

@InputType()
export class UpdateCustomerInput {
  @Field(() => String, { nullable: false })
  id: string;

  @Field(() => String, { nullable: true })
  name?: string;
}

@InputType()
export class DeleteCustomerInput {
  @Field(() => String, { nullable: false })
  id: string;
}

@InputType()
export class ActivateCustomerInput {
  @Field(() => String, { nullable: false })
  activationCode: string;
}
