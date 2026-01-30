/**
 * @fileoverview Ontology Pack Registry Snapshot Tests
 * 
 * Change 497: Snapshot test for ontology pack registry output.
 * Ensures ontology IDs/bridges stay stable.
 * 
 * @module @cardplay/src/tests/snapshots/ontology-pack-registry.snapshot.test
 */

import { describe, it, expect } from 'vitest';
import { 
  getOntologyRegistry,
  BUILTIN_ONTOLOGIES,
} from '../../ai/theory/ontologies';

describe('Ontology Pack Registry Snapshots', () => {
  it('should match registered ontology IDs snapshot', () => {
    const ontologies = getOntologyRegistry();
    const ontologyIds = ontologies.map(o => o.pack.id).sort();

    expect(ontologyIds).toMatchSnapshot();
  });

  it('should match builtin ontology IDs snapshot', () => {
    const builtinIds = Array.from(BUILTIN_ONTOLOGIES).sort();

    expect(builtinIds).toMatchSnapshot();
  });

  it('should match ontology pack metadata snapshot', () => {
    const ontologies = getOntologyRegistry();

    const metadata = ontologies.map(({ pack }) => {
      const id = pack.id;
      
      return {
        id,
        hasNamespace: id.includes(':'),
        namespace: id.includes(':') ? id.split(':')[0] : null,
        hasPack: !!pack,
        hasName: !!pack?.name,
        hasDescription: !!pack?.description,
        hasCustomConstraints: pack && 'customConstraints' in pack && Array.isArray((pack as any).customConstraints),
        customConstraintsCount: pack && 'customConstraints' in pack ? ((pack as any).customConstraints?.length ?? 0) : 0,
        hasBridgeRules: pack && 'bridgeRules' in pack && Array.isArray((pack as any).bridgeRules),
        bridgeRulesCount: pack && 'bridgeRules' in pack ? ((pack as any).bridgeRules?.length ?? 0) : 0,
        hasCulture: pack && 'culture' in pack,
        hasScaleSystems: pack && 'scaleSystems' in pack,
        hasRhythmSystems: pack && 'rhythmSystems' in pack,
      };
    }).sort((a, b) => a.id.localeCompare(b.id));

    expect(metadata).toMatchSnapshot();
  });

  it('should validate all ontology IDs are properly formatted', () => {
    const ontologies = getOntologyRegistry();
    const ontologyIds = ontologies.map(o => o.pack.id);

    const invalidIds = ontologyIds.filter(id => {
      // Builtin ontologies can be un-namespaced
      if (BUILTIN_ONTOLOGIES.has(id)) {
        return !/^[a-z0-9-_]+$/.test(id);
      }
      
      // Extension ontologies must be namespaced
      if (!id.includes(':')) return true;
      
      const [namespace, name] = id.split(':');
      const validNamespace = /^[a-z0-9-_]+$/.test(namespace);
      const validName = /^[a-z0-9-_]+$/.test(name);
      
      return !validNamespace || !validName;
    });

    expect(invalidIds).toEqual([]);
  });

  it('should validate ontology IDs are unique', () => {
    const ontologies = getOntologyRegistry();
    const ontologyIds = ontologies.map(o => o.pack.id);
    const uniqueIds = [...new Set(ontologyIds)];

    expect(ontologyIds.length).toBe(uniqueIds.length);
  });

  it('should match ontology custom constraint types snapshot', () => {
    const ontologies = getOntologyRegistry();

    const constraintsByOntology = ontologies.map(({ pack }) => {
      const id = pack.id;
      
      const constraints = pack && 'customConstraints' in pack
        ? ((pack as any).customConstraints as string[] | undefined) ?? []
        : [];
      
      return {
        ontologyId: id,
        customConstraints: constraints.sort(),
      };
    }).sort((a, b) => a.ontologyId.localeCompare(b.ontologyId));

    expect(constraintsByOntology).toMatchSnapshot();
  });

  it('should validate custom constraint naming', () => {
    const ontologies = getOntologyRegistry();

    const invalidConstraints: string[] = [];
    
    for (const { pack } of ontologies) {
      const id = pack.id;
      
      if (pack && 'customConstraints' in pack) {
        const constraints = (pack as any).customConstraints as string[] | undefined;
        
        if (Array.isArray(constraints)) {
          for (const constraint of constraints) {
            // Custom constraints should be namespaced (ontologyId:constraintName)
            if (!constraint.includes(':')) {
              invalidConstraints.push(`${id} -> ${constraint} (missing namespace)`);
            } else {
              const [namespace, name] = constraint.split(':');
              
              // Namespace should match ontology ID (or be the ontology's primary namespace)
              if (!id.includes(':') && namespace !== id) {
                // For builtin ontologies, namespace should match ID
                invalidConstraints.push(`${id} -> ${constraint} (namespace mismatch)`);
              }
              
              // Name should be lowercase with underscores/hyphens
              if (!/^[a-z0-9-_]+$/.test(name)) {
                invalidConstraints.push(`${id} -> ${constraint} (invalid name format)`);
              }
            }
          }
        }
      }
    }

    expect(invalidConstraints).toEqual([]);
  });

  it('should match ontology bridge rules snapshot', () => {
    const ontologies = getOntologyRegistry();

    const bridgesByOntology = ontologies.map(({ pack }) => {
      const id = pack.id;
      
      const bridges = pack && 'bridgeRules' in pack
        ? ((pack as any).bridgeRules as any[] | undefined) ?? []
        : [];
      
      return {
        ontologyId: id,
        bridgeRulesCount: bridges.length,
        // Don't snapshot full bridge rules (too verbose), just count
      };
    }).sort((a, b) => a.ontologyId.localeCompare(b.ontologyId));

    expect(bridgesByOntology).toMatchSnapshot();
  });

  it('should validate builtin ontologies are registered', () => {
    const ontologies = getOntologyRegistry();
    const registeredIds = new Set(ontologies.map(o => o.pack.id));
    
    const missingBuiltins = Array.from(BUILTIN_ONTOLOGIES).filter(
      id => !registeredIds.has(id)
    );

    // All builtin ontologies should be registered
    expect(missingBuiltins).toEqual([]);
  });

  it('should match ontology culture tags snapshot', () => {
    const ontologies = getOntologyRegistry();

    const cultures = ontologies.map(({ pack }) => {
      const id = pack.id;
      
      const culture = pack && 'culture' in pack
        ? (pack as any).culture
        : null;
      
      return {
        ontologyId: id,
        culture,
      };
    }).filter(item => item.culture !== null)
      .sort((a, b) => a.ontologyId.localeCompare(b.ontologyId));

    expect(cultures).toMatchSnapshot();
  });

  it('should match ontology compatibility matrix snapshot', () => {
    const ontologies = getOntologyRegistry();

    // Build a simple compatibility matrix (which ontologies can coexist)
    const compatibilityMatrix = ontologies.map(({ pack }) => {
      const id = pack.id;
      
      // Check if pack has explicit compatibility info
      const compatibleWith = pack && 'compatibleWith' in pack
        ? ((pack as any).compatibleWith as string[] | undefined) ?? []
        : [];
      
      const incompatibleWith = pack && 'incompatibleWith' in pack
        ? ((pack as any).incompatibleWith as string[] | undefined) ?? []
        : [];
      
      return {
        ontologyId: id,
        compatibleWith: compatibleWith.sort(),
        incompatibleWith: incompatibleWith.sort(),
      };
    }).sort((a, b) => a.ontologyId.localeCompare(b.ontologyId));

    expect(compatibilityMatrix).toMatchSnapshot();
  });
});
