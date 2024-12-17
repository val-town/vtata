import { describe, expect, it } from "vitest";
import * as ts from "typescript";
import { getEnv } from "../tests/env";
import { setupTypeAcquisition } from ".";
import { fixture } from "../tests/fixture";

describe("ata", () => {
	it("non-prefixed lodash acquisition", async () => {
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

		const code = 'import { dropWhile } from "lodash"';
		const path = "index.ts";
		env.createFile(path, code);
		ata(code);

		await expect(finishedPromise).resolves.toBeFalsy();
		await rec.save();

		const sourcePos = code.indexOf("dropWhile") + 3;

		expect(
			env.languageService.getQuickInfoAtPosition(path, sourcePos),
		).toMatchSnapshot();

		expect(
			env.languageService.getTypeDefinitionAtPosition(path, sourcePos),
		).toMatchSnapshot();
	});

	it.only("npm prefix", async () => {
		const env = getEnv();

		let finish: (value?: unknown) => unknown;
		const finishedPromise = new Promise((resolve) => {
			finish = resolve;
		});

		const rec = await fixture("./tests/fixtures/prefix-lodash.json", "read");

		const receivedFiles = new Map();

		const ata = setupTypeAcquisition({
			projectName: "My ATA Project",
			typescript: ts,
			logger: console,
			fetcher: rec.fetch,
			delegate: {
				receivedFile: (code: string, path: string) => {
					receivedFiles.set(path, code);
					env.createFile(path, code);
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

		const code = 'import { dropWhile } from "npm:lodash"';
		const path = "index.ts";
		env.createFile(path, code);
		ata(code);

		await expect(finishedPromise).resolves.toBeFalsy();
		await rec.save();

		const sourcePos = code.indexOf("dropWhile") + 3;

		const info = env.languageService.getQuickInfoAtPosition(path, sourcePos);
		expect(info).toBeTruthy();
		expect(info).toMatchSnapshot();

		const def = env.languageService.getTypeDefinitionAtPosition(
			path,
			sourcePos,
		);
		expect(def).toBeTruthy();
		expect(def).toMatchSnapshot();

		console.log([...receivedFiles.keys()]);
	});
});
