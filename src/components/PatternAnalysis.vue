<template>
  <div class="pattern-analysis">
    <!-- Filter Section -->
    <div class="filter-section">
      <div class="filter-group">
        <label for="timing-filter">Interaction Timing:</label>
        <select id="timing-filter" v-model="filterTiming" @change="applyFilters">
          <option value="">All</option>
          <option value="Interaction Before Calling GenAI">Before Calling GenAI</option>
          <option value="Interaction After Calling GenAI">After Calling GenAI</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="resource-filter">Starting Resources:</label>
        <select id="resource-filter" v-model="filterResource" @change="applyFilters">
          <option value="">All</option>
          <option value="Prompt-only">Prompt-only</option>
          <option value="Artifact-grounded">Artifact-grounded</option>
        </select>
      </div>
      <button class="clear-filters" @click="clearFilters">Clear Filters</button>
    </div>

    <div class="patterns-container">
      <div v-if="patterns.length === 0" class="no-patterns">
        <p>No patterns found. Papers with annotations will appear here.</p>
      </div>

      <div v-for="(pattern, index) in patterns" :key="pattern.id" class="pattern-group">
        <div class="pattern-header">
          <div class="pattern-title-section">
            <div>
              <h2>Paradigm {{ getPatternOrder(pattern.id) }}</h2>
              <input 
                v-if="false"
                v-model="patternNames[pattern.id]"
                class="pattern-name-input"
                placeholder="Enter pattern name"
              />
              <span 
                v-else
                class="pattern-name-display"
              >
                {{ patternNames[pattern.id] || 'Unnamed Pattern' }}
              </span>
            </div>
            <div class="pattern-labels">
              <span class="pattern-label timing-label">{{ getPatternTiming(pattern.id) }}</span>
              <span class="pattern-label resource-label">{{ getPatternResource(pattern.id) }}</span>
            </div>
          </div>
          <span class="paper-count">{{ pattern.papers.length }} paper(s)</span>
        </div>

        <div class="pattern-content">
          <!-- Pattern Graph Visualization -->
          <div class="pattern-graph-section">
            <div class="pattern-graph">
              <div class="graph-wrapper">
                <InteractiveGraph 
                  :edges="pattern.edges"
                  :is-read-only="true"
                />
              </div>
            </div>
            
            <!-- Pattern Description -->
            <div class="pattern-description">
              <label class="description-label">Pattern Description:</label>
              <textarea 
                v-if="false"
                v-model="patternDescriptions[pattern.id]"
                class="description-textarea"
                placeholder="Enter pattern description"
                rows="4"
              ></textarea>
              <div 
                v-else
                class="description-display"
              >
                {{ patternDescriptions[pattern.id] || 'No description available' }}
              </div>
            </div>
          </div>

          <!-- Papers using this pattern -->
          <div class="pattern-papers">
            <h3>Papers using this paradigm:</h3>
            <div class="paper-list" :class="{ 'scrollable': pattern.papers.length > 3 }">
              <div 
                v-for="paper in pattern.papers" 
                :key="`${paper.id}-${pattern.id}`"
                class="paper-item"
                @click="$emit('selectPaper', paper)"
              >
                <div class="paper-info">
                  <h4 class="paper-title">{{ paper.title }}</h4>
                  <p class="paper-meta">{{ paper.year }} • {{ paper.author }}</p>
                  <div v-if="paper.templateInfo" class="template-info">
                    {{ paper.templateInfo.name }}
                    <span class="template-icons">
                      <span v-if="paper.annotation?.comments" class="has-comments">💬</span>
                      <span v-if="paper.teaserImage" class="has-teaser">🖼️</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import InteractiveGraph from './InteractiveGraph.vue'
import type { Paper, AnnotationTemplate, GraphEdge } from '../types'
import { 
  loadPatternMetadataFromFile, 
  cleanupEmptyPatterns,
  type PatternMetadata 
} from '../utils/patternStorage'

interface Pattern {
  id: string
  edges: GraphEdge[] // Use GraphEdge directly, includes sequence information
  papers: (Paper & { templateInfo?: AnnotationTemplate })[]
  metadata?: PatternMetadata
}

const props = defineProps<{
  papers: Paper[]
  isReadOnly?: boolean
}>()

const emit = defineEmits<{
  selectPaper: [paper: Paper]
}>()

