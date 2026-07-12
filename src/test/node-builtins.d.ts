declare module 'node:fs' {
  export function existsSync(path: string): boolean
}

declare module 'node:path' {
  export function resolve(...paths: string[]): string
}
