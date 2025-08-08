import { loadCollection, saveCollection, generateId, withCreateTimestamps, withUpdateTimestamp } from './storage'

export function getAll<T>(key: string): T[] {
  return loadCollection<T>(key)
}

export function getById<T extends { id: string }>(key: string, id: string): T | undefined {
  const items = getAll<T>(key)
  return items.find(item => item.id === id)
}

export function create<T extends { id?: string }>(
  key: string, 
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): T {
  const items = getAll<T>(key)
  const newItem = withCreateTimestamps({
    ...data,
    id: generateId()
  }) as T
  
  items.push(newItem)
  saveCollection(key, items)
  return newItem
}

export function update<T extends { id: string }>(
  key: string, 
  id: string, 
  updates: Partial<Omit<T, 'id' | 'createdAt'>>
): T {
  const items = getAll<T>(key)
  const index = items.findIndex(item => item.id === id)
  
  if (index === -1) {
    throw new Error(`Item with id "${id}" not found`)
  }
  
  const updatedItem = withUpdateTimestamp({
    ...items[index],
    ...updates
  }) as T
  
  items[index] = updatedItem
  saveCollection(key, items)
  return updatedItem
}

export function remove(key: string, id: string): void {
  const items = getAll(key)
  const filteredItems = items.filter(item => item.id !== id)
  
  if (filteredItems.length === items.length) {
    throw new Error(`Item with id "${id}" not found`)
  }
  
  saveCollection(key, filteredItems)
}

export function clear(key: string): void {
  saveCollection(key, [])
}