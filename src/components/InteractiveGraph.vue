<template>
  <div class="graph-container">
    <svg :width="svgWidth" :height="svgHeight" class="graph-svg">
      <!-- Define arrow marker -->
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path
            d="M 0 0 L 8 4 L 0 8 L 2 4 Z"
            :fill="isReadOnly ? '#3b82f6' : '#9ca3af'"
          />
        </marker>
        <marker
          id="arrowhead-active"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path
            d="M 0 0 L 8 4 L 0 8 L 2 4 Z"
            fill="#3b82f6"
          />
        </marker>
      </defs>
      
      <!-- Draw edges with smart routing -->
      <g class="edges">
        <g v-for="(edge, edgeIndex) in displayEdges" :key="edge.id">
          <path
            :d="getSmartPath(edge, edgeIndex)"
            :stroke="edge.isActive || isReadOnly ? '#3b82f6' : '#d1d5db'"
            :stroke-width="edge.isActive || isReadOnly ? 2.5 : 2"
            fill="none"
            :marker-end="`url(#${edge.isActive || isReadOnly ? 'arrowhead-active' : 'arrowhead'})`"
            class="edge-path"
            @contextmenu.prevent="showContextMenu($event, edge.id)"
          />
          
                  <!-- Sequence circles -->
        <g v-for="(seq, index) in edge.sequence" :key="`${edge.id}-${index}`">
          <circle
            :cx="getSequencePosition(edge, index, edgeIndex).x"
            :cy="getSequencePosition(edge, index, edgeIndex).y"
            r="9"
            :fill="seq > 0 || isReadOnly ? '#3b82f6' : '#f3f4f6'"
            :stroke="seq > 0 || isReadOnly ? '#1e40af' : '#d1d5db'"
            stroke-width="2"
            style="cursor: pointer"
            @click="!isReadOnly && startEditingSequence(edge.id, index)"
          />
                     <!-- Direct input mode - enlarged input area -->
           <foreignObject
             v-if="editingSequence && editingSequence.edgeId === edge.id && editingSequence.index === index"
             :x="getSequencePosition(edge, index, edgeIndex).x - 20"
             :y="getSequencePosition(edge, index, edgeIndex).y - 15"
             width="40"
             height="30"
           >
             <div style="width: 40px; height: 30px; display: flex; align-items: center; justify-content: center; background: rgba(59, 130, 246, 0.9); border-radius: 15px; border: 2px solid #1e40af;">
               <input
                 ref="sequenceInput"
                 type="text"
                 :value="editingSequence.value"
                 @input="updateEditingValue"
                 @blur="finishEditingSequence"
                 @keydown="handleSequenceKeydown"
                 style="width: 30px; height: 20px; text-align: center; font-size: 14px; font-weight: bold; border: none; background: transparent; color: white; outline: none; padding: 0; margin: 0; border-radius: 10px;"
               />
             </div>
           </foreignObject>
                     <text
             v-else-if="seq > 0"
             :x="getSequencePosition(edge, index, edgeIndex).x"
             :y="getSequencePosition(edge, index, edgeIndex).y"
             text-anchor="middle"
             dominant-baseline="central"
             fill="white"
             font-size="10"
             font-weight="bold"
             style="pointer-events: none; user-select: none"
           >
             {{ seq }}
           </text>
        </g>
        </g>
      </g>
      
      <!-- Debug: 8 anchor points available: 4 sides + 4 corners -->

      <!-- Draw nodes -->
      <g class="nodes">
        <g v-for="node in nodes" :key="node.type" class="node-group">
          <!-- Node background -->
          <rect
            :x="node.x - nodeWidth/2"
            :y="node.y - nodeHeight/2"
            :width="nodeWidth"
            :height="nodeHeight"
            rx="6"
            fill="white"
            stroke="#3b82f6"
            stroke-width="1.5"
            class="node-rect"
          />
          
          <!-- Node type abbreviation (prominent) -->
          <text
            :x="node.x - nodeWidth/2 + 8"
            :y="node.y - nodeHeight/2 + 16"
            fill="#3b82f6"
            font-size="13"
            font-weight="800"
            class="node-type"
          >
            {{ node.type }}
          </text>
          
          <!-- Small decorative icon -->
          <component
            :is="getNodeIcon(node.type)"
            :x="node.x + nodeWidth/2 - 16"
            :y="node.y - nodeHeight/2 + 4"
            width="12"
            height="12"
            color="#94a3b8"
            class="node-icon"
          />
          
          <!-- Multi-line node label -->
          <foreignObject
            :x="node.x - nodeWidth/2 + 4"
            :y="node.y - nodeHeight/2 + 20"
            :width="nodeWidth - 8"
            :height="nodeHeight - 24"
          >
            <div class="node-label" xmlns="http://www.w3.org/1999/xhtml">
              {{ node.label }}
            </div>
          </foreignObject>
        </g>
      </g>
    </svg>
    
    <!-- Context menu for adding sequences -->
    <div 
      v-if="showContextMenuState && canAddSequenceNumber" 
      :style="{ left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px' }"
      class="context-menu"
      @click="addSequenceNumber"
    >
      Add Sequence Number
    </div>
    
    <!-- Sequence input modal -->
    <div v-if="showSequenceInput" class="sequence-modal">
      <div class="modal-content">
        <h3>Enter Sequence Number</h3>
        <input
          v-model.number="sequenceInputValue"
          type="number"
          min="1"
          class="sequence-input"
          @keyup.enter="confirmSequence"
          ref="sequenceInputRef"
        />
        <div class="modal-buttons">
          <button @click="cancelSequence" class="cancel-button">Cancel</button>
          <button @click="confirmSequence" class="confirm-button">Confirm</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { User, FileText, MousePointer, FileCheck, Database, Cpu } from 'lucide-vue-next'
