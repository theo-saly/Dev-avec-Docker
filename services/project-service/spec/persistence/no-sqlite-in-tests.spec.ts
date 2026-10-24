import * as fs from 'fs';
import * as path from 'path';

function getTestFiles(dir: string, skipDirs: string[] = []): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            if (skipDirs.includes(entry.name)) continue;
            results.push(...getTestFiles(path.join(dir, entry.name), skipDirs));
        } else if (
            entry.name.endsWith('.spec.ts') ||
            entry.name.endsWith('.test.ts')
        ) {
            results.push(path.join(dir, entry.name));
        }
    }
    return results;
}

describe('Architecture: isolation de la persistence (project-service)', () => {
    const specDir = path.resolve(__dirname, '..');

    test('aucun test de controller ne doit importer sqlite3 directement', () => {
        const testFiles = getTestFiles(specDir, [
            'node_modules',
            'persistence',
        ]);
        expect(testFiles.length).toBeGreaterThan(0);
        for (const file of testFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            expect(content).not.toMatch(/require\(\s*['"]sqlite3['"]\s*\)/);
            expect(content).not.toMatch(/from\s+['"]sqlite3['"]/);
        }
    });

    test('les tests de controllers doivent mocker la couche persistence', () => {
        const testFiles = getTestFiles(specDir, ['node_modules']).filter((f) =>
            f.includes('controllers'),
        );
        expect(testFiles.length).toBeGreaterThan(0);
        for (const file of testFiles) {
            const content = fs.readFileSync(file, 'utf-8');
            expect(content).toMatch(/jest\.mock\(.+persistence/);
        }
    });
});
