import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { EmbedBuilder } from 'discord.js';
import { SlashCommandContext } from 'necord';

import { interactionReply } from '@util';

import { IncorrectChannelException } from '@util/errors';
@Catch(IncorrectChannelException)
export class ChannelExceptionFilter implements ExceptionFilter {
	private readonly _logger = new Logger(ChannelExceptionFilter.name);

	async catch(exception: Error, host: ArgumentsHost) {
		const [interaction] = host.getArgByIndex<SlashCommandContext>(0) ?? [
			undefined,
		];
		const message = {
			embeds: [
				new EmbedBuilder()
					.setColor('Red')
					.setTitle('Incorrect channel')
					.setDescription(exception.message),
			],
		};
		this._logger.error(exception);

		return interactionReply(interaction, message);
	}
}
