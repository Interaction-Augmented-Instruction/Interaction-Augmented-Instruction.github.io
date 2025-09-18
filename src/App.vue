<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import PaperList from './components/PaperList.vue'
import PaperDetail from './components/PaperDetail.vue'
import PatternAnalysis from './components/PatternAnalysis.vue'
import type { Paper, PaperAnnotation } from './types'
import { parseBibtexFile, bibEntryToPaper } from './utils/bibtex'

// State
const loading = ref(true)
const papers = ref<Paper[]>([])
const selectedPaper = ref<Paper | null>(null)
const currentView = ref<'list' | 'detail' | 'patterns'>('patterns')
const searchQuery = ref('')
const sortBy = ref<'title' | 'year' | 'status'>('year')
const sortOrder = ref<'asc' | 'desc'>('desc')

// Helper function to get annotation status
const getAnnotationStatus = (paper: Paper) => {
  if (!paper.annotation) return 'none'
  
  const hasAnnotatedEdges = paper.annotation.templates && 
    paper.annotation.templates.some(template => 
      template.edges && template.edges.some(edge => 
        edge.sequence && edge.sequence.some(seq => seq > 0)
      )
    )
  const hasComments = paper.annotation.comments && paper.annotation.comments.trim() !== ''
  const hasTeaser = paper.teaserImage && paper.teaserImage.trim() !== ''
  const isBlockedComment = hasComments && paper.annotation.comments!.trim().startsWith('Block')
  
  // Red: has comments (but not if it starts with "Block")
  if (hasComments && !isBlockedComment) {
    return 'comments'
  }
  
  // Blue: has both teaser and annotation data
  if (hasTeaser && hasAnnotatedEdges) {
    return 'complete'
  }
  
  // Orange: has only teaser or only annotation data
  if (hasTeaser || hasAnnotatedEdges) {
    return 'partial'
  }
  
  return 'none'
}

// Computed property for filtered and sorted papers
const filteredPapers = computed(() => {
  let result = papers.value
  
  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(paper => {
      // Search title
      if (paper.title.toLowerCase().includes(query)) return true
      
      // Search author
      if (paper.author && paper.author.toLowerCase().includes(query)) return true
      
      // Search year
      if (paper.year && paper.year.includes(query)) return true
      
      // Search journal/conference
      if (paper.journal && paper.journal.toLowerCase().includes(query)) return true
      if (paper.booktitle && paper.booktitle.toLowerCase().includes(query)) return true
      
      // Search DOI
      if (paper.doi && paper.doi.toLowerCase().includes(query)) return true
      
      // Search keywords (if available)
      if (paper.keywords && paper.keywords.toLowerCase().includes(query)) return true
      
      return false
    })
  }
  
  // Apply sorting
  result = [...result].sort((a, b) => {
    let compareValue = 0
    
    switch (sortBy.value) {
      case 'title':
        compareValue = a.title.localeCompare(b.title)
        break
      case 'year':
        const yearA = parseInt(a.year || '0')
        const yearB = parseInt(b.year || '0')
        compareValue = yearA - yearB
        break
      case 'status':
        const statusOrder = { 'comments': 4, 'complete': 3, 'partial': 2, 'none': 1 }
        const statusA = getAnnotationStatus(a)
        const statusB = getAnnotationStatus(b)
        compareValue = statusOrder[statusA] - statusOrder[statusB]
        break
    }
    
    return sortOrder.value === 'asc' ? compareValue : -compareValue
  })
  
  return result
})

// Load papers on mount
onMounted(async () => {
  try {
    // Load BibTeX file
    const response = await fetch('/papers.bib')
    const bibContent = await response.text()
    const bibEntries = parseBibtexFile(bibContent)
    
    // Convert to papers
    const parsedPapers = bibEntries.map(bibEntryToPaper)
    
    // Load saved annotations from JSON file
    const savedPapers = await loadAnnotationsFromJson()
    
    // Merge with saved data
    papers.value = parsedPapers.map(paper => {
      const saved = savedPapers.find((p: any) => p.id === paper.id)
      return saved || paper
    })
  } catch (error) {
    console.error('Error loading papers:', error)
  } finally {
    loading.value = false
  }
})

// Select paper
const selectPaper = (paper: Paper) => {
  selectedPaper.value = paper
  currentView.value = 'detail'
}

// Clear search
const clearSearch = () => {
  searchQuery.value = ''
}

// Load annotations from annotation.json directly
const loadAnnotationsFromJson = async () => {
  try {
    const response = await fetch('/annotation.json')
    if (response.ok) {
      const data = await response.json()
      const papers = data.papers || []
      
      // Migrate old format (edges) to new format (templates)
      return papers.map((paper: any) => {
        if (paper.annotation && paper.annotation.edges && !paper.annotation.templates) {
          // Old format - migrate to new format
          paper.annotation.templates = [{
            id: Math.random().toString(36).substring(2, 9),
            name: 'Template 1',
            edges: paper.annotation.edges,
            createdAt: paper.annotation.createdAt,
            updatedAt: paper.annotation.updatedAt
          }]
          delete paper.annotation.edges
        }
        return paper
      })
    } else {
      console.log('Failed to load annotations file')
      return []
    }
  } catch (error) {
    console.log('No annotation file found, using empty data:', error)
    return []
  }
}
</script>

