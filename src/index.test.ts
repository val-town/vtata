import { describe, expect, it } from "vitest";
import * as ts from "typescript";
import { getEnv } from "../tests/env";
import { setupTypeAcquisition } from ".";
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
async function fixture(path: string, mode: "read" | "write") {
	return await (mode === "read" ? reader(path) : recorder(path));
}

describe("ata", () => {
	it("base", async () => {
		const env = getEnv();

		let finish: (value?: unknown) => unknown;
		const finishedPromise = new Promise((resolve) => {
			finish = resolve;
		});

		const rec = await fixture("./tests/fixtures/lodash.json", "read");

		const ata = setupTypeAcquisition({
			projectName: "My ATA Project",
			typescript: ts,
			logger: console,
			fetcher: rec.fetch,
			delegate: {
				receivedFile: (code: string, path: string) => {
					env.createFile(path, code);
					// Add code to your runtime at the path...
				},
				started: () => {
					console.log("ATA start");
				},
				progress: (downloaded: number, total: number) => {
					// console.log(`Got ${downloaded} out of ${total}`);
				},
				finished: (vfs) => {
					// console.log("ATA done", vfs);
					finish?.();
				},
			},
		});

		ata('import { x } from "lodash"');

		await expect(finishedPromise).resolves.toBeFalsy();
		await rec.save();
	});
});
