import { describe, expect, test } from 'vitest'
import { createCorpusArchive } from '../corpus/archive/corpusArchive.ts'
import { doc } from '../corpus/index/corpusIndex.test.ts'
import { createCorpusIndex } from '../corpus/index/corpusIndex.ts'
import { embeddingsSearch, embedTextInThisScope, similarity } from './embeddings.ts'

describe('embeddingsSearch', () => {
    test('finds matches', async () => {
        expect(
            await embeddingsSearch(
                await createCorpusIndex(await createCorpusArchive([doc(1, 'xxxxxx'), doc(2, 'b')])),
                {
                    text: 'b',
                }
            )
        ).toEqual([
            { doc: 2, chunk: 0, score: 1, excerpt: 'b' },
            { doc: 1, chunk: 0, score: 0.23823869524750682, excerpt: 'xxxxxx' },
        ])
    })
})

describe('embedText', () => {
    test('embeds', async () => {
        const s = await embedTextInThisScope('hello world')
        expect(s).toBeInstanceOf(Float32Array)
    })
})

describe('similarity', () => {
    test('works', async () => {
        expect(await similarity('what is the current time', 'what time is it')).toBeCloseTo(0.7217, 4)
        expect(await similarity('hello world', 'seafood')).toBeCloseTo(0.2025, 4)
    })
})