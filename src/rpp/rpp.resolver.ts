import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RppService } from './rpp.service';
import { Rpp } from './models/rpp.model';
import { CreateRppInput } from './dto/create-rpp.input';

@Resolver(() => Rpp)
export class RppResolver {
  constructor(private rppService: RppService) {}

  @Query(() => String, { name: 'hello' })
  async hello(): Promise<string> {
    return 'Hello RPP Generator!';
  }

  @Mutation(() => Rpp)
  async createRpp(@Args('input') input: CreateRppInput): Promise<Rpp> {
    return this.rppService.generateRpp(input);
  }
}