import type { GraphNode, GraphEdge, EntityType } from '../types'
import { ENTITIES, GRAPH_LAYOUT } from '../types'

const props = defineProps<{
  edges: GraphEdge[]
  isReadOnly?: boolean
}>()

const emit = defineEmits<{
  updateEdges: [edges: GraphEdge[]]
}>()

// Constants - smaller nodes, larger spacing
const nodeWidth = 85
const nodeHeight = 50
const horizontalSpacing = 240
const verticalSpacing = 180
const padding = 80

// Calculate SVG dimensions
const svgWidth = padding * 2 + horizontalSpacing * 2 + nodeWidth
const svgHeight = padding * 2 + verticalSpacing + nodeHeight

// Create nodes based on layout
const nodes = computed<GraphNode[]>(() => {
  return GRAPH_LAYOUT.nodes.map(layout => ({
    type: layout.type,
    x: padding + layout.col * horizontalSpacing + nodeWidth / 2,
    y: padding + layout.row * verticalSpacing + nodeHeight / 2,
    label: ENTITIES[layout.type].name,
    row: layout.row,
    col: layout.col
  }))
})

// Get all possible edges from entity definitions
const allPossibleEdges = computed<GraphEdge[]>(() => {
  const edges: GraphEdge[] = []
  Object.values(ENTITIES).forEach(entity => {
    entity.linkedEntities.forEach(link => {
      const existingEdge = props.edges.find(e => e.from === link.from && e.to === link.to)
      const sequence = existingEdge?.sequence || [0]
      const isActive = sequence.some(s => s > 0)
      edges.push({
        id: `${link.from}-${link.to}`,
        from: link.from,
        to: link.to,
        purpose: link.purpose,
        sequence,
        isActive
      })
    })
  })
  // console.log('Total edges found:', edges.length, edges.map(e => e.id))
  return edges
})

// Display edges - show only active edges in read-only mode
const displayEdges = computed(() => {
  if (props.isReadOnly) {
    return props.edges.filter(e => e.isActive)
  }
  return allPossibleEdges.value
})

// Context menu state
const showContextMenuState = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })
const contextMenuEdgeId = ref('')

// Direct editing state for sequence circles
const editingSequence = ref<{ edgeId: string; index: number; value: string } | null>(null)
const sequenceInput = ref<HTMLInputElement>()

// Check if we can add a sequence number (only if current edge has at least one sequence with value > 0)
const canAddSequenceNumber = computed(() => {
  if (!contextMenuEdgeId.value) return false
  const edge = displayEdges.value.find((e: GraphEdge) => e.id === contextMenuEdgeId.value)
  if (!edge) return false
  return edge.sequence.some(seq => seq > 0)
})

// Sequence input modal state
const showSequenceInput = ref(false)
const sequenceInputValue = ref(1)
const currentEditingEdge = ref<string>('')
const currentEditingIndex = ref(0)
const sequenceInputRef = ref<HTMLInputElement>()

