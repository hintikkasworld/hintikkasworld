export interface Formula {
    prettyPrint(): string;
    renameAtoms(f: (s:string) => string):Formula;
}