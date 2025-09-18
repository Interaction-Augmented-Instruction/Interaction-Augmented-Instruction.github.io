declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'lucide-vue-next' {
  import { DefineComponent } from 'vue'
  export const CheckCircle: DefineComponent
  export const ArrowLeft: DefineComponent
  export const Upload: DefineComponent
  export const Camera: DefineComponent
  export const X: DefineComponent
  export const Save: DefineComponent
  export const Download: DefineComponent
  export const Edit3: DefineComponent
  export const User: DefineComponent
  export const FileText: DefineComponent
  export const MousePointer: DefineComponent
  export const FileCheck: DefineComponent
  export const Database: DefineComponent
  export const Cpu: DefineComponent
}

declare module 'bibtex-parse' {
  interface BibTeXEntry {
    key: string
    type: string
    fields: Record<string, string>
  }
  
  export function parse(bibtex: string): BibTeXEntry[]
} 