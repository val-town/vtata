export enum ModuleType {
	NPM = "NPM",
	JSR = "JSR",
	HTTP = "HTTP",
	NODE = "NODE",
}

const httpRegex = /^https?:/;

export function getModuleType(specifier: string): ModuleType {
	if (httpRegex.test(specifier)) {
		return ModuleType.HTTP;
	}
	if (specifier.startsWith("npm:")) {
		return ModuleType.NPM;
	}
	if (specifier.startsWith("jsr:")) {
		return ModuleType.JSR;
	}
	return ModuleType.NPM;
}
