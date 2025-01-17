import { Injectable } from '@nestjs/common';
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

import { TimezoneSettingsInterface } from '../types/settings.interface';
import {
	TIMEZONE_EMBED_COLOR,
	TIMEZONE_SETTINGS_CHOICES,
} from '../util/constants';

import { BaseSettingsService } from '@muse/base';
import { SettingsService } from '@muse/modules/settings';
import { ALL_SETTINGS_BUTTON } from '@muse/modules/settings/util/constants';

import { MESSAGE_PREFIX } from '@util';

@Injectable()
export class TimezoneSettingsService extends BaseSettingsService<TimezoneSettingsInterface> {
	protected _base = 'timezone';

	constructor(protected _settings: SettingsService) {
		super(_settings);
	}

	async showSettings(
		interaction: MessageComponentInteraction | CommandInteraction
	) {
		const settings = await this.get(interaction.guildId);

		if (!settings) {
			return;
		}

		const { enabled, ignoredChannelIds } = settings;

		const embed = new EmbedBuilder()
			.setColor(TIMEZONE_EMBED_COLOR)
			.setTitle('Timezone settings')
			.setDescription(`These are the settings for the timezone module`)
			.addFields(
				{
					name: 'Status',
					value: enabled ? 'Enabled' : 'Disabled',
					inline: true,
				},
				{
					name: 'Ignored Channels',
					value: ignoredChannelIds?.length
						? ignoredChannelIds.map(id => `<#${id}>`).join('\n')
						: '-',
					inline: true,
				}
			);

		const promptRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(`TIMEZONE_SETTINGS_PROMPT`)
				.setLabel('Change settings')
				.setStyle(ButtonStyle.Primary),
			ALL_SETTINGS_BUTTON
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
		message?: string
	) {
		const select = new StringSelectMenuBuilder()
			.setCustomId('TIMEZONE_SETTINGS_CHANGE_SELECT')
			.setPlaceholder('Select the option to change')
			.setOptions(
				TIMEZONE_SETTINGS_CHOICES.map(({ name, description, value }) =>
					new StringSelectMenuOptionBuilder()
						.setLabel(name)
						.setDescription(description)
						.setValue(value)
				)
			);

		const selectRow =
			new ActionRowBuilder<SelectMenuBuilder>().addComponents(select);

		const showRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(`TIMEZONE_SETTINGS_SHOW`)
				.setLabel('Show settings')
				.setStyle(ButtonStyle.Primary),
			ALL_SETTINGS_BUTTON
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

	async ignoreChannel(guildId: string, channelId: string, value = true) {
		const settings = await this.get(guildId);

		if (!settings) {
			return;
		}

		const { ignoredChannelIds } = settings;
		const index = ignoredChannelIds.indexOf(channelId);

		if (!value && index >= 0) {
			ignoredChannelIds.splice(index, 1);
		}

		if (value && index === -1) {
			ignoredChannelIds.push(channelId);
		}

		return this.set(guildId, 'ignoredChannelIds', ignoredChannelIds);
	}
}
