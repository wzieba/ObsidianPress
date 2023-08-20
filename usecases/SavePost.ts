import {FileSystemRepository} from "../repositories/FileSystemRepository";
import {PostsRepository} from "../repositories/PostsRepository";

export class SavePost {

	private fileSystemRepository: FileSystemRepository
	private postsRepository: PostsRepository


	constructor(fileSystemRepository: FileSystemRepository, postsRepository: PostsRepository) {
		this.fileSystemRepository = fileSystemRepository;
		this.postsRepository = postsRepository;
	}

	async run(url: string) {

		const post = await this.postsRepository.getPost(url)

		try {
			await this.fileSystemRepository.savePost(post)
		} catch (error) {
			console.log(error)
		}
	}
}
