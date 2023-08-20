import {Post} from "./PostsRepository";
import {Vault} from "obsidian";

export class FileSystemRepository {

	private vault: Vault


	constructor(vault: Vault) {
		this.vault = vault;
	}

	async savePost(post: Post) {
		if (!this.vault.getAbstractFileByPath("P2")) {
			await this.vault.createFolder("P2")
		}

		if (this.vault.getAbstractFileByPath(`P2/${post.title}.md`)) {
			return Promise.reject("The post already exists!")
		}

		await this.vault.create(
			`P2/${post.title
				.replace("\\", " ")
				.replace("/", " ")
				.replace(":", " ")
			}.md`,
			post.content
		)
	}
}