// Get node position with layout info
const getNodePosition = (type: EntityType) => {
  const node = nodes.value.find(n => n.type === type)
  return node || { x: 0, y: 0, row: 0, col: 0 }
}

// Smart path routing based on node positions
const getSmartPath = (edge: GraphEdge, edgeIndex: number) => {
  const fromNode = getNodePosition(edge.from)
  const toNode = getNodePosition(edge.to)
  
  // Check for bidirectional edges between adjacent nodes
  const reverseEdge = displayEdges.value.find(e => e.from === edge.to && e.to === edge.from)
  const fromRow = fromNode.row ?? 0
  const fromCol = fromNode.col ?? 0
  const toRow = toNode.row ?? 0
  const toCol = toNode.col ?? 0
  
  const isAdjacent = (Math.abs(fromRow - toRow) <= 1) && (Math.abs(fromCol - toCol) <= 1)
  
  // Calculate symmetric offset for bidirectional adjacent edges
  let offset = 0
  if (reverseEdge && isAdjacent) {
    // Use edge direction to determine offset direction for symmetry
    const edgeDirection = edge.from < edge.to ? 1 : -1
    offset = 12 * edgeDirection // Larger offset for better separation
  }
  
  // Same row, not adjacent - use elbow
  if (fromRow === toRow && Math.abs(fromCol - toCol) > 1) {
    return getElbowPath(fromNode, toNode, offset, true) // Force elbow for same row
  }
  
  // Different row AND different column - use diagonal
  if (fromRow !== toRow && fromCol !== toCol) {
    return getDiagonalPath(fromNode, toNode, offset)
  }
  
  // Adjacent or same column - use elbow with offset
  return getElbowPath(fromNode, toNode, offset, false)
}

// Create elbow-shaped path that routes around intermediate nodes
const getElbowPath = (fromNode: any, toNode: any, offset: number, forceElbow: boolean = false) => {
  // For elbow paths, prefer top/bottom anchors for same row, left/right for same column
  let fromEdge, toEdge
  
  const fromRow = fromNode.row ?? 0
  const fromCol = fromNode.col ?? 0
  const toRow = toNode.row ?? 0
  const toCol = toNode.col ?? 0
  
  // For same row connections, route around intermediate nodes using top/bottom anchors
  if (fromRow === toRow && Math.abs(fromCol - toCol) > 1) {
    // Use top/bottom anchors for same row routing
    fromEdge = {
      x: fromNode.x,
      y: fromRow === 0 ? fromNode.y - nodeHeight / 2 : fromNode.y + nodeHeight / 2,
      side: fromRow === 0 ? 'top' : 'bottom'
    }
    toEdge = {
      x: toNode.x,
      y: toRow === 0 ? toNode.y - nodeHeight / 2 : toNode.y + nodeHeight / 2,
      side: toRow === 0 ? 'top' : 'bottom'
    }
    
    const routingY = fromRow === 0 ? 
      fromNode.y - nodeHeight / 2 - 30 :  // Route above top row
      fromNode.y + nodeHeight / 2 + 30    // Route below bottom row
    
    return `M ${fromEdge.x} ${fromEdge.y} L ${fromEdge.x} ${routingY} L ${toEdge.x} ${routingY} L ${toEdge.x} ${toEdge.y}`
  } else {
    // Use smart anchor selection for other cases
    fromEdge = getNodeEdgePoint(fromNode, toNode, true, offset)
    toEdge = getNodeEdgePoint(toNode, fromNode, false, offset)
  }
  
  // For same column connections, route around intermediate nodes  
  if (fromCol === toCol && Math.abs(fromRow - toRow) > 1) {
    const routingX = fromCol === 0 ? 
      fromNode.x - nodeWidth / 2 - 30 :   // Route left of leftmost column
      fromCol === 1 ?
      fromNode.x + nodeWidth / 2 + 30 :   // Route right of middle column
      fromNode.x + nodeWidth / 2 + 30     // Route right of rightmost column
    
    return `M ${fromEdge.x} ${fromEdge.y} L ${routingX} ${fromEdge.y} L ${routingX} ${toEdge.y} L ${toEdge.x} ${toEdge.y}`
  }
  
  // Standard elbow for adjacent connections
  if (Math.abs(fromNode.x - toNode.x) > Math.abs(fromNode.y - toNode.y)) {
    // Horizontal primary direction
    const midX = (fromEdge.x + toEdge.x) / 2
    return `M ${fromEdge.x} ${fromEdge.y} L ${midX} ${fromEdge.y} L ${midX} ${toEdge.y} L ${toEdge.x} ${toEdge.y}`
  } else {
    // Vertical primary direction
    const midY = (fromEdge.y + toEdge.y) / 2
    return `M ${fromEdge.x} ${fromEdge.y} L ${fromEdge.x} ${midY} L ${toEdge.x} ${midY} L ${toEdge.x} ${toEdge.y}`
  }
}

