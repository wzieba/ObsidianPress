import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	requestUrl,
	TFile
} from "obsidian";
import ObsidianPress from "./main";

export class WPUser {
	userLogin: string;
	name: string;
	avatar: string;

	constructor(username: string, name: string, avatar: string) {
		this.userLogin = username;
		this.name = name;
		this.avatar = avatar;
	}
}

export class MentionSuggest extends EditorSuggest<WPUser> {

	users: WPUser[] = [];
	plugin: ObsidianPress;

	constructor(app: App, plugin: ObsidianPress) {
		super(app);
		this.plugin = plugin

		requestUrl({
			url: "https://public-api.wordpress.com/rest/v1.1/users/suggest?site_id=208157483",
			method: 'GET',
			headers: {
				'User-Agent': 'obsidian.md',
				'authorization': `Bearer ${plugin.settings.accessToken}`
			}
		}).then(response => {
			this.users = response.json.suggestions.map((jsonUser) => new WPUser(
				jsonUser.user_login,
				jsonUser.display_name,
				jsonUser.image_URL,
			))
		});
	}

	getSuggestions(context: EditorSuggestContext): WPUser[] | Promise<WPUser[]> {
		return this.users.filter((user) => user.userLogin.includes(context.query) || user.name.includes(context.query))
	}

	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile | null): EditorSuggestTriggerInfo | null {
		//TODO
		const line = editor.getLine(cursor.line).substring(0, cursor.ch);

		if (!line.contains('@')) return null;

		const currentPart = line.split('@').reverse()[0];
		const currentStart: number = [...line.matchAll(new RegExp('@', 'g'))].reverse()[0].index;

		return {
			start: {
				ch: currentStart,
				line: cursor.line,
			},
			end: cursor,
			query: currentPart,
		};
	}

	renderSuggestion(value: WPUser, el: HTMLElement): void {
		const avatar = el.doc.createElement("img")
		avatar.addClass("obsidianpress-suggestion-avatar")

		requestUrl({
			url: value.avatar + "&w=32",
			method: 'GET',
			headers: {
				'authorization': `Bearer ${this.plugin.settings.accessToken}`,
				'User-Agent': 'obsidian.md'
			}
		}).then(response => {

			const arrayBuffer = response.arrayBuffer;
			const bytes = new Uint8Array(arrayBuffer);
			const blob = new Blob([bytes.buffer]);

			const reader = new FileReader();
			reader.onload = function (e) {
				avatar.src = e.target.result;
			};
			reader.readAsDataURL(blob);
		})

		const nameSpan = el.doc.createElement("span");
		nameSpan.addClass("obsidianpress-suggestion-name")
		nameSpan.setText(value.name);
		const usernameSpan = el.doc.createElement("small")
		usernameSpan.addClass("obsidianpress-suggestion-username")
		usernameSpan.setText(value.userLogin)
		el.addClass("obsidianpress-suggestion-container")
		el.append(...[avatar, nameSpan, usernameSpan])
	}

	selectSuggestion(value: WPUser, evt: MouseEvent | KeyboardEvent): void {
		if (this.context) {
			(this.context.editor as Editor)
				.replaceRange(
					`@${value.userLogin} `,
					this.context.start,
					this.context.end
				);
		}
	}

}
