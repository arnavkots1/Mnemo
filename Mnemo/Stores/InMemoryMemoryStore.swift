import Foundation
import Combine

/// In-memory implementation of MemoryStore that conforms to ObservableObject
/// This is useful for SwiftUI views that need to observe changes to the memory store
class InMemoryMemoryStore: MemoryStore, ObservableObject {
    /// Published property for SwiftUI observation
    @Published private(set) var memories: [MemoryEntry] = []
    
    init(initialMemories: [MemoryEntry] = []) {
        self.memories = initialMemories.sorted { $0.startTime > $1.startTime }
    }
    
    // MARK: - MemoryStore Protocol Implementation
    
    func add(_ memory: MemoryEntry) throws {
        // Check if memory with same ID already exists
        guard !memories.contains(where: { $0.id == memory.id }) else {
            throw MemoryStoreError.duplicateEntry
        }
        
        memories.append(memory)
        sortMemories()
        objectWillChange.send()
    }
    
    func update(_ memory: MemoryEntry) throws {
        guard let index = memories.firstIndex(where: { $0.id == memory.id }) else {
            throw MemoryStoreError.entryNotFound
        }
        
        memories[index] = memory
        sortMemories()
        objectWillChange.send()
    }
    
    func memories(forDay date: Date) -> [MemoryEntry] {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        return memories.filter { entry in
            entry.startTime >= startOfDay && entry.startTime < endOfDay
        }
    }
    
    func recentMoments(limit: Int) -> [MemoryEntry] {
        // Filter for emotional and photo moments only
        let moments = memories.filter { entry in
            entry.kind == .emotional || entry.kind == .photo
        }
        
        // Return up to the limit, already sorted by startTime (most recent first)
        return Array(moments.prefix(limit))
    }
    
    func deleteAll() throws {
        memories.removeAll()
        objectWillChange.send()
    }
    
    // MARK: - Legacy Methods for Backward Compatibility
    
    func save(_ entry: MemoryEntry) throws {
        if memories.contains(where: { $0.id == entry.id }) {
            try update(entry)
        } else {
            try add(entry)
        }
    }
    
    func getAllEntries() throws -> [MemoryEntry] {
        return memories
    }
    
    func getEntries(for date: Date) throws -> [MemoryEntry] {
        return memories(forDay: date)
    }
    
    func getEntries(kind: MemoryKind) throws -> [MemoryEntry] {
        return memories.filter { $0.kind == kind }
    }
    
    func delete(_ entry: MemoryEntry) throws {
        guard let index = memories.firstIndex(where: { $0.id == entry.id }) else {
            throw MemoryStoreError.entryNotFound
        }
        
        memories.remove(at: index)
        objectWillChange.send()
    }
    
    // MARK: - Private Helpers
    
    private func sortMemories() {
        memories.sort { $0.startTime > $1.startTime }
    }
}