// Create diagonal path
const getDiagonalPath = (fromNode: any, toNode: any, offset: number) => {
  const fromEdge = getNodeEdgePoint(fromNode, toNode, true, offset)
  const toEdge = getNodeEdgePoint(toNode, fromNode, false, offset)
  
  return `M ${fromEdge.x} ${fromEdge.y} L ${toEdge.x} ${toEdge.y}`
}

// Calculate connection point at node edge with offset
const getNodeEdgePoint = (fromNode: any, toNode: any, isStart: boolean, offset: number = 0) => {
  const dx = toNode.x - fromNode.x
  const dy = toNode.y - fromNode.y
  
  // Define all possible anchor points for the node (4 sides + 4 corners + 2 extra per edge)
  const anchors = [
    // Side center points
    { x: fromNode.x + nodeWidth / 2, y: fromNode.y, side: 'right' },                          // Right center
    { x: fromNode.x - nodeWidth / 2, y: fromNode.y, side: 'left' },                           // Left center
    { x: fromNode.x, y: fromNode.y - nodeHeight / 2, side: 'top' },                           // Top center
    { x: fromNode.x, y: fromNode.y + nodeHeight / 2, side: 'bottom' },                        // Bottom center
    
    // Corner points
    { x: fromNode.x + nodeWidth / 2, y: fromNode.y - nodeHeight / 2, side: 'top-right' },     // Top-right corner
    { x: fromNode.x - nodeWidth / 2, y: fromNode.y - nodeHeight / 2, side: 'top-left' },      // Top-left corner
    { x: fromNode.x + nodeWidth / 2, y: fromNode.y + nodeHeight / 2, side: 'bottom-right' },  // Bottom-right corner
    { x: fromNode.x - nodeWidth / 2, y: fromNode.y + nodeHeight / 2, side: 'bottom-left' },   // Bottom-left corner
    
    // Additional points (1/3 and 2/3 along each edge)
    { x: fromNode.x + nodeWidth / 2, y: fromNode.y - nodeHeight / 6, side: 'right-upper' },   // Right upper third
    { x: fromNode.x + nodeWidth / 2, y: fromNode.y + nodeHeight / 6, side: 'right-lower' },   // Right lower third
    { x: fromNode.x - nodeWidth / 2, y: fromNode.y - nodeHeight / 6, side: 'left-upper' },    // Left upper third
    { x: fromNode.x - nodeWidth / 2, y: fromNode.y + nodeHeight / 6, side: 'left-lower' },    // Left lower third
    { x: fromNode.x - nodeWidth / 6, y: fromNode.y - nodeHeight / 2, side: 'top-left-third' }, // Top left third
    { x: fromNode.x + nodeWidth / 6, y: fromNode.y - nodeHeight / 2, side: 'top-right-third' }, // Top right third
    { x: fromNode.x - nodeWidth / 6, y: fromNode.y + nodeHeight / 2, side: 'bottom-left-third' }, // Bottom left third
    { x: fromNode.x + nodeWidth / 6, y: fromNode.y + nodeHeight / 2, side: 'bottom-right-third' }, // Bottom right third
  ]
  
  // Find the closest anchor point to the target
  let bestAnchor = anchors[0]
  let minDistance = Number.MAX_VALUE
  
  anchors.forEach(anchor => {
    const distance = Math.sqrt((anchor.x - toNode.x) ** 2 + (anchor.y - toNode.y) ** 2)
    if (distance < minDistance) {
      minDistance = distance
      bestAnchor = anchor
    }
  })
  
  // Apply offset for bidirectional edges
  let x = bestAnchor.x
  let y = bestAnchor.y
  
  // Apply offset based on anchor side
  if (bestAnchor.side.includes('top') || bestAnchor.side.includes('bottom')) {
    x += offset
  } else if (bestAnchor.side.includes('left') || bestAnchor.side.includes('right')) {
    y += offset
  } else {
    // For corner anchors, apply offset diagonally
    const offsetFactor = offset * 0.7 // Reduce offset for diagonal
    if (bestAnchor.side.includes('right')) {
      x += offsetFactor
    } else {
      x -= offsetFactor
    }
    if (bestAnchor.side.includes('top')) {
      y -= offsetFactor
    } else {
      y += offsetFactor
    }
  }
  
  return { x, y, side: bestAnchor.side }
}

