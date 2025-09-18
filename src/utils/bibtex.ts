import { parse } from 'bibtex-parse'
import type { BibEntry, Paper } from '../types'

export function parseBibtexFile(content: string): BibEntry[] {
  try {
    console.log('Starting BibTeX parsing...')
    const parsed = parse(content)
    console.log('Number of entries:', parsed.length)
    
    return parsed
      .filter((entry: any, index: number) => {
        if (!entry || typeof entry !== 'object' || !entry.fields) {
          console.warn(`Invalid entry at index ${index}:`, entry)
          return false
        }
        return true
      })
      .map((entry: any, index: number) => {
        // bibtex-parse returns fields as an array, need to convert to object
        const fieldsObject: any = {}
        
        if (Array.isArray(entry.fields)) {
          entry.fields.forEach((field: any) => {
            if (field && field.name && field.value !== undefined) {
              fieldsObject[field.name.toLowerCase()] = field.value
            }
          })
        }
        
        console.log(`Entry ${index} (${entry.key}):`, {
          type: entry.type,
          fields: Object.keys(fieldsObject)
        })
        
        const bibEntry: BibEntry = {
          id: entry.key || generateId(),
          title: cleanBibTexString(fieldsObject.title) || 'Untitled',
          author: cleanBibTexString(fieldsObject.author),
          year: cleanBibTexString(fieldsObject.year),
          journal: cleanBibTexString(fieldsObject.journal),
          booktitle: cleanBibTexString(fieldsObject.booktitle),
          url: cleanBibTexString(fieldsObject.url),
          doi: cleanBibTexString(fieldsObject.doi),
          // 包含所有其他字段
          ...Object.fromEntries(
            Object.entries(fieldsObject).map(([key, value]) => [
              key,
              typeof value === 'string' ? cleanBibTexString(value) : value
            ])
          )
        }
        
        return bibEntry
      })
  } catch (error) {
    console.error('Error parsing BibTeX:', error)
    console.error('Error stack:', (error as Error).stack)
    return []
  }
}

// 清理BibTeX字符串，移除花括号和多余空格
function cleanBibTexString(str: string | undefined): string | undefined {
  if (!str || typeof str !== 'string') return undefined
  
  let cleaned = str.trim()
  
  // 移除最外层的花括号（可能有多层嵌套）
  while (cleaned.startsWith('{') && cleaned.endsWith('}') && cleaned.length > 2) {
    // 检查是否整个字符串被一对花括号包围
    let braceCount = 0
    let isFullyEnclosed = true
    
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === '{') braceCount++
      else if (cleaned[i] === '}') braceCount--
      
      // 如果在字符串中间braceCount变为0，说明不是完全被包围的
      if (braceCount === 0 && i < cleaned.length - 1) {
        isFullyEnclosed = false
        break
      }
    }
    
    if (isFullyEnclosed && braceCount === 0) {
      cleaned = cleaned.slice(1, -1).trim()
    } else {
      break
    }
  }
  
  return cleaned
    .replace(/\s+/g, ' ') // 替换多个空格为单个空格
    .trim()
}

export function bibEntryToPaper(entry: BibEntry): Paper {
  return {
    ...entry,
    id: entry.id || generateId()
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
} 