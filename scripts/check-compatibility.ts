import * as fs from 'fs';
import * as path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompatibilityManifest {
    provides: Record<string, string>;
    requires: Record<string, string>;
}

interface ServiceInfo {
    version: string;
    provides: Record<string, string>;
    requires: Record<string, string>;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SERVICES = [
    'auth-service',
    'project-service',
    'task-service',
    'notification-service',
    'api-gateway',
] as const;

const SERVICES_DIR = path.join(__dirname, '..', 'services');

// ─── Utilitaires semver ───────────────────────────────────────────────────────

interface SemVer {
    major: number;
    minor: number;
    patch: number;
}

function parseSemver(version: string): SemVer {
    const parts = version.replace(/^v/, '').split('.').map(Number);
    return { major: parts[0] ?? 0, minor: parts[1] ?? 0, patch: parts[2] ?? 0 };
}

// Retourne < 0 si a < b, 0 si égal, > 0 si a > b
function compareSemver(a: string, b: string): number {
    const pa = parseSemver(a);
    const pb = parseSemver(b);
    if (pa.major !== pb.major) return pa.major - pb.major;
    if (pa.minor !== pb.minor) return pa.minor - pb.minor;
    return pa.patch - pb.patch;
}

// Vérifie qu'une version satisfait une contrainte complète.
// Ex : satisfies("1.3.0", ">=1.0.0 <2.0.0") → true
// Chaque clause est séparée par un espace et toutes doivent être vraies (AND implicite).
function satisfies(version: string, constraint: string): boolean {
    const clauses = constraint.trim().split(/\s+/);

    for (const clause of clauses) {
        const match = clause.match(/^(>=|<=|>|<|=)?(.+)$/);
        if (!match) continue;

        const [, op, req] = match;
        const cmp = compareSemver(version, req);

        if (op === '>=' && cmp < 0) return false;
        if (op === '>' && cmp <= 0) return false;
        if (op === '<=' && cmp > 0) return false;
        if (op === '<' && cmp >= 0) return false;
        if ((!op || op === '=') && cmp !== 0) return false;
    }

    return true;
}

// ─── Chargement des manifestes ────────────────────────────────────────────────

const services: Record<string, ServiceInfo> = {};

for (const service of SERVICES) {
    const serviceDir = path.join(SERVICES_DIR, service);
    const pkgPath = path.join(serviceDir, 'package.json');
    const compatPath = path.join(serviceDir, 'compatibility.json');

    if (!fs.existsSync(pkgPath)) {
        console.warn(
            `[WARN] ${service}: package.json introuvable, service ignoré`,
        );
        continue;
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
        version: string;
    };
    const compat: CompatibilityManifest = fs.existsSync(compatPath)
        ? (JSON.parse(
              fs.readFileSync(compatPath, 'utf8'),
          ) as CompatibilityManifest)
        : { provides: {}, requires: {} };

    services[service] = {
        version: pkg.version,
        provides: compat.provides ?? {},
        requires: compat.requires ?? {},
    };
}

// ─── Validation ───────────────────────────────────────────────────────────────

let allPassed = true;

for (const [service, info] of Object.entries(services)) {
    const reqs = Object.entries(info.requires);
    if (reqs.length === 0) continue;

    for (const [dep, constraint] of reqs) {
        if (!services[dep]) {
            console.error(
                `[ERREUR] ${service} requiert "${dep}" mais ce service n'existe pas`,
            );
            allPassed = false;
            continue;
        }

        const depVersion = services[dep].version;

        if (satisfies(depVersion, constraint)) {
            console.log(
                `[OK]   ${service} requiert ${dep}@${constraint} → v${depVersion}`,
            );
        } else {
            console.error(
                `[FAIL] ${service} requiert ${dep}@${constraint} → v${depVersion} INCOMPATIBLE`,
            );
            allPassed = false;
        }
    }
}

// ─── Résultat ─────────────────────────────────────────────────────────────────

if (!allPassed) {
    console.error(
        '\n✗ Compatibility check ÉCHOUÉ — corrige les versions avant de déployer',
    );
    process.exit(1);
}

console.log('\n✓ Compatibility check OK — tous les services sont compatibles');