// Get sequence circle position on path
const getSequencePosition = (edge: GraphEdge, index: number, edgeIndex: number) => {
  const path = getSmartPath(edge, edgeIndex)
  const totalSequences = edge.sequence.length
  
  // Parse the path to get all points
  const pathCommands = path.match(/[ML]\s*[\d\.\s]+/g) || []
  const points: {x: number, y: number}[] = []
  
  pathCommands.forEach(cmd => {
    const coords = cmd.replace(/[ML]/, '').trim().split(/\s+/).map(Number)
    if (coords.length >= 2) {
      points.push({ x: coords[0], y: coords[1] })
    }
  })
  
  if (points.length < 2) return { x: 0, y: 0 }
  
  // Calculate total path length
  let totalLength = 0
  const segmentLengths: number[] = []
  
  for (let i = 1; i < points.length; i++) {
    const segLength = Math.sqrt(
      (points[i].x - points[i-1].x) ** 2 + 
      (points[i].y - points[i-1].y) ** 2
    )
    segmentLengths.push(segLength)
    totalLength += segLength
  }
  
  // Find position along path - place circles starting from 1/4, with proper spacing
  const basePosition = 0.25 // Start at 1/4 from beginning
  const maxSpacing = 0.5 // Maximum space to use for circles
  const spacing = totalSequences > 1 ? maxSpacing / totalSequences : 0.1
  const targetDistance = totalLength * (basePosition + index * spacing)
  let currentDistance = 0
  
  for (let i = 0; i < segmentLengths.length; i++) {
    if (currentDistance + segmentLengths[i] >= targetDistance) {
      const segmentProgress = (targetDistance - currentDistance) / segmentLengths[i]
      const x = points[i].x + (points[i + 1].x - points[i].x) * segmentProgress
      const y = points[i].y + (points[i + 1].y - points[i].y) * segmentProgress
      return { x, y }
    }
    currentDistance += segmentLengths[i]
  }
  
  // Fallback to end point
  return points[points.length - 1]
}

// Get node icon component
const getNodeIcon = (type: EntityType) => {
  const iconMap = {
    H: User,
    T: FileText,
    I: MousePointer,
    Aug: FileCheck,
    A: Database,
    G: Cpu
  }
  return iconMap[type]
}

// Show context menu
const showContextMenu = (event: MouseEvent, edgeId: string) => {
  event.preventDefault()
  contextMenuPos.value = { x: event.clientX, y: event.clientY }
  contextMenuEdgeId.value = edgeId
  showContextMenuState.value = true
}

// Hide context menu when clicking outside
const hideContextMenu = () => {
  showContextMenuState.value = false
}

// Update sequence
const updateSequence = (edgeId: string, index: number) => {
  currentEditingEdge.value = edgeId
  currentEditingIndex.value = index
  const edge = allPossibleEdges.value.find(e => e.id === edgeId)
  sequenceInputValue.value = edge?.sequence[index] || 1
  showSequenceInput.value = true
  nextTick(() => {
    sequenceInputRef.value?.focus()
    sequenceInputRef.value?.select()
  })
}

// Add sequence
const addSequence = (edgeId: string) => {
  const updatedEdges = allPossibleEdges.value.map(edge => {
    if (edge.id === edgeId) {
      return {
        ...edge,
        sequence: [...edge.sequence, 0]
      }
    }
    return edge
  })
  emit('updateEdges', updatedEdges.filter(e => e.sequence.some(s => s > 0)))
  hideContextMenu()
}

