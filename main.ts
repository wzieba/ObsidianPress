import {App, Plugin, PluginSettingTab, Setting} from 'obsidian';
import {MentionSuggest, WPUser} from "./MentionSuggest";
import {mentionsViewPlugin} from "./MentionsPlugin";
import {MentionPostProcessor} from "./MentionPostProcessor";
import {WpcomApi} from "./networking/WpcomApi";
import {AuthenticationRepository} from "./repositories/AuthenticationRepository";
import {PostsRepository} from "./repositories/PostsRepository";
import {FileSystemRepository} from "./repositories/FileSystemRepository";
import {SavePost} from "./usecases/SavePost";
import {FetchPostModal} from "./ui/FetchPostModal";

export interface PluginSettings {
	accessToken: string;
	cachedUsers: WPUser[]
}

const DEFAULT_SETTINGS: PluginSettings = {
	accessToken: '',
	cachedUsers: []
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
		const wpcomApi = new WpcomApi(this);
		const postsRepository = new PostsRepository(wpcomApi)
		const fileSystemRepository = new FileSystemRepository(this.app.vault)
		const savePost = new SavePost(fileSystemRepository, postsRepository)

		this.registerObsidianProtocolHandler("obsidianpress-plugin-oauth", async (data) => {
			await this.authenticationRepository.requestAuthTokenUpdate(data.code).then((token) => {
				this.settings.accessToken = token
				this.saveSettings()
			})
		})
		this.fetchUsers(wpcomApi);

		this.addSettingTab(new SettingsTab(this.app, this));
		this.registerEditorSuggest(new MentionSuggest(this.app, this.settings, wpcomApi));
		this.registerMarkdownPostProcessor(MentionPostProcessor.mentionsProcessor)
		this.registerEditorExtension(mentionsViewPlugin)

		this.addCommand({
			id: 'fetch-post',
			name: 'Fetch and save WPCOM post',
			callback: () => {
				new FetchPostModal(this.app, (url)=>{
					savePost.run(url)
				}).open();
			}
		});
	}

	private fetchUsers(wpcomApi: WpcomApi) {
		wpcomApi.get(
			"https://public-api.wordpress.com/rest/v1.1/users/suggest?site_id=208157483",
		).then(response => {
			const users = response.json.suggestions.map((jsonUser) => new WPUser(
				jsonUser.user_login,
				jsonUser.display_name,
				jsonUser.image_URL,
			))
			this.settings.cachedUsers = users
			this.saveSettings()
		});
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
