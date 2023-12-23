import { type CorpusIndex, type CorpusSearchResult } from '..'
import { scopedCache, type CorpusCache } from '../cache/cache'
import { type ChunkIndex } from '../doc/chunks'
import { type DocID } from '../doc/doc'
import { embeddingsSearch } from './embeddings'
import { keywordSearch } from './keyword'

/**
 * Search using multiple search methods.
 */
export async function multiSearch(
    index: CorpusIndex,
    query: string,
    cache: CorpusCache
): Promise<CorpusSearchResult[]> {
    const allResults = (
        await Promise.all(
            Object.entries(SEARCH_METHODS).map(([name, searchFn]) => searchFn(index, query, scopedCache(cache, name)))
        )
    ).flat()

    // Sum scores for each chunk.
    const combinedResults = new Map<DocID, Map<ChunkIndex, CorpusSearchResult>>()
    for (const result of allResults) {
        let docResults = combinedResults.get(result.doc)
        if (!docResults) {
            docResults = new Map<ChunkIndex, CorpusSearchResult>()
            combinedResults.set(result.doc, docResults)
        }

        const chunkResult = docResults.get(result.chunk) ?? {
            doc: result.doc,
            chunk: result.chunk,
            score: 0,
            excerpt: result.excerpt,
        }
        docResults.set(result.chunk, { ...chunkResult, score: chunkResult.score + result.score })
    }

    const results = Array.from(combinedResults.values()).flatMap(docResults => Array.from(docResults.values()))
    return results.toSorted((a, b) => b.score - a.score)
}

const SEARCH_METHODS: Record<
    string,
    (index: CorpusIndex, query: string, cache: CorpusCache) => CorpusSearchResult[] | Promise<CorpusSearchResult[]>
> = { keywordSearch, embeddingsSearch }