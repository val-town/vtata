import { describe, expect, it } from "vitest";
import * as ts from "typescript";
import { getEnv } from "../tests/env";
import { setupTypeAcquisition } from ".";
import * as Fs from "node:fs/promises";

async function reader(path: string) {
	const recordings: Promise<{ url: string; text: string }>[] = [];
	const m = new Map<string, string>(
		JSON.parse(await Fs.readFile(path, "utf8")),
	);
	return {
		fetch: (...args: any[]) => {
			return Promise.resolve(new Response(new Blob([m.get(args[0])!])));
		},
		async saveAs(_path: string) {},
	};
}

function recorder() {
	const recordings: Promise<[string, string]>[] = [];
	return {
		fetch: (...args: any[]) => {
			console.log("fetching with args", args);
			const url = args[0];
			return fetch(...args).then((r) => {
				recordings.push(
					r
						.clone()
						.text()
						.then((text) => {
							return [url, text];
						}),
				);
				return r;
			});
		},
		recordings,
		async saveAs(path: string) {
			await Fs.writeFile(path, JSON.stringify(await Promise.all(recordings)));
		},
	};
}

describe("ata", () => {
	it("base", async () => {
		const env = getEnv();

		let finish: (value?: unknown) => unknown;
		const finishedPromise = new Promise((resolve) => {
			finish = resolve;
		});

		const rec = await reader("./tests/fixtures/lodash.json"); // recorder();

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
		await rec.saveAs("./tests/fixtures/lodash.json");
	});
});
