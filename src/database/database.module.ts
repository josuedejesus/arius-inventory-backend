import { Module } from "@nestjs/common";
import { KnexProvider } from "./knex.provider";

@Module({
    providers: [KnexProvider],
    exports: ['KNEX'],
    
})

export class DatabaseModule {}