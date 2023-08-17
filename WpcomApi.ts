import {requestUrl} from "obsidian";
import ObsidianPress from "./main";

export class WpcomApi {
	plugin: ObsidianPress

	constructor(plugin: ObsidianPress) {
		this.plugin = plugin;
	}

	authenticatedRequest(url: string) {
		return requestUrl({
			url: url,
			method: 'GET',
			headers: {
				'User-Agent': 'obsidian.md',
				'authorization': `Bearer ${this.plugin.settings.accessToken}`
			}
		})
	}
}

