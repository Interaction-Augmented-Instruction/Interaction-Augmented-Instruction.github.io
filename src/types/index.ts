// Entity Types
export type EntityType = 'H' | 'T' | 'I' | 'Aug' | 'A' | 'G'

export interface Entity {
  type: EntityType
  name: string
  description: string
  linkedEntities: LinkedEntity[]
}

export interface LinkedEntity {
  from: EntityType
  to: EntityType
  purpose: string
}

// Graph Types
export interface GraphNode {
  type: EntityType
  x: number
  y: number
  label: string
  icon?: string
  row?: number
  col?: number
}

export interface GraphEdge {
  id: string
  from: EntityType
  to: EntityType
  purpose: string
  sequence: number[]
  isActive: boolean
}

// Paper Types
export interface BibEntry {
  id?: string
  title: string
  author?: string
  year?: string
  journal?: string
  booktitle?: string
  url?: string
  doi?: string
  [key: string]: any
}

export interface Paper extends BibEntry {
  id: string
  teaserImage?: string
  annotation?: PaperAnnotation
}

export interface AnnotationTemplate {
  id: string
  name?: string
  edges: GraphEdge[]
  createdAt: string
  updatedAt: string
}

export interface PaperAnnotation {
  templates: AnnotationTemplate[]
  comments?: string
  annotator?: string
  createdAt: string
  updatedAt: string
}

// Entity Definitions
export const ENTITIES: Record<EntityType, Entity> = {
  H: {
    type: 'H',
    name: 'Human',
    description: 'The end user who holds the intent and provides inputs to the GenAI system. The human composes text prompts and performs interactions to communicate with the AI. Humans cannot directly manipulate the GenAI except via these inputs.',
    linkedEntities: [
      { from: 'H', to: 'T', purpose: 'The user writes and refines a text prompt, which is the primary natural-language instruction conveying intent.' },
      { from: 'H', to: 'I', purpose: 'The user performs interactive actions (e.g., clicking, highlighting, dragging) on the interface or artifacts to supplement or refine the prompt.' },
      // { from: 'H', to: 'A', purpose: 'User inspects intermediate results (artifacts) and makes decisions about next steps.' }
    ]
  },
  T: {
    type: 'T',
    name: 'Text Prompts',
    description: 'The natural-language instruction(s) authored by the user to convey intent. Text prompts are intuitive but can be ambiguous or underspecified. They do not directly modify artifacts without the GenAI system.',
    linkedEntities: [
      { from: 'T', to: 'Aug', purpose: 'The text prompt is incorporated into the Augmented Instruction (combined with interaction-derived information).' },
      { from: 'T', to: 'G', purpose: 'The text prompt alone is sent to the GenAI as input for generating or operating on artifacts.' }
    ]
  },
  I: {
    type: 'I',
    name: 'Interaction',
    description: 'Supplementary user inputs (e.g. clicking, selecting, sketching, or annotating) that accompany text prompts. Interactions provide precise constraints or context (e.g., choosing a region of an image or adding an inline note) but by themselves do not generate output.',
    linkedEntities: [
      { from: 'I', to: 'Aug', purpose: 'Interaction inputs are integrated into the augmented instruction, adding detail or constraints to the original prompt.' },
      { from: 'I', to: 'T', purpose: 'An interaction may modify the text prompt itself.' },
      { from: 'I', to: 'A', purpose: 'The user\'s interactions act directly on domain artifacts (e.g. clicking/highlighting parts of an image or document) to specify or restrict the scope of the GenAI task.' }
    ]
  },
  Aug: {
    type: 'Aug',
    name: 'Augmented Instruction',
    description: 'The combined instruction delivered to GenAI, formed by merging the text prompt with information derived from interactions. It encapsulates the user\'s intent in a form the AI can execute. It is transient and exists only as the input to GenAI.',
    linkedEntities: [
      { from: 'Aug', to: 'G', purpose: 'The augmented instruction is passed to the GenAI for execution. GenAI uses this enriched instruction to generate content or perform actions.' }
    ]
  },
  A: {
    type: 'A',
    name: 'Artifacts',
    description: 'The domain objects (e.g. text passages, images, code, datasets, or other outputs) that GenAI reads or operates on. They are the targets of GenAI\'s operations and the substrate of user interactions. Artifacts are not instructions themselves.',
    linkedEntities: [
      { from: 'A', to: 'Aug', purpose: 'User interactions on an artifact (e.g., highlighting a paragraph) are incorporated into Augmented Instruction.' },
      { from: 'A', to: 'G', purpose: 'Artifacts used as contextual input to GenAI.' }
    ]
  },
  G: {
    type: 'G',
    name: 'GenAI',
    description: 'The AI system (e.g. an LLM or text-to-image model) that processes instructions and performs generation or manipulation of artifacts. GenAI interprets the augmented instruction and takes action accordingly. It does not initiate actions on its own without input.',
    linkedEntities: [
      { from: 'G', to: 'A', purpose: 'Upon receiving the augmented instruction, GenAI operates on artifacts by generating new content or triggering operations on domain objects (e.g. creating an image, editing a document).' },
      { from: 'G', to: 'I', purpose: 'Can initiate interaction prompts (e.g., suggesting follow-up options or UI elements for user action).' }
    ]
  }
}

// Graph Layout Configuration
export const GRAPH_LAYOUT = {
  nodes: [
    { type: 'H' as EntityType, row: 0, col: 0 },
    { type: 'I' as EntityType, row: 0, col: 1 },
    { type: 'A' as EntityType, row: 0, col: 2 },
    { type: 'T' as EntityType, row: 1, col: 0 },
    { type: 'Aug' as EntityType, row: 1, col: 1 },
    { type: 'G' as EntityType, row: 1, col: 2 }
  ],
  nodeSize: 100,
  horizontalSpacing: 200,
  verticalSpacing: 150,
  padding: 50
} 