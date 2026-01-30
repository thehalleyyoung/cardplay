/**
 * Sample Pack Registry Implementation
 */

import type { 
  SamplePack, 
  SamplePackInstallation,
  SamplePackRegistry,
  SampleCategory,
  SamplePackDifficulty
} from './types';

class SamplePackRegistryImpl implements SamplePackRegistry {
  private packs = new Map<string, SamplePack>();
  private installations: SamplePackInstallation[] = [];

  getAllPacks(): SamplePack[] {
    return Array.from(this.packs.values());
  }

  getPack(id: string): SamplePack | undefined {
    return this.packs.get(id);
  }

  search(query: string): SamplePack[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllPacks().filter(pack => {
      return (
        pack.name.toLowerCase().includes(lowerQuery) ||
        pack.description.toLowerCase().includes(lowerQuery) ||
        pack.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        pack.author?.toLowerCase().includes(lowerQuery)
      );
    });
  }

  filterByCategory(category: SampleCategory): SamplePack[] {
    return this.getAllPacks().filter(pack => pack.category === category);
  }

  filterByDifficulty(difficulty: SamplePackDifficulty): SamplePack[] {
    return this.getAllPacks().filter(pack => pack.difficulty === difficulty);
  }

  filterByTags(tags: string[]): SamplePack[] {
    const lowerTags = tags.map(t => t.toLowerCase());
    return this.getAllPacks().filter(pack => {
      return pack.tags.some(tag => 
        lowerTags.includes(tag.toLowerCase())
      );
    });
  }

  register(pack: SamplePack): void {
    if (this.packs.has(pack.id)) {
      throw new Error(`Sample pack "${pack.id}" is already registered`);
    }
    this.packs.set(pack.id, pack);
  }

  getInstallations(): SamplePackInstallation[] {
    return [...this.installations];
  }

  isInstalled(packId: string): boolean {
    return this.installations.some(inst => inst.packId === packId);
  }

  recordInstallation(installation: SamplePackInstallation): void {
    this.installations.push(installation);
  }

  /** Clear all packs (for testing) */
  clear(): void {
    this.packs.clear();
    this.installations = [];
  }
}

let registryInstance: SamplePackRegistry | null = null;

export function getSamplePackRegistry(): SamplePackRegistry {
  if (!registryInstance) {
    registryInstance = new SamplePackRegistryImpl();
  }
  return registryInstance;
}

export function resetSamplePackRegistry(): void {
  registryInstance = null;
}
