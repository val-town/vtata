import * as Fs from "node:fs/promises";

async function reader(path: string) {
	const m = new Map<string, string>(
		JSON.parse(await Fs.readFile(path, "utf8")),
	);
	return {
		fetch: (...args: any[]) => {
			return Promise.resolve(new Response(new Blob([m.get(args[0])!])));
		},
		async save() {},
	};
}

function recorder(path: string) {
	const recordings: Promise<[string, string]>[] = [];
	return {
		fetch: (...args: Parameters<typeof fetch>) => {
			const url = args[0];
			return fetch(...args).then((r) => {
				if (typeof url === "string") {
					recordings.push(
						r
							.clone()
							.text()
							.then((text) => {
								return [url, text];
							}),
					);
				} else {
					console.error("Non-string URL provided unexpectedly");
				}
				return r;
			});
		},
		recordings,
		async save() {
			await Fs.writeFile(path, JSON.stringify(await Promise.all(recordings)));
		},
	};
}

/**
 * Using msw is probably the right thing to do, but there isn't an easy
 * mode for recording & replaying Node-native fetch calls. This is that.
 * It will probably need to be extended with the ability to communicate
 * headers and such in the future.
 */
export async function fixture(path: string, mode: "read" | "write") {
	return await (mode === "read" ? reader(path) : recorder(path));
}
