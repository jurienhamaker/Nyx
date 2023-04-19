import {
	CanActivate,
	ExecutionContext,
	Injectable,
	Logger,
} from '@nestjs/common';
import { NecordExecutionContext } from 'necord';
import { LavalinkService } from '../services/lavalink.service';
import { HasNoPlayerException } from '../util/errors';

@Injectable()
export class MusicHasPlayerGuard implements CanActivate {
	private readonly _logger = new Logger(MusicHasPlayerGuard.name);

	constructor(private _lavalink: LavalinkService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const ctx = NecordExecutionContext.create(context);
		const [interaction] = ctx.getContext<'interactionCreate'>();
		if (
			interaction.isContextMenuCommand() ||
			interaction.isUserContextMenuCommand()
		) {
			return false;
		}

		const player = this._lavalink.players.get(interaction.guildId);
		if (!player) {
			throw new HasNoPlayerException();
		}

		return true;
	}
}