<template>
  <div id="app">
    <header class="app-header">
      <div class="header-content">
        <h1>Interaction-Augmented Instruction</h1>
        <p class="subtitle">Modeling the Synergy of Prompts and Interactions in Human-GenAI Collaboration</p>
      </div>
      
      <!-- Navigation Tabs -->
      <nav class="nav-tabs" v-if="!loading && currentView !== 'detail'">
        <button 
          :class="['nav-tab', { active: currentView === 'patterns' }]"
          @click="currentView = 'patterns'"
        >
          <!-- <span class="nav-icon">📊</span> -->
          <span class="nav-text">Paradigm Analysis</span>
        </button>
        <button 
          :class="['nav-tab', { active: currentView === 'list' }]"
          @click="currentView = 'list'"
        >
          <!-- <span class="nav-icon">📝</span> -->
          <span class="nav-text">Paper List</span>
        </button>
      </nav>
    </header>
    
    <main class="app-main">
      <!-- Loading state -->
      <div v-if="loading" class="loading">
        Loading papers...
      </div>
      
      <!-- Search bar for paper list view -->
      <div v-else-if="currentView === 'list'" class="search-container">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search for papers: title, author, year, journal, DOI..."
            class="search-input"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="clear-search-button"
            title="Clear search"
          >
            ×
          </button>
        </div>
        
        <div class="controls-row">
          <div class="sort-controls">
            <label class="sort-label">Sort by:</label>
            <select v-model="sortBy" class="sort-select">
              <option value="year">Year</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
            </select>
            <button @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'" class="sort-order-button">
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </button>
          </div>
          
          <!-- <div class="status-legend">
            <div class="legend-item">
              <div class="legend-dot comments"></div>
              <span>With Comments</span>
            </div>
            <div class="legend-item">
              <div class="legend-dot complete"></div>
              <span>Complete</span>
            </div>
            <div class="legend-item">
              <div class="legend-dot partial"></div>
              <span>Partial</span>
            </div>
          </div> -->
        </div>
        <div v-if="searchQuery" class="search-results-info">
          Found {{ filteredPapers.length }} papers out of {{ papers.length }} total
        </div>
        
        <!-- Paper list -->
        <PaperList
          :papers="filteredPapers"
          @select="selectPaper"
        />
      </div>
      
      <!-- Paper detail view -->
      <PaperDetail
        v-else-if="currentView === 'detail' && selectedPaper"
        :paper="selectedPaper"
        :is-read-only="true"
        @back="currentView = 'patterns'"
      />
      
      <!-- Pattern analysis view -->
      <PatternAnalysis
        v-else-if="currentView === 'patterns'"
        :papers="papers"
        :is-read-only="true"
        @select-paper="selectPaper"
      />

    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f5f5f5;
  color: #333;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.header-content {
  padding: 20px;
  text-align: center;
}

.app-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 8px 0 0 0;
  font-weight: 400;
}

.nav-tabs {
  display: flex;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.nav-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.3s ease;
  position: relative;
}

.nav-tab:hover {
  background: #f1f5f9;
  color: #374151;
}

.nav-tab.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
}

.nav-tab.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #3b82f6;
}

.nav-icon {
  font-size: 18px;
}

.nav-text {
  font-weight: 500;
}

.readonly-toggle-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.readonly-toggle-button:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.readonly-toggle-button.active {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fca5a5;
}

.readonly-toggle-button.active:hover {
  background: #fee2e2;
  border-color: #f87171;
}

.app-header.readonly-mode {
  background: linear-gradient(135deg, #fef2f2, #fff);
  border-bottom-color: #fca5a5;
}

.app-header.readonly-mode::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #dc2626, #ef4444, #dc2626);
  animation: readonly-pulse 2s ease-in-out infinite;
}

@keyframes readonly-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.user-info {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.status-legend {
  display: flex;
  flex-direction: row;
  gap: 16px;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid;
}

.legend-dot.comments {
  background: #fef2f2;
  border-color: #ef4444;
}

.legend-dot.complete {
  background: #eff6ff;
  border-color: #3b82f6;
}

.legend-dot.partial {
  background: #fef3c7;
  border-color: #f59e0b;
}

.icon {
  width: 20px;
  height: 20px;
}

.app-main {
  flex: 1;
  background: #f5f5f5;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 18px;
  color: #666;
}



/* PaperDetail slot styles */
.paper-detail :deep(.paper-info) {
  position: relative;
}

/* Search styles */
.search-container {
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.sort-select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.sort-order-button {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s;
}

.sort-order-button:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: #f9f9f9;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 10px;
  transition: all 0.2s;
  max-width: 1800px;
  margin-left: auto;
  margin-right: auto;
}

.search-box:focus-within {
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 16px;
  padding: 0;
  color: #333;
  outline: none;
}

.search-input::placeholder {
  color: #999;
}

.clear-search-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  color: #666;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 18px;
  font-weight: bold;
  margin-left: 8px;
}

.clear-search-button:hover {
  color: #333;
  background: #f0f0f0;
}

.search-results-info {
  font-size: 14px;
  color: #666;
  text-align: center;
  font-weight: 500;
  margin-bottom: 20px;
  padding: 8px 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #e0f2fe;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* User Name Modal */
.user-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.user-modal {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.user-modal h2 {
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 24px;
}

.user-modal p {
  margin: 0 0 30px 0;
  color: #666;
  line-height: 1.5;
}

.user-name-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 20px;
  outline: none;
  transition: border-color 0.2s;
}

.user-name-input:focus {
  border-color: #3b82f6;
}

.confirm-user-button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.confirm-user-button:hover:not(:disabled) {
  background: #2563eb;
}

.confirm-user-button:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    padding: 16px;
  }
  
  .app-header h1 {
    font-size: 24px;
  }
  
  .subtitle {
    font-size: 14px;
  }
  
  .nav-tab {
    padding: 12px 16px;
    font-size: 14px;
    flex-direction: column;
    gap: 4px;
  }
  
  .nav-icon {
    font-size: 16px;
  }
  
  .nav-text {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .nav-tab {
    padding: 10px 8px;
  }
  
  .nav-text {
    display: none;
  }
  
  .nav-icon {
    font-size: 20px;
  }
}
</style>



