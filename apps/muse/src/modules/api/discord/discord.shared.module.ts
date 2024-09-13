import { SharedModule } from '@muse/shared.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { DiscordApiService } from './services/api.service';

@Module({
	imports: [SharedModule, HttpModule],
	providers: [DiscordApiService],
	exports: [DiscordApiService],
})
export class DiscordSharedModule {}