// Reactive data
const patternMetadata = ref<Record<string, PatternMetadata>>({})
const patternNames = ref<Record<string, string>>({})
const patternDescriptions = ref<Record<string, string>>({})

// Filter reactive data
const filterTiming = ref<string>('')
const filterResource = ref<string>('')

// Load pattern metadata on mount
onMounted(async () => {
  const data = await loadPatternMetadataFromFile()
  patternMetadata.value = data.patterns
  
  // Initialize input values
  Object.values(data.patterns).forEach(pattern => {
    patternNames.value[pattern.id] = pattern.name
    patternDescriptions.value[pattern.id] = pattern.description
  })
})

// Helper function to get edges from a template with sequence info
const getTemplateEdges = (template: AnnotationTemplate): GraphEdge[] => {
  return template.edges
    .filter(edge => edge.sequence && edge.sequence.some(seq => seq > 0))
    .map(edge => ({
      id: `${edge.from}-${edge.to}`,
      from: edge.from,
      to: edge.to,
      purpose: edge.purpose,
      sequence: edge.sequence,
      isActive: true
    }))
}

// Helper function to compare two edge sets (only compare from/to, ignore sequence numbers)
const edgeSetsEqual = (edges1: GraphEdge[], edges2: GraphEdge[]): boolean => {
  if (edges1.length !== edges2.length) return false
  
  const sortedEdges1 = [...edges1].sort((a, b) => 
    a.from.localeCompare(b.from) || a.to.localeCompare(b.to)
  )
  const sortedEdges2 = [...edges2].sort((a, b) => 
    a.from.localeCompare(b.from) || a.to.localeCompare(b.to)
  )
  
  return sortedEdges1.every((edge, index) => 
    edge.from === sortedEdges2[index].from && 
    edge.to === sortedEdges2[index].to
  )
}

// Compute patterns from papers
const patterns = computed(() => {
  const patternsMap = new Map<string, Pattern>()
  
  // Extract all templates with their papers
  props.papers.forEach(paper => {
    if (!paper.annotation?.templates) return
    
    paper.annotation.templates.forEach(template => {
      const edges = getTemplateEdges(template)
      
      // Skip empty patterns
      if (edges.length === 0) return
      
      // Create a unique key for this edge pattern (only based on from/to, ignore sequences)
      const sortedEdges = [...edges].sort((a, b) => 
        a.from.localeCompare(b.from) || a.to.localeCompare(b.to)
      )
      const patternKey = sortedEdges.map(e => `${e.from}-${e.to}`).join('|')
      
      if (!patternsMap.has(patternKey)) {
        // Use the first template's edges as the representative edges with sequences
        patternsMap.set(patternKey, {
          id: patternKey,
          edges: edges, // Keep the full GraphEdge with sequences from first paper
          papers: [],
          metadata: patternMetadata.value[patternKey]
        })
      }
      
      // Add paper with template info to the pattern
      const paperWithTemplate = {
        ...paper,
        templateInfo: template
      }
      
      patternsMap.get(patternKey)!.papers.push(paperWithTemplate)
    })
  })
  
  // Get active pattern IDs for cleanup
  const activePatternIds = Array.from(patternsMap.keys())
  
  // Cleanup empty patterns asynchronously
  cleanupEmptyPatterns(activePatternIds).catch(console.error)
  
  // Convert map to array, apply filters, and sort by predefined order
  return Array.from(patternsMap.values())
    .filter(pattern => {
      // Apply timing filter
      if (filterTiming.value) {
        const patternTiming = getPatternTiming(pattern.id)
        if (patternTiming !== filterTiming.value) {
          return false
        }
      }
      
      // Apply resource filter
      if (filterResource.value) {
        const patternResource = getPatternResource(pattern.id)
        if (patternResource !== filterResource.value) {
          return false
        }
      }
      
      return true
    })
    .sort((a, b) => {
      const orderA = getPatternOrderValue(a.id)
      const orderB = getPatternOrderValue(b.id)
      
      // If both have defined order, sort by order
      if (orderA !== -1 && orderB !== -1) {
        return orderA - orderB
      }
      
      // Put ordered patterns first
      if (orderA !== -1 && orderB === -1) return -1
      if (orderA === -1 && orderB !== -1) return 1
      
      // For unordered patterns, sort by number of papers
      return b.papers.length - a.papers.length
    })
})

