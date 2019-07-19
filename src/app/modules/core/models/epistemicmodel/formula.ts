export interface Formula {
    readonly type: string;
    prettyPrint(): string;
    renameAtoms(f: (s: string) => string): Formula;
}