export interface Formula {
    isBoolean(): boolean;
    readonly type: string;
    prettyPrint(): string;
    renameAtoms(f: (s: string) => string): Formula;
}