// Pattern order mapping based on the research table
const patternOrderMap: Record<string, number> = {
  'G-A|H-I|H-T|I-T|T-G': 1, // P1. Interactive Prompt Enhancement
  'Aug-G|G-A|H-I|H-T|I-T|T-Aug': 2, // P2. Interactive Prompt Organization
  'Aug-G|G-A|H-I|H-T|I-Aug|T-Aug': 3, // P3. Interaction as Instruction
  'A-Aug|Aug-G|G-A|H-I|H-T|I-A|T-Aug': 4, // P4. Artifact as Instruction
  'G-I|H-I|H-T|I-T|T-G': 5, // P5. AI-driven Prompt Suggestion
  'G-I|H-I|H-T|I-Aug|T-G': 6, // P6. AI-driven Prompt Decomposition
  'G-I|H-I|H-T|I-Aug|T-Aug|T-G': 7, // P7. Generative Prompt Control Widgets
  'G-A|G-I|H-I|H-T|I-A|T-G': 8, // P8. Generative Artifact Control Widgets
  'A-G|G-I|H-I|I-T|T-Aug': 9, // P9. Artifact to Organized Instruction
  'A-Aug|A-G|G-I|H-I|I-T|T-Aug': 10, // P10. Artifact to Multimodal Instruction
  'A-G|G-I|H-I|H-T|I-Aug|T-Aug|T-G': 11, // P11. Artifact-driven Prompt Enhancement
  'A-G|G-I|H-I|H-T|I-A|T-G': 12, // P12. Interactive Artifact Refinement
}

// Pattern timing and resource mapping
const patternTimingMap: Record<string, string> = {
  'G-A|H-I|H-T|I-T|T-G': 'Interaction Before Calling GenAI',
  'Aug-G|G-A|H-I|H-T|I-T|T-Aug': 'Interaction Before Calling GenAI',
  'Aug-G|G-A|H-I|H-T|I-Aug|T-Aug': 'Interaction Before Calling GenAI',
  'A-Aug|Aug-G|G-A|H-I|H-T|I-A|T-Aug': 'Interaction Before Calling GenAI',
  'G-I|H-I|H-T|I-T|T-G': 'Interaction After Calling GenAI',
  'G-I|H-I|H-T|I-Aug|T-G': 'Interaction After Calling GenAI',
  'G-I|H-I|H-T|I-Aug|T-Aug|T-G': 'Interaction After Calling GenAI',
  'G-A|G-I|H-I|H-T|I-A|T-G': 'Interaction After Calling GenAI',
  'A-G|G-I|H-I|I-T|T-Aug': 'Interaction After Calling GenAI',
  'A-Aug|A-G|G-I|H-I|I-T|T-Aug': 'Interaction After Calling GenAI',
  'A-G|G-I|H-I|H-T|I-Aug|T-Aug|T-G': 'Interaction After Calling GenAI',
  'A-G|G-I|H-I|H-T|I-A|T-G': 'Interaction After Calling GenAI',
}

const patternResourceMap: Record<string, string> = {
  'G-A|H-I|H-T|I-T|T-G': 'Prompt-only',
  'Aug-G|G-A|H-I|H-T|I-T|T-Aug': 'Prompt-only',
  'Aug-G|G-A|H-I|H-T|I-Aug|T-Aug': 'Artifact-grounded',
  'A-Aug|Aug-G|G-A|H-I|H-T|I-A|T-Aug': 'Artifact-grounded',
  'G-I|H-I|H-T|I-T|T-G': 'Prompt-only',
  'G-I|H-I|H-T|I-Aug|T-G': 'Prompt-only',
  'G-I|H-I|H-T|I-Aug|T-Aug|T-G': 'Prompt-only',
  'G-A|G-I|H-I|H-T|I-A|T-G': 'Artifact-grounded',
  'A-G|G-I|H-I|I-T|T-Aug': 'Artifact-grounded',
  'A-Aug|A-G|G-I|H-I|I-T|T-Aug': 'Artifact-grounded',
  'A-G|G-I|H-I|H-T|I-Aug|T-Aug|T-G': 'Artifact-grounded',
  'A-G|G-I|H-I|H-T|I-A|T-G': 'Artifact-grounded',
}

// Helper functions
const getPatternOrderValue = (patternId: string): number => {
  return patternOrderMap[patternId] || -1
}

