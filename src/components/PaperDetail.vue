<template>
  <div class="paper-detail">
    <button class="back-button" @click="$emit('back')">
      <ArrowLeft class="icon" />
      Back to List
    </button>
    
    <div class="paper-info">
      <h1 class="title">{{ paper.title }}</h1>
      
      <div class="metadata">
        <div class="meta-item" v-if="paper.author">
          <strong>Authors:</strong> {{ paper.author }}
        </div>
        <div class="meta-item" v-if="paper.journal">
          <strong>Journal:</strong> {{ paper.journal }}
        </div>
        <div class="meta-item" v-if="paper.booktitle">
          <strong>Venue:</strong> {{ paper.booktitle }}
        </div>
        <div class="meta-item" v-if="paper.year">
          <strong>Year:</strong> {{ paper.year }}
        </div>
        <div class="meta-item" v-if="paper.url">
          <strong>URL:</strong> 
          <a :href="paper.url" target="_blank" rel="noopener">{{ paper.url }}</a>
        </div>
        <div class="meta-item" v-if="paper.doi">
          <strong>DOI:</strong> {{ paper.doi }}
        </div>
      </div>
      
      <!-- Teaser Image -->
      <div v-if="paper.teaserImage" class="teaser-section">
        <h3>Teaser Image</h3>
        <div class="teaser-image">
          <img :src="paper.teaserImage" alt="Paper teaser" />
        </div>
      </div>
      
      <!-- Annotation Results -->
      <div v-if="paper.annotation" class="annotation-section">
        <div class="annotation-header">
          <h3>Annotation Results</h3>
          <!-- <div class="annotation-meta">
            <span v-if="paper.annotation.annotator">Annotated by: {{ paper.annotation.annotator }}</span>
            <span v-if="paper.annotation.createdAt">Created: {{ formatDate(paper.annotation.createdAt) }}</span>
            <span v-if="paper.annotation.updatedAt">Updated: {{ formatDate(paper.annotation.updatedAt) }}</span>
          </div> -->
        </div>
        
        <!-- Templates Display -->
        <div v-if="paper.annotation.templates && paper.annotation.templates.length > 0" class="templates-display">
          <div 
            v-for="(template, index) in paper.annotation.templates" 
            :key="template.id"
            class="template-display"
          >
            <h4 class="template-title">{{ template.name || `Template ${index + 1}` }}</h4>
            
            <!-- Interactive Graph Display -->
            <div v-if="template.edges && template.edges.length > 0" class="graph-display">
              <InteractiveGraph
                :edges="template.edges"
                :is-read-only="true"
                @update-edges="() => {}"
              />
            </div>
            <div v-else class="no-graph">
              <p>No graph data available for this template</p>
            </div>
          </div>
        </div>
        
        <!-- Comments Display -->
        <div v-if="paper.annotation.comments" class="comments-section">
          <h4>Comments</h4>
          <div class="comments-display">
            {{ paper.annotation.comments }}
          </div>
        </div>
      </div>
      
      <!-- No Annotation -->
      <div v-else class="no-annotation">
        <h3>No Annotation Data</h3>
        <p>This paper has not been annotated yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import InteractiveGraph from './InteractiveGraph.vue'
import type { Paper } from '../types'

// Props
const props = defineProps<{
  paper: Paper
  isReadOnly?: boolean
}>()

// Emits
defineEmits<{
  back: []
}>()

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}
</script>

<style scoped>
.paper-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 2rem;
}

.back-button:hover {
  background: #e9ecef;
  transform: translateY(-1px);
}

.icon {
  width: 16px;
  height: 16px;
}

.title {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  line-height: 1.3;
}

.metadata {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.meta-item {
  display: flex;
  gap: 0.5rem;
}

.meta-item strong {
  min-width: 100px;
  color: #495057;
}

.meta-item a {
  color: #007bff;
  text-decoration: none;
  word-break: break-all;
}

.meta-item a:hover {
  text-decoration: underline;
}

.teaser-section {
  margin-bottom: 2rem;
}

.teaser-section h3 {
  margin-bottom: 1rem;
  color: #495057;
}

.teaser-image {
  position: relative;
  display: inline-block;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.teaser-image img {
  max-width: 100%;
  height: auto;
  display: block;
}

.annotation-section {
  margin-bottom: 2rem;
}

.annotation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.annotation-header h3 {
  color: #495057;
  margin: 0;
}

.annotation-meta {
  display: flex;
  gap: 2rem;
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 1.5rem;
}

.templates-display {
  margin-bottom: 2rem;
}

.template-display {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: #fefefe;
}

.template-title {
  color: #495057;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.graph-display {
  margin-top: 1rem;
}

.no-graph {
  padding: 2rem;
  text-align: center;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 8px;
}

.comments-section {
  margin-top: 2rem;
}

.comments-section h4 {
  color: #495057;
  margin-bottom: 1rem;
}

.comments-display {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  white-space: pre-wrap;
  line-height: 1.6;
}

.no-annotation {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.no-annotation h3 {
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .paper-detail {
    padding: 1rem;
    margin: 1rem;
  }
  
  .title {
    font-size: 1.5rem;
  }
  
  .annotation-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
