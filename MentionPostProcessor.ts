import {MarkdownPostProcessor} from "obsidian";

export class MentionPostProcessor {
	static regExp = new RegExp('@[\\w-]+', 'g');

	static mentionsProcessor: MarkdownPostProcessor = (el: HTMLElement, ctx) => {
		const nodes = this.getChildTextNodes(el);

		nodes.forEach((child: ChildNode) => {
			this.mentionsProcessor(child as HTMLElement, ctx)

			const text = child.textContent;
			const matches = [...child.textContent.matchAll(this.regExp)];
			const parts: (string | Node)[] = [];

			if (matches.length == 0) return

			const preMentionText = text?.substring(0, matches[0].index);
			if (preMentionText != undefined) {
				parts.push(preMentionText)
			}
			matches.forEach((currentMatch, i) => {
				const anchorNode = this.surroundWithAnchorTag(currentMatch[0]);
				parts.push(anchorNode);

				const endIndexOfPostMentionText = matches[i + 1] ? matches[i + 1].index : text.length;
				const startIndexOfPostMentionText = currentMatch.index + currentMatch[0].length;
				const postMentionText = text.substring(startIndexOfPostMentionText, endIndexOfPostMentionText);

				parts.push(postMentionText);
			});

			child.replaceWith(...parts)
		})
	}

	private static getChildTextNodes(element: HTMLElement): ChildNode[] {
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
		const textNodes: ChildNode[] = [];
		let node: ChildNode;

		while ((node = walker.nextNode() as ChildNode)) {
			textNodes.push(node);
		}

		return textNodes;
	}

	private static surroundWithAnchorTag(text: string): HTMLAnchorElement {
		const anchor = document.createElement('a');

		anchor.addClass('cm-url');
		anchor.textContent = text;

		return anchor;
	}
}
