import TurndownService from "turndown";
import * as gfm from "turndown-plugin-gfm";
import {WpcomApi} from "../networking/WpcomApi";

export class Post {
	title: string
	content: string

	constructor(title: string, content: string) {
		this.title = title;
		this.content = content;
	}
}

export class PostsRepository {

	private wpcomApi: WpcomApi
	private turndownService: TurndownService

	constructor(wpComApi: WpcomApi) {
		this.wpcomApi = wpComApi
		this.turndownService = new TurndownService()
		this.turndownService.use(gfm.tables)
		this.turndownService.addRule('strikethrough', {
			filter: function (node, options) {
				return (
					node.getAttribute("class")?.includes('mention')
				)
			},
			replacement: function (content) {
				return content
			}
		})
	}

	async getPost(baseUrl: string) {
		const url = new URL(baseUrl)

		const blog = url.host
		const slug = url.pathname.split('/').filter((segment) => segment).last()
		const rawPost = await this.fetchPost(blog, slug)
		return this.mapHtmlToMarkdown(rawPost)
	}

	private async fetchPost(blog: string, slug: string): Promise<RawPost> {
		const url = `https://public-api.wordpress.com/rest/v1.1/sites/${blog}/posts/slug:${slug}`
		const result = await this.wpcomApi.get(url)

		return {
			title: result.json.title,
			content: result.json.content
		}
	}

	private mapHtmlToMarkdown(rawPost: RawPost): Post {
		return new Post(
			rawPost.title,
			this.turndownService.turndown(rawPost.content)
		)
	}
}

type RawPost = {
	title: string
	content: string
}
