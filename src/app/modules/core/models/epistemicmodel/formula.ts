export interface Formula {
    readonly type: string;

    isBoolean(): boolean;

    prettyPrint(): string;

    renameAtoms(f: (s: string) => string): Formula;
}
