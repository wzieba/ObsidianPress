import {WpcomApi} from "./networking/WpcomApi";
import {MarkdownPostProcessor, MarkdownPostProcessorContext} from "obsidian";

export class AuthorizedMediaPostProcessor {

	private wpcomApi: WpcomApi

	constructor(wpccomApi: WpcomApi) {
		this.wpcomApi = wpccomApi;
	}

	processor: MarkdownPostProcessor = (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {

		const nodes = AuthorizedMediaPostProcessor.getChildMediaNodes(el);


		nodes.forEach((child: ChildNode) => {

			if (child.nodeName.toLowerCase() == 'img') {
				const image = child as HTMLImageElement

				this.wpcomApi.get(image.src).then(response => {
					const arrayBuffer = response.arrayBuffer;
					const bytes = new Uint8Array(arrayBuffer);
					const blob = new Blob([bytes.buffer]);

					const reader = new FileReader();
					reader.onload = function (event) {
						image.src = event.target.result
					};
					reader.readAsDataURL(blob);
				}).catch((error) => {
					console.log(error)
				})
				child.replaceWith(image)
			}
		})
	}

	private static getChildMediaNodes(element: HTMLElement): ChildNode[] {
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, null);
		const textNodes: ChildNode[] = [];
		let node: ChildNode;

		while ((node = walker.nextNode() as ChildNode)) {
			textNodes.push(node);
		}

		return textNodes;
	}
}