// Confirm sequence input
const confirmSequence = () => {
  const updatedEdges = allPossibleEdges.value.map(edge => {
    if (edge.id === currentEditingEdge.value) {
      const newSequence = [...edge.sequence]
      newSequence[currentEditingIndex.value] = sequenceInputValue.value
      const isActive = newSequence.some(s => s > 0)
      return {
        ...edge,
        sequence: newSequence,
        isActive
      }
    }
    return edge
  })
  emit('updateEdges', updatedEdges.filter(e => e.sequence.some(s => s > 0)))
  showSequenceInput.value = false
}

// Cancel sequence input
const cancelSequence = () => {
  showSequenceInput.value = false
}

// Direct editing functions for sequence circles
const startEditingSequence = (edgeId: string, index: number) => {
  if (props.isReadOnly) return
  
  const edge = displayEdges.value.find((e: GraphEdge) => e.id === edgeId)
  if (!edge) return
  
  const currentValue = edge.sequence[index]
  editingSequence.value = {
    edgeId,
    index,
    value: (currentValue && currentValue > 0) ? currentValue.toString() : ''
  }
  
  // Focus input immediately after setting editing state
  nextTick(() => {
    const input = sequenceInput.value
    if (input) {
      input.focus()
      if (input.value) {
        input.select() // Select all if there's existing value
      }
    }
  })
}

const updateEditingValue = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (editingSequence.value) {
    editingSequence.value.value = target.value
  }
}

const finishEditingSequence = () => {
  if (!editingSequence.value) return
  
  const edge = displayEdges.value.find((e: GraphEdge) => e.id === editingSequence.value!.edgeId)
  if (!edge) return
  
  const inputValue = editingSequence.value.value.trim()
  const value = inputValue === '' ? 0 : parseInt(inputValue) || 0
  edge.sequence[editingSequence.value.index] = value
  
  // Update isActive status based on whether any sequence has value > 0
  edge.isActive = edge.sequence.some(s => s > 0)
  
  editingSequence.value = null
  emit('updateEdges', displayEdges.value)
}

const handleSequenceKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    finishEditingSequence()
  } else if (event.key === 'Escape') {
    editingSequence.value = null
  }
}

// Add sequence number to edge via context menu
const addSequenceNumber = () => {
  if (!contextMenuEdgeId.value) return
  
  const edge = displayEdges.value.find((e: GraphEdge) => e.id === contextMenuEdgeId.value)
  if (!edge) return
  
  // Only add if there's at least one sequence with value > 0
  if (!edge.sequence.some(seq => seq > 0)) return
  
  // Add a new sequence circle (start with 0 for empty state)
  edge.sequence.push(0)
  
  // Update isActive status (should remain active since we already have sequences > 0)
  edge.isActive = edge.sequence.some(s => s > 0)
  
  // Close context menu
  showContextMenuState.value = false
  contextMenuEdgeId.value = ''
  
  // Automatically start editing the new sequence circle
  nextTick(() => {
    startEditingSequence(edge.id, edge.sequence.length - 1)
  })
  
  // Emit updated edges
  emit('updateEdges', displayEdges.value)
}

// Add event listeners
onMounted(() => {
  document.addEventListener('click', hideContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu)
})
</script>

<style scoped>
.graph-container {
  position: relative;
  background: #f9fafb;
  border-radius: 8px;
  padding: 20px;
}

.graph-svg {
  display: block;
  margin: 0 auto;
}

.edge-path {
  cursor: pointer;
  transition: all 0.2s ease;
}

.edge-path:hover {
  stroke-width: 4 !important;
}

.sequence-circle {
  cursor: pointer;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.sequence-circle:hover {
  /* Remove transform effects, keep only color transition */
}

.sequence-text {
  cursor: pointer;
  user-select: none;
  pointer-events: none; /* Prevent text from interfering with clicks */
}

.node-rect {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.node-type {
  user-select: none;
}

.node-icon {
  opacity: 0.6;
}

.node-label {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.1;
  text-align: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.sequence-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 300px;
}

.modal-content h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
}

.sequence-input {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  margin-bottom: 16px;
}

.sequence-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.modal-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.cancel-button,
.confirm-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button {
  background: white;
  border: 1px solid #e0e0e0;
}

.cancel-button:hover {
  background: #f5f5f5;
}

.confirm-button {
  background: #3b82f6;
  color: white;
  border: none;
}

.confirm-button:hover {
  background: #2563eb;
}

.context-menu {
  position: fixed;
  background: white;
  color: #374151;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  z-index: 999;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.context-menu:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}
</style> 