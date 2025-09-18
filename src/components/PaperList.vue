<template>
  <div class="paper-list">
    <div class="paper-grid">
      <div
        v-for="paper in papers"
        :key="paper.id"
        class="paper-card"
        :class="{
          'annotated-comments': getAnnotationStatus(paper) === 'comments',
          'annotated-complete': getAnnotationStatus(paper) === 'complete',
          'annotated-partial': getAnnotationStatus(paper) === 'partial'
        }"
        @click="$emit('select', paper)"
      >
        <div class="paper-status">
          <CheckCircle v-if="hasAnnotation(paper)" class="status-icon" />
        </div>
        <h3 class="paper-title">{{ paper.title }}</h3>
        <p class="paper-year">{{ paper.year || 'N/A' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle } from 'lucide-vue-next'
import type { Paper } from '../types'

defineProps<{
  papers: Paper[]
}>()

defineEmits<{
  select: [paper: Paper]
}>()

// Check annotation status for styling
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

// Legacy function for backward compatibility
const hasAnnotation = (paper: Paper) => {
  const status = getAnnotationStatus(paper)
  return status === 'complete' || status === 'partial'
}
</script>

<style scoped>
.paper-list {
  padding: 20px;
}

.paper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.paper-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-height: 120px;
}

.paper-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.paper-card.annotated-comments {
  border-color: #ef4444;
  background: #fef2f2;
}

.paper-card.annotated-complete {
  border-color: #3b82f6;
  background: #eff6ff;
}

.paper-card.annotated-partial {
  border-color: #f59e0b;
  background: #fef3c7;
}

.paper-status {
  position: absolute;
  top: 10px;
  right: 10px;
}

.annotated-comments .status-icon {
  width: 24px;
  height: 24px;
  color: #ef4444;
}

.annotated-complete .status-icon {
  width: 24px;
  height: 24px;
  color: #3b82f6;
}

.annotated-partial .status-icon {
  width: 24px;
  height: 24px;
  color: #f59e0b;
}

.paper-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 10px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.paper-year {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.annotator-info {
  position: absolute;
  bottom: 10px;
  right: 10px;
  font-size: 12px;
  color: #888;
  background: rgba(255, 255, 255, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
  font-style: italic;
}
</style> 