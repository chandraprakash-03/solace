import { db } from './db';

export interface SemanticSearchResult {
  id: string;
  content: string;
  category: string;
  similarity: number;
}

export class VectorService {
  /**
   * Saves a new semantic memory with its high-dimensional vector embedding.
   * Utilizes a highly robust 2-step process: standard Prisma insertion followed by a raw SQL vector update.
   */
  static async saveMemory(
    userId: string,
    content: string,
    category: string,
    embedding: number[]
  ): Promise<any> {
    try {
      // Step 1: Create the base memory record using standard Prisma
      const memory = await db.memory.create({
        data: {
          userId,
          content,
          category,
        },
      });

      // Step 2: Write the high-dimensional vector array into the pgvector column using raw SQL
      const vectorString = `[${embedding.join(',')}]`;
      await db.$executeRawUnsafe(
        `UPDATE "Memory" SET embedding = $1::vector WHERE id = $2`,
        vectorString,
        memory.id
      );

      return memory;
    } catch (error) {
      console.error('Error saving memory with embedding:', error);
      throw error;
    }
  }

  /**
   * Performs a native PostgreSQL semantic vector search using pgvector's cosine distance operator (<=>).
   * Returns memories matching the query embedding, ordered by similarity.
   */
  static async searchMemories(
    userId: string,
    queryEmbedding: number[],
    limit = 5,
    minSimilarity = 0.65
  ): Promise<SemanticSearchResult[]> {
    try {
      const vectorString = `[${queryEmbedding.join(',')}]`;

      // We run a raw SQL query using cosine distance (similarity = 1 - cosine_distance)
      const results = await db.$queryRawUnsafe<any[]>(
        `SELECT id, content, category, (1 - (embedding <=> $1::vector)) AS similarity 
         FROM "Memory" 
         WHERE "userId" = $2 
         ORDER BY embedding <=> $1::vector 
         LIMIT $3`,
        vectorString,
        userId,
        limit
      );

      // Parse and filter the results by minimum similarity threshold
      return results
        .map((r) => ({
          id: r.id,
          content: r.content,
          category: r.category,
          similarity: Number(r.similarity || 0),
        }))
        .filter((r) => r.similarity >= minSimilarity);
    } catch (error) {
      console.error('Error searching memories:', error);
      // Return empty array instead of crashing, preserving conversational flow in case of DB hiccups
      return [];
    }
  }
}
