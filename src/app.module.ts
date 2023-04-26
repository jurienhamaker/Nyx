import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { SentryInterceptor, SentryModule } from '@ntegral/nestjs-sentry';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { GatewayIntentBits } from 'discord.js';
import { NecordModule } from 'necord';
import { AppController } from './app.controller';
import { AppEvents } from './events/app.events';
import { GuildEvents } from './events/guild.events';
import { InteractionEvents } from './events/interaction.events';
import { MessageEvents } from './events/message.events';
import { MetricsEvents } from './events/metrics.events';
import { MuseLoggerModule } from './logger/logger.module';
import { botMetrics } from './metrics/bot.metrics';
import { channelMetrics } from './metrics/channel.metrics';
import { guildMetrics } from './metrics/guild.metrics';
import { interactionMetrics } from './metrics/interaction.metrics';
import { userMetrics } from './metrics/user.metrics';
import { LoggerMiddleware } from './middleware/log.middleware';
import { AdminModule, BookwormModule } from './modules';
import { MusicModule } from './modules/music';
import { SettingsModule } from './modules/settings';
import { AppService } from './services';
import { SharedModule } from './shared.module';

@Module({
	imports: [
		NecordModule.forRoot({
			development:
				process.env.NODE_ENV !== 'production'
					? process.env.DEVELOPMENT_SERVER_IDS.split(',')
					: false,
			skipRegistration: process.env.REGISTER_COMMANDS === 'false',
			token: process.env.DISCORD_TOKEN,
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildVoiceStates,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.GuildEmojisAndStickers,
				GatewayIntentBits.GuildMessageReactions,
			],
		}),
		SentryModule.forRoot({
			dsn: process.env.SENTRY_DNS,
			debug: process.env.NODE_ENV !== 'production',
			environment:
				process.env.NODE_ENV === 'production'
					? 'production'
					: 'development',
			logLevels: ['error'], //based on sentry.io loglevel //
			sampleRate: 1,
			close: {
				enabled: process.env.NODE_ENV === 'production',
				timeout: 5000,
			},
		}),
		PrometheusModule.register(),
		ScheduleModule.forRoot(),

		// logger
		MuseLoggerModule,

		// shared
		SharedModule,

		// Custom modules
		AdminModule,
		SettingsModule,
		BookwormModule,
		MusicModule,
	],
	controllers: [AppController],
	providers: [
		AppService,

		{
			provide: APP_INTERCEPTOR,
			useFactory: () => new SentryInterceptor(),
		},

		// prometheus
		...botMetrics,
		...guildMetrics,
		...channelMetrics,
		...userMetrics,
		...interactionMetrics,

		// events
		AppEvents,
		MessageEvents,
		InteractionEvents,
		GuildEvents,
		MetricsEvents,
	],
})
export class AppModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggerMiddleware).forRoutes({
			path: '*',
			method: RequestMethod.ALL,
		});
	}
}
