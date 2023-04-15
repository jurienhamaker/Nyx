import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	ForbiddenException,
	Logger,
} from '@nestjs/common';
import { EmbedBuilder } from 'discord.js';
import { SlashCommandContext } from 'necord';

@Catch(ForbiddenException)
export class ForbiddenExceptionFilter implements ExceptionFilter {
	private readonly _logger = new Logger(ForbiddenExceptionFilter.name);

	async catch(exception: Error, host: ArgumentsHost) {
		const [interaction] = host.getArgByIndex<SlashCommandContext>(0) ?? [
			undefined,
		];
		const message = {
			embeds: [
				new EmbedBuilder()
					.setColor('Red')
					.setTitle('Forbidden')
					.setDescription(`Sorry, you can't use this command!`),
			],
		};
		this._logger.error(exception);

		if (!interaction) {
			return;
		}

		if (interaction.deferred) {
			return interaction.editReply(message);
		}

		if (interaction.replied) {
			return interaction.followUp({ ...message, ephemeral: true });
		}

		return interaction.reply({ ...message, ephemeral: true });
	}
}
