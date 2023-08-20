import {RangeSetBuilder} from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView,
	PluginSpec,
	PluginValue,
	ViewPlugin,
	ViewUpdate,
} from "@codemirror/view";

class MentionsPlugin implements PluginValue {
	decorations: DecorationSet;

	constructor(view: EditorView) {
		this.decorations = this.buildDecorations(view);
	}

	update(update: ViewUpdate) {
		if (update.docChanged || update.viewportChanged) {
			this.decorations = this.buildDecorations(update.view);
		}
	}

	destroy() {
	}

	buildDecorations(view: EditorView): DecorationSet {
		const builder = new RangeSetBuilder<Decoration>();

		for (const {from, to} of view.visibleRanges) {

			const range = view.state.sliceDoc(from, to);
			const mentions = [...range.matchAll(new RegExp('@\\w+(-\\w+)*', 'g'))];

			mentions.forEach((m) => {
				builder.add(
					from + m.index,
					from + m.index + m[0].length,
					Decoration.mark({
						class: "cm-url",
						tagName: "a",
					})
				);
			});
		}

		return builder.finish();
	}
}

const pluginSpec: PluginSpec<MentionsPlugin> = {
	decorations: (value: MentionsPlugin) => value.decorations,
};

export const mentionsViewPlugin = ViewPlugin.fromClass(
	MentionsPlugin,
	pluginSpec
);
