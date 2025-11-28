const PATTERNS_JSON_URL = '/Patterns.json'

export interface PatternMetadata {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface PatternMetadataStorage {
  patterns: Record<string, PatternMetadata>
  version: string
}

// Load from public/Patterns.json
export async function loadPatternMetadataFromFile(): Promise<PatternMetadataStorage> {
  try {
    // Load directly from file
    const response = await fetch(PATTERNS_JSON_URL)
    if (response.ok) {
      const data = await response.json()
      if (data && typeof data === 'object') {
        return data
      }
    }
  } catch (error) {
    console.error('Error loading pattern metadata from file:', error)
  }
  
  // Return default structure if file doesn't exist or is invalid
  return {
    patterns: {},
    version: '1.0.0'
  }
}

export async function getPatternInfo(patternId: string): Promise<PatternMetadata | undefined> {
  const data = await loadPatternMetadataFromFile()
  return data.patterns[patternId]
}

export async function cleanupEmptyPatterns(activePatternIds: string[]): Promise<void> {
  // In display mode, this is a no-op
  console.log('Cleanup would remove patterns not in:', activePatternIds)
}
