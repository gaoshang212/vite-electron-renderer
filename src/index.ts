import * as acorn from 'acorn';
import * as esModuleLexer from 'es-module-lexer';
import type { ImportDefaultSpecifier, ImportNamespaceSpecifier, ImportSpecifier, Program, } from 'estree';
import MagicString from 'magic-string';
import type { PluginOption } from 'vite';
import { builtinModules } from 'module';
import * as path from 'path';

const DEFAULT_EXTS = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'];
const DEFAULT_EXTERNAL = ['electron', ...builtinModules];

export interface ElectronRendererPluginOptions {
    readonly external: ReadonlyArray<string | RegExp>;
    readonly exts?: ReadonlyArray<string>;
    readonly ignoreDependencies?: ReadonlyArray<string | RegExp>;
}

function createExternal(ignore?: ReadonlyArray<string | RegExp>) {
    const dependencies = createDependencies();
    let external2 = [...DEFAULT_EXTERNAL, ...dependencies];
    if (ignore && ignore.length > 0) {
        external2 = external2.filter(x => !ignore?.some(y => y instanceof RegExp ? y.test(x) : y === x));
    }
    return external2;
}

function createDependencies() {
    const packageDir = process.cwd();
    const pckageJson = require(path.join(packageDir, 'package.json'));
    return [...Object.keys(pckageJson.dependencies || {})];
}

async function import2require(code: string, options?: ElectronRendererPluginOptions) {
    await esModuleLexer.init;
    const [imports] = esModuleLexer.parse(code);

    const externals = Array.from(new Set([...createExternal(options?.ignoreDependencies), ...options?.external || []]).values());

    let magicString: MagicString | null = null;

    for (const item of imports) {
        const importStatement = code.substring(item.ss, item.se);

        const { d, n, ss, se } = item;

        if (d !== -1 || n == undefined) {
            continue;
        }

        const hasInclude = externals.some(external => typeof external === 'string'
            ? external === n
            : external instanceof RegExp
                ? external.test(n)
                : false
        );

        if (!hasInclude) {
            continue;
        }

        if (!magicString) {
            magicString = new MagicString(code);
        }

        const program: Program = acorn.parse(importStatement, {
            ecmaVersion: 'latest',
            sourceType: 'module',
        }) as any;

        const node = program.body[0];

        if (node?.type !== 'ImportDeclaration') {
            continue;
        }

        if (typeof node.source.value !== 'string') {
            continue;
        }

        if (node.specifiers.length === 0) {
            magicString.overwrite(ss, se, `require('${node.source.value}')`);
            continue;
        }

        const importNamespaceSpecifierList = node.specifiers.filter(
            x => x.type === 'ImportNamespaceSpecifier'
        ) as ReadonlyArray<ImportNamespaceSpecifier>;

        const importDefaultSpecifierList = node.specifiers.filter(
            x => x.type === 'ImportDefaultSpecifier'
        ) as ReadonlyArray<ImportDefaultSpecifier>;
        const importSpecifierList = node.specifiers.filter(
            x => x.type === 'ImportSpecifier'
        ) as ReadonlyArray<ImportSpecifier>;

        if (importNamespaceSpecifierList.length > 1) {
            throw new Error(
                `Illegal state of importNamespaceSpecifierList: it can only have zero or one namespace import. \`${importStatement}\``
            );
        }

        if (importDefaultSpecifierList.length > 1) {
            throw new Error(
                `Illegal state of importDefaultSpecifierList: it can only have zero or one default import. \`${importStatement}\``
            );
        }

        const requireStatement = (identifiers: string) =>
            `const ${identifiers}=(()=>{const mod = require("${node.source.value}");return mod && mod.__esModule ? mod : Object.assign(Object.create(null),mod,{default:mod,[Symbol.toStringTag]:"Module"})})();`;
        const localNamesIdentifiers = [
            ...importSpecifierList.map(
                spec => `${spec.imported.name}: ${spec.local.name}`
            ),
            ...importDefaultSpecifierList.map(spec => `default: ${spec.local.name}`),
        ].join(', ');

        if (importNamespaceSpecifierList.length === 0) {
            magicString.overwrite(ss, se, requireStatement(`{${localNamesIdentifiers}}`));
            continue;
        }

        const namespaceIdentifier = importNamespaceSpecifierList[0]!.local.name;
        const namespaceRequireStatement = requireStatement(namespaceIdentifier);

        if (localNamesIdentifiers === '') {
            magicString.overwrite(ss, se, namespaceRequireStatement);
            continue;
        }

        magicString.overwrite(ss, se, namespaceRequireStatement + `const {${localNamesIdentifiers}}=${namespaceIdentifier};`);
    }

    return magicString && { code: magicString.toString(), map: magicString.generateMap() };
}

export default function electronRendererPlugin(options?: ElectronRendererPluginOptions): PluginOption[] {
    return [
        {
            name: 'electron-renderer',
            async transform(code, id) {
                const exts = options?.exts ?? DEFAULT_EXTS;
                if (!exts?.some(ext => id.endsWith('.' + ext))) {
                    return;
                }

                return import2require(code, options);
            },
        }
    ];
}
