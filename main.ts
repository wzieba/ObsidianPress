import {App, Plugin, PluginSettingTab, Setting} from 'obsidian';
import {MentionSuggest} from "./MentionSuggest";
import {mentionsViewPlugin} from "./MentionsPlugin";
import {MentionPostProcessor} from "./MentionPostProcessor";
import {WpcomApi} from "./WpcomApi";
import {AuthenticationRepository} from "./AuthenticationRepository";

export interface PluginSettings {
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
	authenticationRepository: AuthenticationRepository;

	async onload() {
		await this.loadSettings();
		this.authenticationRepository = new AuthenticationRepository(this.settings, this.saveData)

		this.registerObsidianProtocolHandler("obsidianpress-plugin-oauth", async (data) => {
			await this.authenticationRepository.requestAuthTokenUpdate(data.code).then((token) => {
				this.settings.accessToken = token
				this.saveSettings()
			})
		})

		this.addSettingTab(new SettingsTab(this.app, this));
		this.registerEditorSuggest(new MentionSuggest(this.app, this, new WpcomApi(this)));
		this.registerMarkdownPostProcessor(MentionPostProcessor.mentionsProcessor)
		this.registerEditorExtension(mentionsViewPlugin)
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

		new Setting(containerEl)
			.setName('Authorize')
			.addButton(button => button
				.setButtonText("Authorize with WPCOM")
				.onClick(() => {
					window.open(AuthenticationRepository.getAuthorizeServerUrlParams());
				})
			)
	}
}
