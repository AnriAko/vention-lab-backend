import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('PaginationMeta')
export class PaginationMetaResponse {
    @Field(() => Int)
    page!: number;

    @Field(() => Int)
    limit!: number;

    @Field(() => Int)
    total!: number;
}
