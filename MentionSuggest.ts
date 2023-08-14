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

	constructor(userLogin: string) {
		this.userLogin = userLogin;
	}
}

export class MentionSuggest extends EditorSuggest<WPUser> {

	users: WPUser[] = [];

	constructor(app: App, plugin: ObsidianPress) {
		super(app);

		requestUrl({
			url: "https://public-api.wordpress.com/rest/v1.1/users/suggest?site_id=208157483",
			method: 'GET',
			headers: {
				'User-Agent': 'obsidian.md',
				'authorization': `Bearer ${plugin.settings.accessToken}`
			}
		}).then(response => {
			this.users = response.json.suggestions.map((jsonUser) => new WPUser(jsonUser.user_login))
			console.log(`Fetched users to suggest: ${this.users.map((it) => it.userLogin)}`)
		});
	}

	getSuggestions(context: EditorSuggestContext): WPUser[] | Promise<WPUser[]> {
		return this.users.filter((user) => user.userLogin.includes(context.query))
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
		const text = el.doc.createElement("div");
		text.addClass("completr-suggestion-text");
		text.setText(value.userLogin);
		el.appendChild(text);
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