const getPatternOrder = (patternId: string): string => {
  const order = patternOrderMap[patternId]
  return order ? `P${order}` : '?'
}

const getPatternTiming = (patternId: string): string => {
  return patternTimingMap[patternId] || 'Unknown Timing'
}

const getPatternResource = (patternId: string): string => {
  return patternResourceMap[patternId] || 'Unknown Resource'
}

// Filter methods
const applyFilters = () => {
  // Filter logic is handled reactively in the patterns computed property
  // This function triggers reactivity by accessing the filter values
  const timing = filterTiming.value
  const resource = filterResource.value
  console.log('Applying filters:', { timing, resource })
}

const clearFilters = () => {
  filterTiming.value = ''
  filterResource.value = ''
}
</script>

<style scoped>
.pattern-analysis {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  white-space: nowrap;
}

.filter-group select {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  min-width: 180px;
}

.filter-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.clear-filters {
  padding: 6px 12px;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-filters:hover {
  background: #4b5563;
}

.patterns-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.no-patterns {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 18px;
}

.pattern-group {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}

.pattern-header {
  background: #f8f9fa;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pattern-title-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
}

.pattern-title-section > div:first-child {
  display: flex;
  align-items: center;
  gap: 15px;
}

.pattern-labels {
  display: flex;
  flex-direction: row;
  gap: 8px;
  margin-top: 8px;
}

.pattern-label {
  font-size: 12px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 4px;
  color: #666;
  background: #f0f0f0;
  border: 1px solid #ddd;
  font-style: italic;
  max-width: fit-content;
}

.timing-label {
  background: #e3f2fd;
  color: #1565c0;
  border-color: #bbdefb;
}

.resource-label {
  background: #f3e5f5;
  color: #7b1fa2;
  border-color: #e1bee7;
}

.pattern-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.pattern-name-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  min-width: 300px;
  max-width: 500px;
  width: 400px;
  background: white;
  transition: border-color 0.2s;
}

.pattern-name-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.pattern-name-input::placeholder {
  color: #999;
  font-style: italic;
}

.pattern-name-input.readonly {
  background: #f9fafb;
  border-color: #e5e7eb;
  color: #6b7280;
  cursor: not-allowed;
}

.paper-count {
  color: #666;
  font-size: 14px;
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
}

.pattern-content {
  display: grid;
  grid-template-columns: 600px 1fr;
  gap: 30px;
  padding: 20px;
}

.pattern-graph-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.pattern-graph {
  /* Styles handled by InteractiveGraph component */
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  padding: 10px;
  overflow: hidden;
  height: 300px; /* Reduced from 400px */
  display: flex;
  align-items: center;
  justify-content: center;
}

.pattern-description {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.description-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.description-textarea {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  resize: vertical;
  min-height: 80px;
  background: white;
  transition: border-color 0.2s;
}

.description-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.description-textarea::placeholder {
  color: #999;
  font-style: italic;
}

.description-textarea.readonly {
  background: #f9fafb;
  border-color: #e5e7eb;
  color: #6b7280;
  cursor: not-allowed;
  resize: none;
}



.pattern-name-display {
  padding: 8px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 16px;
  min-width: 300px;
  max-width: 500px;
  width: 400px;
  color: #374151;
  font-weight: 500;
}

.description-display {
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  min-height: 80px;
  color: #374151;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.graph-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center;
  transform: scale(0.95);
}

.pattern-papers h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 600;
}

.paper-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.paper-list.scrollable {
  height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.paper-list.scrollable::-webkit-scrollbar {
  width: 6px;
}

.paper-list.scrollable::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.paper-list.scrollable::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.paper-list.scrollable::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.paper-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.paper-item:hover {
  background: #e9ecef;
  border-color: #3b82f6;
}

.paper-info {
  flex: 1;
}

.paper-title {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.paper-meta {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 14px;
}

.template-info {
  color: #8b5cf6;
  font-size: 12px;
  font-style: italic;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-icons {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.template-icons .has-comments,
.template-icons .has-teaser {
  font-size: 12px;
}



@media (max-width: 1024px) {
  .pattern-content {
    grid-template-columns: 1fr;
  }
  
  .pattern-graph-section {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .pattern-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .pattern-name-input {
    min-width: 250px;
    width: 300px;
    max-width: 350px;
  }
  
  .pattern-name-display {
    min-width: 250px;
    width: 300px;
    max-width: 350px;
  }
}
</style>