import { Args, Mutation, Query, Resolver, ObjectType, Field } from '@nestjs/graphql';
import { RppService, TokenUsage } from './rpp.service';
import { Rpp } from './models/rpp.model';
import { CreateRppInput } from './dto/create-rpp.input';

@ObjectType()
export class TokenUsageInfo {
  @Field()
  promptTokens: number;

  @Field()
  completionTokens: number;

  @Field()
  totalTokens: number;
}

@Resolver(() => Rpp)
export class RppResolver {
  constructor(private rppService: RppService) {}

  @Query(() => String, { name: 'hello' })
  async hello(): Promise<string> {
    return 'Hello RPP Generator!';
  }

  @Query(() => TokenUsageInfo)
  async getTokenUsage(): Promise<TokenUsageInfo> {
    return this.rppService.getTokenUsage();
  }

  @Mutation(() => Rpp)
  async createRpp(@Args('input') input: CreateRppInput): Promise<Rpp> {
    return this.rppService.generateRpp(input);
  }
}