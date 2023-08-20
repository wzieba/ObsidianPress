import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile
} from "obsidian";
import {PluginSettings} from "./main";
import {WpcomApi} from "./networking/WpcomApi";
import * as fuzzysort from "fuzzysort";

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

	settings: PluginSettings;
	wpcomApi: WpcomApi;

	constructor(app: App, settings: PluginSettings, wpcomApi: WpcomApi) {
		super(app);
		this.settings = settings
		this.wpcomApi = wpcomApi
	}

	getSuggestions(context: EditorSuggestContext): WPUser[] | Promise<WPUser[]> {
		return fuzzysort.go(context.query.replace(' ', ''), this.settings.cachedUsers, {
			keys: ['userLogin', 'name'],
			all: true
		}).map((result) => result.obj)
	}

	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile | null): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line).substring(0, cursor.ch);

		if (!line.contains('@')) return null;

		const currentPart = line.split('@').reverse()[0];

		if (currentPart.includes(' ')) return null;

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

		this.wpcomApi.get(value.avatar + "&w=32").then(response => {
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
