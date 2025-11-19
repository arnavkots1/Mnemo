import Foundation
import Combine

/// Protocol for storing and retrieving memory entries
protocol MemoryStore {
    /// Add a new memory entry
    func add(_ memory: MemoryEntry) throws
    
    /// Update an existing memory entry
    func update(_ memory: MemoryEntry) throws
    
    /// Retrieve memories for a specific day
    func memories(forDay date: Date) -> [MemoryEntry]
    
    /// Retrieve recent moments (emotional/photo) up to a limit
    func recentMoments(limit: Int) -> [MemoryEntry]
    
    /// Delete all memory entries
    func deleteAll() throws
    
    // Legacy methods for backward compatibility
    /// Save a memory entry (adds or updates)
    func save(_ entry: MemoryEntry) throws
    
    /// Retrieve all memory entries
    func getAllEntries() throws -> [MemoryEntry]
    
    /// Retrieve entries for a specific date
    func getEntries(for date: Date) throws -> [MemoryEntry]
    
    /// Retrieve entries of a specific kind
    func getEntries(kind: MemoryKind) throws -> [MemoryEntry]
    
    /// Delete a specific memory entry
    func delete(_ entry: MemoryEntry) throws
}

/// Simple file-based implementation of MemoryStore
class FileMemoryStore: MemoryStore {
    private let fileURL: URL
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    
    init(fileURL: URL? = nil) {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        self.fileURL = fileURL ?? documentsPath.appendingPathComponent("memories.json")
        
        // Initialize encoder/decoder with date formatting
        encoder.dateEncodingStrategy = .iso8601
        decoder.dateDecodingStrategy = .iso8601
    }
    
    func save(_ entry: MemoryEntry) throws {
        var entries = try getAllEntries()
        
        // Remove existing entry with same ID if present
        entries.removeAll { $0.id == entry.id }
        
        // Add new/updated entry
        entries.append(entry)
        
        // Sort by start time (most recent first)
        entries.sort { $0.startTime > $1.startTime }
        
        // Write to file
        let data = try encoder.encode(entries)
        try data.write(to: fileURL)
    }
    
    func getAllEntries() throws -> [MemoryEntry] {
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            return []
        }
        
        let data = try Data(contentsOf: fileURL)
        return try decoder.decode([MemoryEntry].self, from: data)
    }
    
    func getEntries(for date: Date) throws -> [MemoryEntry] {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        return try getAllEntries().filter { entry in
            entry.startTime >= startOfDay && entry.startTime < endOfDay
        }
    }
    
    func getEntries(kind: MemoryKind) throws -> [MemoryEntry] {
        return try getAllEntries().filter { $0.kind == kind }
    }
    
    func delete(_ entry: MemoryEntry) throws {
        var entries = try getAllEntries()
        entries.removeAll { $0.id == entry.id }
        
        let data = try encoder.encode(entries)
        try data.write(to: fileURL)
    }
    
    func deleteAll() throws {
        if FileManager.default.fileExists(atPath: fileURL.path) {
            try FileManager.default.removeItem(at: fileURL)
        }
    }
    
    // MARK: - New Protocol Methods
    
    func add(_ memory: MemoryEntry) throws {
        var entries = try getAllEntries()
        
        // Check if memory with same ID already exists
        guard !entries.contains(where: { $0.id == memory.id }) else {
            throw MemoryStoreError.duplicateEntry
        }
        
        entries.append(memory)
        entries.sort { $0.startTime > $1.startTime }
        
        let data = try encoder.encode(entries)
        try data.write(to: fileURL)
    }
    
    func update(_ memory: MemoryEntry) throws {
        var entries = try getAllEntries()
        
        guard let index = entries.firstIndex(where: { $0.id == memory.id }) else {
            throw MemoryStoreError.entryNotFound
        }
        
        entries[index] = memory
        entries.sort { $0.startTime > $1.startTime }
        
        let data = try encoder.encode(entries)
        try data.write(to: fileURL)
    }
    
    func memories(forDay date: Date) -> [MemoryEntry] {
        do {
            return try getEntries(for: date)
        } catch {
            return []
        }
    }
    
    func recentMoments(limit: Int) -> [MemoryEntry] {
        do {
            let allEntries = try getAllEntries()
            let moments = allEntries.filter { entry in
                entry.kind == .emotional || entry.kind == .photo
            }
            return Array(moments.prefix(limit))
        } catch {
            return []
        }
    }
}

// MARK: - Error Types

enum MemoryStoreError: Error {
    case duplicateEntry
    case entryNotFound
}

