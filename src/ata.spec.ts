import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import { getReferencesForModule } from "./index";
import { ModuleType } from "./moduleTypes";

describe("getReferencesForModule", () => {
	it("extracts imports", () => {
		const code = "import 'abc'";
		expect(
			getReferencesForModule(ts, code).map((m) => m.originalModuleName),
		).toEqual(["abc"]);
	});

	it("extracts from imports", () => {
		const code = "import {asda} from '123'";
		expect(
			getReferencesForModule(ts, code).map((m) => m.originalModuleName),
		).toEqual(["123"]);
	});

	it("extracts a version meta", () => {
		const code = "import {asda} from '123' // types: 1.2.3";
		expect(getReferencesForModule(ts, code)[0]).toEqual({
			originalModuleName: "123",
			type: ModuleType.NPM,
			version: "1.2.3",
		});
	});

	it("extracts a version meta", () => {
		const code = "import {asda} from '123";
		expect(getReferencesForModule(ts, code)[0]).toEqual({
			originalModuleName: "123",
			type: ModuleType.NPM,
			version: "latest",
		});
	});

	it("npm: specifier", () => {
		const code = "import {asda} from 'npm:lodash'";
		expect(getReferencesForModule(ts, code)[0]).toEqual({
			originalModuleName: "npm:lodash",
			type: ModuleType.NPM,
			version: "latest",
		});
	});

	it("https", () => {
		const code = "import {asda} from 'https://esm.sh/mod'";
		expect(getReferencesForModule(ts, code)[0]).toEqual({
			originalModuleName: "https://esm.sh/mod",
			type: ModuleType.HTTP,
			version: "latest",
		});
	});

	it("jsr: specifier", () => {
		const code = "import {asda} from 'jsr:lodash'";
		expect(getReferencesForModule(ts, code)[0]).toEqual({
			originalModuleName: "jsr:lodash",
			type: ModuleType.JSR,
			version: "latest",
		});
	});

	it("dynamic imports", () => {
		const code = "const {asda} = import('npm:simple-statistics')";
		expect(getReferencesForModule(ts, code)[0]).toEqual({
			originalModuleName: "npm:simple-statistics",
			type: ModuleType.NPM,
			version: "latest",
		});
	});
});

describe("ignores lib references", () => {
	it("extracts imports", () => {
		const code = "import 'dom'";
		expect(
			getReferencesForModule(ts, code).map((m) => m.originalModuleName),
		).toEqual([]);
	});
});
