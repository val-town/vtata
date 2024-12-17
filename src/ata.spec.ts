import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import { getReferencesForModule } from "./index";

describe("getReferencesForModule", () => {
	it("extracts imports", () => {
		const code = "import 'abc'";
		expect(getReferencesForModule(ts, code).map((m) => m.module)).toEqual([
			"abc",
		]);
	});

	it("extracts from imports", () => {
		const code = "import {asda} from '123'";
		expect(getReferencesForModule(ts, code).map((m) => m.module)).toEqual([
			"123",
		]);
	});

	it("extracts a version meta", () => {
		const code = "import {asda} from '123' // types: 1.2.3";
		expect(getReferencesForModule(ts, code)[0]).toEqual({
			module: "123",
			version: "1.2.3",
		});
	});

	it("extracts a version meta", () => {
		const code = "import {asda} from '123";
		expect(getReferencesForModule(ts, code)[0]).toEqual({
			module: "123",
			version: "latest",
		});
	});

	it("npm: specifier", () => {
		const code = "import {asda} from 'npm:lodash'";
		expect(getReferencesForModule(ts, code)[0]).toEqual({
			module: "npm:lodash",
			version: "latest",
		});
	});

	it("dynamic imports", () => {
		const code = "const {asda} = import('npm:simple-statistics')";
		expect(getReferencesForModule(ts, code)[0]).toEqual({
			module: "npm:simple-statistics",
			version: "latest",
		});
	});
});

describe("ignores lib references", () => {
	it("extracts imports", () => {
		const code = "import 'dom'";
		expect(getReferencesForModule(ts, code).map((m) => m.module)).toEqual([]);
	});
});
