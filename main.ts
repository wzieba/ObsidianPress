import {
	App,
	Plugin,
	PluginSettingTab,
	requestUrl,
	Setting
} from 'obsidian';

// Remember to rename these classes and interfaces!

interface PluginSettings {
	accessToken: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	accessToken: ''
}

export function generateQueryString(params: Record<string, undefined | number | string>): string {
	return new URLSearchParams(
		Object.fromEntries(
			Object.entries(params).filter(([k, v]) => v !== undefined)
		) as Record<string, string>
	).toString();
}

export default class ObsidianPress extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerObsidianProtocolHandler("obsidianpress-plugin-oauth", async (data) => {
			requestUrl({
				url: "https://public-api.wordpress.com/oauth2/token",
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'User-Agent': 'obsidian.md'
				},
				body: generateQueryString({
					grant_type: 'authorization_code',
					client_id: "89477",
					code: data.code,
					redirect_uri: "obsidian://obsidianpress-plugin-oauth",
				})
			}).then(response => {
				console.log('getToken response', response);

				this.settings.accessToken = response.json.access_token
				this.saveSettings()
			}).catch(function (error) {
				console.log(error.message);
			});
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingsTab(this.app, this));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SettingsTab extends PluginSettingTab {
	plugin: ObsidianPress;

	constructor(app: App, plugin: ObsidianPress) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		const authUrl = new URL("https://public-api.wordpress.com/oauth2/authorize")
		authUrl.searchParams.append("client_id", "89477")
		authUrl.searchParams.append("redirect_uri", "obsidian://obsidianpress-plugin-oauth")
		authUrl.searchParams.append("response_type", "code")
		authUrl.searchParams.append("blog", "wooengage.wordpress.com")
		authUrl.searchParams.append("scope", "users")

		new Setting(containerEl)
			.setName('Authorize')
			.addButton(button => button
				.setButtonText("Authorize with WPCOM")
				.onClick(() => {
					window.open(authUrl.href);
				})
			)
	}
}
