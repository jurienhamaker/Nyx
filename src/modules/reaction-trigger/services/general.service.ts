import { PrismaService } from '@muse/modules/prisma';
import { escapeRegExp } from '@muse/util/regex';
import { Injectable, Logger } from '@nestjs/common';
import { Client, Message } from 'discord.js';
import { ReactionTriggerSettingsService } from './settings.service';

@Injectable()
export class ReactionTriggerGeneralService {
	private readonly _logger = new Logger(ReactionTriggerGeneralService.name);

	constructor(
		private _prisma: PrismaService,
		private _settings: ReactionTriggerSettingsService,
		private _client: Client,
	) {}

	public async getReactionTriggers(guildId: string, page = 1) {
		const where = {
			guildId,
		};

		const triggers = await this._prisma.messageReactionTriggers.findMany({
			where,
		});

		const resolvedTriggers = triggers
			.map((trigger) => {
				const resolvedEmoji = this._client.emojis.resolve(
					trigger.emojiId,
				);

				return {
					...trigger,
					emoji: resolvedEmoji,
				};
			})
			.filter((trigger) => !!trigger.emoji);

		return {
			triggers: resolvedTriggers.slice(10 * (page - 1), 10 * page),
			total: resolvedTriggers.length,
		};
	}

	public addReactionTriggerByWord(
		guildId: string,
		phrase: string,
		emojiId: string,
	) {
		return this._prisma.messageReactionTriggers.create({
			data: {
				guildId,
				phrase,
				emojiId,
			},
		});
	}

	public async removeReactionTriggerByID(guildId: string, id: number) {
		const trigger = await this._prisma.messageReactionTriggers.findFirst({
			where: {
				guildId,
				id,
			},
		});

		if (!trigger) {
			return null;
		}

		await this._prisma.messageReactionTriggers.delete({
			where: {
				id: trigger.id,
			},
		});

		return trigger;
	}

	public async checkForReactionTriggers(message: Message) {
		if (!message.inGuild() || message.author.bot) {
			return;
		}

		const { ignoredChannelIds } = await this._settings.get(message.guildId);
		if (ignoredChannelIds.indexOf(message.channelId) >= 0) {
			return;
		}

		const where = {
			guildId: message.guildId,
		};

		const triggersCount = await this._prisma.messageReactionTriggers.count({
			where,
		});

		if (!triggersCount) {
			return;
		}

		const triggers = await this._prisma.messageReactionTriggers.findMany({
			where,
		});

		for (const { id, phrase, emojiId } of triggers) {
			const regexInstance = new RegExp(escapeRegExp(phrase), 'ig');
			const test = regexInstance.test(message.content);
			if (!test) {
				continue;
			}

			this._logger.debug(
				`Got a match for ${regexInstance} on ${message.guildId}, adding emote with id ${emojiId}`,
			);
			await message.react(emojiId).catch((err) => {
				if (err.message === 'Unknown Emoji') {
					return this._logger.warn(
						`Found a stray reaction trigger with id "${id}" for emoji ${emojiId}`,
					);
				}

				throw err;
			});
		}
	}
}
