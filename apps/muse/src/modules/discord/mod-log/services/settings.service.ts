import { BaseSettingsService } from '@muse/base';
import { SettingsService } from '@muse/modules/settings';
import { ALL_SETTINGS_BUTTON } from '@muse/modules/settings/util/constants';
import { Injectable } from '@nestjs/common';
import { MESSAGE_PREFIX } from '@util';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	CommandInteraction,
	EmbedBuilder,
	MessageComponentInteraction,
	SelectMenuBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from 'discord.js';
import { ModLogSettingsInterface } from '../types/settings.interface';
import {
	MOD_LOG_EMBED_COLOR,
	MOD_LOG_SETTINGS_CHOICES,
} from '../util/constants';

@Injectable()
export class ModLogSettingsService extends BaseSettingsService<ModLogSettingsInterface> {
	protected _base = 'modLog';

	constructor(protected _settings: SettingsService) {
		super(_settings);
	}

	async showSettings(
		interaction: MessageComponentInteraction | CommandInteraction,
	) {
		const settings = await this.get(interaction.guildId!);

		if (!settings) {
			return;
		}

		const {
			enabled,
			deleteChannelId,
			editChannelId,
			joinChannelId,
			leaveChannelId,
		} = settings;

		const embed = new EmbedBuilder()
			.setColor(MOD_LOG_EMBED_COLOR)
			.setTitle('Mod log settings')
			.setDescription(`These are the settings for the mod log module`)
			.addFields(
				{
					name: 'Status',
					value: enabled ? 'Enabled' : 'Disabled',
					inline: true,
				},
				{
					name: 'Message delete',
					value: deleteChannelId?.length
						? `<#${deleteChannelId}>`
						: '-',
					inline: true,
				},
				{
					name: 'Message edit',
					value: editChannelId?.length ? `<#${editChannelId}>` : '-',
					inline: true,
				},
				{
					name: 'Member join',
					value: joinChannelId?.length ? `<#${joinChannelId}>` : '-',
					inline: true,
				},
				{
					name: 'Member leave',
					value: leaveChannelId?.length
						? `<#${leaveChannelId}>`
						: '-',
					inline: true,
				},
			);

		const promptRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(`MOD_LOG_SETTINGS_PROMPT`)
				.setLabel('Change settings')
				.setStyle(ButtonStyle.Primary),
			ALL_SETTINGS_BUTTON,
		);

		const data = {
			content: '',
			embeds: [embed],
			components: [promptRow],
		};

		if (interaction instanceof MessageComponentInteraction) {
			return interaction.update(data);
		}

		return interaction.reply({
			...data,
			ephemeral: true,
		});
	}

	public promptSettings(
		interaction: MessageComponentInteraction | CommandInteraction,
		isFollowUp = false,
		message?: string,
	) {
		const select = new StringSelectMenuBuilder()
			.setCustomId('MOD_LOG_SETTINGS_CHANGE_SELECT')
			.setPlaceholder('Select the option to change')
			.setOptions(
				MOD_LOG_SETTINGS_CHOICES.map(({ name, description, value }) =>
					new StringSelectMenuOptionBuilder()
						.setLabel(name)
						.setDescription(description)
						.setValue(value),
				),
			);

		const selectRow =
			new ActionRowBuilder<SelectMenuBuilder>().addComponents(select);

		const showRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(`MOD_LOG_SETTINGS_SHOW`)
				.setLabel('Show settings')
				.setStyle(ButtonStyle.Primary),
			ALL_SETTINGS_BUTTON,
		);

		const data = {
			content: `${MESSAGE_PREFIX}${
				isFollowUp ? ` ${message}\n\n` : ' '
			}What option would you like to change?`,
			embeds: [],
			components: [selectRow, showRow],
		};

		if (interaction instanceof MessageComponentInteraction) {
			return interaction.update(data);
		}

		return interaction.reply({
			...data,
			ephemeral: true,
		});
	}
}
