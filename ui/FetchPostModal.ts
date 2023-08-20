import {App, KeymapEventHandler, Modal, Setting} from "obsidian";

export class FetchPostModal extends Modal {
	result: string;
	onSubmit: (result: string) => void;
	handler: KeymapEventHandler

	constructor(app: App, onSubmit: (result: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const {contentEl} = this;

		contentEl.createEl("h1", {text: "Post URL"});
		this.handler = this.scope.register([], 'Enter', () => {
			this.saveAndClose();
		})

		new Setting(contentEl)
			.setName("URL of post to fetch")
			.addText((text) =>
				text.onChange((value) => {
					this.result = value
				}));

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Fetch ⏎")
					.setCta()
					.onClick(() => {
						this.saveAndClose()
					}));
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
		this.scope.unregister(this.handler)
	}

	private saveAndClose() {
		this.close()
		this.onSubmit(this.result)
	}

}
