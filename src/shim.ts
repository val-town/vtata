export function makeShim(fromModule: string, toModule: string) {
	return `
declare module '${fromModule}' {
  export * from '${toModule}'
}
`;
}
