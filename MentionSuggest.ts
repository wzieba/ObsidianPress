import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile
} from "obsidian";
import ObsidianPress from "./main";
import {WpcomApi} from "./WpcomApi";

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

const emptyImage = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

export class MentionSuggest extends EditorSuggest<WPUser> {

	users: WPUser[] = [];
	plugin: ObsidianPress;
	wpcomApi: WpcomApi

	constructor(app: App, plugin: ObsidianPress, wpComApi: WpcomApi) {
		super(app);
		this.plugin = plugin
		this.wpcomApi = wpComApi

		wpComApi.authenticatedRequest(
			"https://public-api.wordpress.com/rest/v1.1/users/suggest?site_id=208157483",
		).then(response => {
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

		this.wpcomApi.authenticatedRequest(value.avatar + "&w=32").then(response => {
			const arrayBuffer = response.arrayBuffer;
			const bytes = new Uint8Array(arrayBuffer);
			const blob = new Blob([bytes.buffer]);

			const reader = new FileReader();
			reader.onload = function (event) {
				avatar.src = event.target.result;
			};
			reader.readAsDataURL(blob);
		}).catch((error) => {
			console.log(error)
			avatar.src = emptyImage
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
