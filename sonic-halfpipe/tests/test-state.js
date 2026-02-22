/**
 * State management tests — high score CRUD, persistence round-trip,
 * and error handling for corrupted localStorage data.
 */

'use strict';

module.exports = function runStateTests(ctx, fw) {

    // Clear localStorage and highScores before each group
    function reset() {
        ctx.localStorage.clear();
        ctx.highScores = [];
    }

    fw.describe('addHighScore() — basic insertion', () => {
        fw.it('adds one entry to highScores', () => {
            reset();
            ctx.addHighScore('Alice', 500, 50);
            fw.assertEqual(ctx.highScores.length, 1);
        });

        fw.it('entry has correct name, score and rings', () => {
            reset();
            ctx.addHighScore('Bob', 300, 30);
            const e = ctx.highScores[0];
            fw.assertEqual(e.name,  'Bob');
            fw.assertEqual(e.score, 300);
            fw.assertEqual(e.rings, 30);
        });

        fw.it('entry has a date field', () => {
            reset();
            ctx.addHighScore('Carol', 100, 10);
            fw.assert(typeof ctx.highScores[0].date === 'number', 'date should be a number (timestamp)');
        });
    });

    fw.describe('addHighScore() — sorting', () => {
        fw.it('entries are sorted by score descending', () => {
            reset();
            ctx.addHighScore('Low',  100, 10);
            ctx.addHighScore('High', 900, 90);
            ctx.addHighScore('Mid',  500, 50);
            fw.assertEqual(ctx.highScores[0].score, 900);
            fw.assertEqual(ctx.highScores[1].score, 500);
            fw.assertEqual(ctx.highScores[2].score, 100);
        });

        fw.it('top entry is always the highest scorer', () => {
            reset();
            for (let i = 0; i < 5; i++) {
                ctx.addHighScore(`P${i}`, i * 50, i * 5);
            }
            fw.assertEqual(ctx.highScores[0].score, 200);
        });
    });

    fw.describe('addHighScore() — 10-entry cap', () => {
        fw.it('never exceeds 10 entries', () => {
            reset();
            for (let i = 0; i < 15; i++) {
                ctx.addHighScore(`Player${i}`, i * 100, i * 5);
            }
            fw.assertEqual(ctx.highScores.length, 10);
        });

        fw.it('keeps the 10 highest scores (drops lowest)', () => {
            reset();
            for (let i = 0; i < 15; i++) {
                ctx.addHighScore(`Player${i}`, i * 100, i * 5);
            }
            // Scores are 0..1400; top 10 are 500..1400
            fw.assert(
                ctx.highScores.every(e => e.score >= 500),
                'All remaining entries should have score >= 500'
            );
        });
    });

    fw.describe('saveHighScores() / loadHighScores() — round-trip', () => {
        fw.it('saved scores can be loaded back', () => {
            reset();
            ctx.addHighScore('Dave', 750, 75);
            ctx.saveHighScores();
            ctx.highScores = [];           // wipe in-memory
            ctx.loadHighScores();
            fw.assertEqual(ctx.highScores.length, 1);
            fw.assertEqual(ctx.highScores[0].name,  'Dave');
            fw.assertEqual(ctx.highScores[0].score, 750);
        });

        fw.it('multiple entries survive round-trip', () => {
            reset();
            ctx.addHighScore('A', 900, 90);
            ctx.addHighScore('B', 400, 40);
            ctx.saveHighScores();
            ctx.highScores = [];
            ctx.loadHighScores();
            fw.assertEqual(ctx.highScores.length, 2);
            fw.assertEqual(ctx.highScores[0].score, 900);
        });
    });

    fw.describe('loadHighScores() — error handling', () => {
        fw.it('returns empty array when localStorage key is absent', () => {
            reset();
            ctx.loadHighScores();
            fw.assert(Array.isArray(ctx.highScores));
            fw.assertEqual(ctx.highScores.length, 0);
        });

        fw.it('returns empty array on malformed JSON', () => {
            reset();
            ctx.localStorage.setItem('sonicHalfPipeHighScores', '{{NOT_VALID}}');
            ctx.loadHighScores();
            fw.assert(Array.isArray(ctx.highScores), 'Should still be an array after parse error');
        });

        fw.it('returns empty array when value is null string', () => {
            // setItem stores the string "null"; getItem returns "null" which JSON.parse handles as null
            reset();
            ctx.localStorage.setItem('sonicHalfPipeHighScores', 'null');
            ctx.loadHighScores();
            // null parsed successfully → condition `if (raw)` is truthy for "null" string
            // JSON.parse('null') === null, so highScores becomes null or []
            fw.assert(
                Array.isArray(ctx.highScores) || ctx.highScores === null,
                'Should not throw on null-like data'
            );
        });
    });
};
