import * as Fs from "node:fs";
import {
	createSystem,
	createVirtualTypeScriptEnvironment,
} from "@typescript/vfs";
import * as ts from "typescript";

const fsMap = new Map<string, string>(
	JSON.parse(Fs.readFileSync("./tests/cdn.json", "utf8")),
);

const system = createSystem(fsMap);

export function getEnv() {
	return createVirtualTypeScriptEnvironment(system, [], ts, {
		lib: ["es2022"],
	});
}
