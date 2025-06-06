import { autocompletion } from "@codemirror/autocomplete";
import { javascript } from "@codemirror/lang-javascript";
import {
	tsAutocompleteWorker,
	tsFacetWorker,
	tsGotoWorker,
	tsHoverWorker,
	tsLinterWorker,
	tsSyncWorker,
} from "@valtown/codemirror-ts";
import { EditorView, basicSetup } from "codemirror";
import * as Comlink from "comlink";
import type * as ts from "typescript";

function renderDisplayParts(dp: ts.SymbolDisplayPart[]) {
	const div = document.createElement("div");
	for (const part of dp) {
		const span = div.appendChild(document.createElement("span"));
		span.className = `quick-info-${part.kind}`;
		span.innerText = part.text;
	}
	return div;
}

(async () => {
	const path = "index.ts";

	// TODO: this is the one place where we can't use .js urls
	const innerWorker = new Worker(new URL("./worker.ts", import.meta.url), {
		type: "module",
	});
	const worker = Comlink.wrap(innerWorker) as any;
	await worker.initialize();

	const editor = new EditorView({
		doc: `import { min } from "lodash";

const x = min([1, 2, 3])`,
		extensions: [
			basicSetup,
			javascript({
				typescript: true,
				jsx: true,
			}),
			tsFacetWorker.of({ worker, path }),
			tsSyncWorker(),
			tsLinterWorker(),
			autocompletion({
				override: [
					tsAutocompleteWorker({
						renderAutocomplete(raw) {
							return () => {
								const div = document.createElement("div");
								if (raw.documentation) {
									const description = div.appendChild(
										document.createElement("div"),
									);
									description.appendChild(
										renderDisplayParts(raw.documentation),
									);
								}
								if (raw?.displayParts) {
									const dp = div.appendChild(document.createElement("div"));
									dp.appendChild(renderDisplayParts(raw.displayParts));
								}
								return { dom: div };
							};
						},
					}),
				],
			}),
			tsHoverWorker(),
			tsGotoWorker(),
		],
		parent: document.querySelector("#editor-worker")!,
	});
})().catch((e) => console.error(e));
