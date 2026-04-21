/**
 * ============================================================
 * models/Counter.ts — Atomic sequence counter
 * ============================================================
 * Provides race-condition-safe ID generation using MongoDB's
 * findOneAndUpdate + $inc — a single atomic operation that
 * cannot produce duplicate values even under concurrent load.
 *
 * Usage:
 *   const seq = await nextSequence('opt');   // → 5001, 5002, …
 *   const seq = await nextSequence('hz');    // → 101, 102, …
 *
 * Replaces the previous findOne+sort pattern in LogisticsController
 * which had a TOCTOU race: two requests could read the same "latest"
 * document and both generate the same ID before either committed.
 * ============================================================
 */

import { Schema, model, Model } from 'mongoose';

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────

interface ICounter {
  _id:  string;   // counter name, e.g. 'opt' | 'hz'
  seq:  number;   // current sequence value
}

const CounterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  {
    collection: 'counters',
    // No timestamps — this is a tiny housekeeping collection.
    versionKey: false,
  }
);

const Counter: Model<ICounter> = model<ICounter>('Counter', CounterSchema);

// ─────────────────────────────────────────────────────────────
// Public helper
// ─────────────────────────────────────────────────────────────

/**
 * Atomically increments the named counter and returns the NEW value.
 *
 * If the counter document does not exist yet (first ever call),
 * upsert creates it with seq = initialValue before returning.
 *
 * @param name         - Counter key, e.g. 'opt' or 'hz'
 * @param initialValue - Starting value if the counter is new (default 5000)
 */
export async function nextSequence(
  name: string,
  initialValue = 5000,
): Promise<number> {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    {
      new:    true,       // return the post-increment document
      upsert: true,       // create the counter if it doesn't exist
      setDefaultsOnInsert: true,
    }
  ).lean();

  // On upsert the seq starts at 0 then $inc brings it to 1.
  // If seq === 1 this is the first-ever call — seed to initialValue.
  if (doc!.seq === 1) {
    await Counter.updateOne({ _id: name }, { $set: { seq: initialValue } });
    return initialValue;
  }

  return doc!.seq;
}

export default Counter;
