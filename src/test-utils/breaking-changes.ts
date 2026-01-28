/**
 * Breaking Change Detection for Cardplay
 * 
 * Detects breaking changes between versions by comparing API surfaces.
 */

export type APISignature = {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'constant';
  params?: string[];
  returnType?: string;
  properties?: Record<string, string>;
  methods?: Record<string, string>;
};

export type APISnapshot = {
  version: string;
  timestamp: string;
  signatures: APISignature[];
};

export type BreakingChange = {
  type: 'removed' | 'modified' | 'incompatible';
  api: string;
  oldSignature?: string;
  newSignature?: string;
  severity: 'major' | 'minor';
  description: string;
};

export type CompatibilityReport = {
  compatible: boolean;
  breakingChanges: BreakingChange[];
  addedAPIs: string[];
  deprecatedAPIs: string[];
};

/**
 * Compares two API snapshots and detects breaking changes.
 */
export function detectBreakingChanges(
  oldSnapshot: APISnapshot,
  newSnapshot: APISnapshot
): CompatibilityReport {
  const breakingChanges: BreakingChange[] = [];
  const addedAPIs: string[] = [];
  const deprecatedAPIs: string[] = [];
  
  const oldMap = new Map(oldSnapshot.signatures.map(s => [s.name, s]));
  const newMap = new Map(newSnapshot.signatures.map(s => [s.name, s]));
  
  for (const [name, oldSig] of oldMap) {
    const newSig = newMap.get(name);
    
    if (!newSig) {
      breakingChanges.push({
        type: 'removed',
        api: name,
        oldSignature: serializeSignature(oldSig),
        severity: 'major',
        description: `API "${name}" was removed`
      });
    } else {
      const changes = compareSignatures(oldSig, newSig);
      if (changes.length > 0) {
        breakingChanges.push({
          type: 'modified',
          api: name,
          oldSignature: serializeSignature(oldSig),
          newSignature: serializeSignature(newSig),
          severity: 'major',
          description: `API "${name}" signature changed: ${changes.join(', ')}`
        });
      }
    }
  }
  
  for (const [name] of newMap) {
    if (!oldMap.has(name)) {
      addedAPIs.push(name);
    }
  }
  
  return {
    compatible: breakingChanges.length === 0,
    breakingChanges,
    addedAPIs,
    deprecatedAPIs
  };
}

function compareSignatures(oldSig: APISignature, newSig: APISignature): string[] {
  const changes: string[] = [];
  
  if (oldSig.type !== newSig.type) {
    changes.push(`type changed from ${oldSig.type} to ${newSig.type}`);
  }
  
  if (oldSig.params && newSig.params) {
    if (oldSig.params.length > newSig.params.length) {
      changes.push('parameters removed');
    } else if (oldSig.params.length < newSig.params.length) {
      changes.push('parameters added');
    } else {
      for (let i = 0; i < oldSig.params.length; i++) {
        if (oldSig.params[i] !== newSig.params[i]) {
          changes.push(`parameter ${i} type changed`);
        }
      }
    }
  }
  
  if (oldSig.returnType !== newSig.returnType) {
    changes.push('return type changed');
  }
  
  if (oldSig.properties && newSig.properties) {
    for (const [prop, type] of Object.entries(oldSig.properties)) {
      if (!(prop in newSig.properties)) {
        changes.push(`property "${prop}" removed`);
      } else if (newSig.properties[prop] !== type) {
        changes.push(`property "${prop}" type changed`);
      }
    }
  }
  
  if (oldSig.methods && newSig.methods) {
    for (const [method, sig] of Object.entries(oldSig.methods)) {
      if (!(method in newSig.methods)) {
        changes.push(`method "${method}" removed`);
      } else if (newSig.methods[method] !== sig) {
        changes.push(`method "${method}" signature changed`);
      }
    }
  }
  
  return changes;
}

function serializeSignature(sig: APISignature): string {
  if (sig.type === 'function') {
    const params = sig.params?.join(', ') || '';
    const ret = sig.returnType || 'void';
    return `${sig.name}(${params}): ${ret}`;
  }
  
  if (sig.type === 'interface' || sig.type === 'type') {
    const props = sig.properties
      ? Object.entries(sig.properties).map(([k, v]) => `${k}: ${v}`).join('; ')
      : '';
    return `${sig.name} { ${props} }`;
  }
  
  return sig.name;
}

/**
 * Generates a compatibility report.
 */
export function generateCompatibilityReport(report: CompatibilityReport): string {
  const lines: string[] = [];
  
  lines.push('==========================================');
  lines.push('  API Compatibility Report');
  lines.push('==========================================');
  lines.push('');
  
  if (report.compatible) {
    lines.push('✓ No breaking changes detected');
  } else {
    lines.push(`❌ ${report.breakingChanges.length} breaking change(s) detected`);
    lines.push('');
    lines.push('Breaking Changes:');
    report.breakingChanges.forEach((change, i) => {
      lines.push(`  ${i + 1}. [${change.severity.toUpperCase()}] ${change.description}`);
      if (change.oldSignature) {
        lines.push(`     Old: ${change.oldSignature}`);
      }
      if (change.newSignature) {
        lines.push(`     New: ${change.newSignature}`);
      }
    });
  }
  
  if (report.addedAPIs.length > 0) {
    lines.push('');
    lines.push('New APIs:');
    report.addedAPIs.forEach((api, i) => {
      lines.push(`  ${i + 1}. ${api}`);
    });
  }
  
  if (report.deprecatedAPIs.length > 0) {
    lines.push('');
    lines.push('Deprecated APIs:');
    report.deprecatedAPIs.forEach((api, i) => {
      lines.push(`  ${i + 1}. ${api}`);
    });
  }
  
  lines.push('');
  lines.push('==========================================');
  
  return lines.join('\n');
}

/**
 * Creates a compatibility matrix for multiple versions.
 */
export function createCompatibilityMatrix(snapshots: APISnapshot[]): string[][] {
  const matrix: string[][] = [];
  const header = ['Version', ...snapshots.map(s => s.version)];
  matrix.push(header);
  
  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i];
    if (!snapshot) continue;
    const row: string[] = [snapshot.version];
    
    for (let j = 0; j < snapshots.length; j++) {
      if (i === j) {
        row.push('✓');
      } else if (i < j) {
        const targetSnapshot = snapshots[j];
        if (!targetSnapshot) continue;
        const report = detectBreakingChanges(snapshot, targetSnapshot);
        row.push(report.compatible ? '✓' : '✗');
      } else {
        row.push('-');
      }
    }
    
    matrix.push(row);
  }
  
  return matrix;
}

/**
 * Formats compatibility matrix as a table string.
 */
export function formatCompatibilityMatrix(matrix: string[][]): string {
  const firstRow = matrix[0];
  if (!firstRow) return '';
  
  const colWidths = firstRow.map((_, colIdx) =>
    Math.max(...matrix.map(row => row[colIdx]?.length ?? 0))
  );
  
  const lines: string[] = [];
  
  lines.push('Compatibility Matrix:');
  lines.push('(Rows = base version, Columns = target version)');
  lines.push('');
  
  matrix.forEach((row, rowIdx) => {
    const cells = row.map((cell, colIdx) => {
      const width = colWidths[colIdx];
      return width !== undefined ? cell.padEnd(width) : cell;
    });
    lines.push(cells.join(' | '));
    
    if (rowIdx === 0) {
      lines.push(colWidths.map(w => '-'.repeat(w ?? 0)).join('-+-'));
    }
  });
  
  return lines.join('\n');
}
