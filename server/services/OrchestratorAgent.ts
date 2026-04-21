/**
 * ============================================================
 * OrchestratorAgent.ts
 * ============================================================
 * The central intelligence of Meridian.
 *
 * Responsibility: Given a live shipment and an active hazard,
 * invoke Gemini 1.5 Pro via LangChain to produce a fully
 * structured, Zod-validated rerouting decision.
 *
 * Chain anatomy:
 *   ChatPromptTemplate  →  ChatGoogleGenerativeAI  →  StructuredOutputParser<Zod>
 *
 * The parser enforces the exact JSON contract that our
 * OptimizationLog Mongoose model expects, so the result can
 * be written to MongoDB without any manual massaging.
 * ============================================================
 */

import { ChatGoogleGenerativeAI }      from '@langchain/google-genai';
import { StructuredOutputParser }      from '@langchain/core/output_parsers';
import { ChatPromptTemplate,
         SystemMessagePromptTemplate,
         HumanMessagePromptTemplate }  from '@langchain/core/prompts';
import { RunnableSequence }            from '@langchain/core/runnables';
import { z }                           from 'zod';

// Local model types (used for strong typing on function parameters)
import type { IShipment }   from '../models/Shipment';
import type { IRiskAlert }  from '../models/RiskAlert';

// ─────────────────────────────────────────────────────────────
// 1.  MODEL INITIALIZATION
// ─────────────────────────────────────────────────────────────

/**
 * gemini-2.0-flash at temperature 0.1:
 *
 * Routing decisions must be deterministic and analytical.
 * Low temperature suppresses creative hallucination and keeps
 * numeric outputs (confidence, ETA deltas) tightly reproducible
 * across repeated calls with the same input.
 * Flash is ~3× faster and ~5× cheaper than 1.5-pro with
 * equivalent structured-output quality for this task.
 */
const model = new ChatGoogleGenerativeAI({
  model:       'gemini-2.0-flash',   // faster + cheaper than 1.5-pro; equivalent structured-output quality
  temperature:  0.1,
  apiKey:       process.env.GOOGLE_API_KEY ?? (() => {
    throw new Error('GOOGLE_API_KEY is not set in environment variables');
  })(),
});

// ─────────────────────────────────────────────────────────────
// 2.  ZOD OUTPUT SCHEMA
// ─────────────────────────────────────────────────────────────

/**
 * Every field here maps 1-to-1 with the AI-generated fields
 * in OptimizationLog.ts.  Zod validates the shape before it
 * ever touches the database, so a malformed LLM response
 * throws a parse error rather than inserting garbage.
 *
 * Field-level `.describe()` strings are injected into the prompt
 * as format_instructions, so Gemini understands the contract
 * it must satisfy.
 */
const OrchestratorOutputSchema = z.object({

  // ── Decision ─────────────────────────────────────────────

  /**
   * Which of the evaluated alternate routes was selected.
   * Use a short descriptive label, e.g. "ALT-A (via DXB)" or
   * "Northern arc via ANC".
   */
  selectedAlternate: z
    .string()
    .min(1)
    .describe(
      'Short label for the chosen alternate route, e.g. "ALT-A (via DXB)"'
    ),

  /**
   * 0.0 → 1.0.  Reflects how certain the model is that this
   * reroute is optimal given the data provided.
   *   ≥ 0.85  → AUTO_APPROVED
   *   0.60–0.84 → REQUIRES_HUMAN_SIGNOFF
   *   < 0.60  → REQUIRES_HUMAN_SIGNOFF (high uncertainty)
   */
  confidenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'Confidence in the selected reroute, from 0.0 (no confidence) to 1.0 (certain). ' +
      'Drives the auto-approve gate: ≥ 0.85 triggers AUTO_APPROVED.'
    ),

  /**
   * Chain-of-thought explanation.  Should name the specific
   * factors (weather severity, fuel delta, cold-chain risk, etc.)
   * that drove the decision.  Written for a human operator to read.
   */
  aiReasoning: z
    .string()
    .min(20)
    .describe(
      'Plain-English explanation of why this alternate was chosen over the others. ' +
      'Cite specific risk factors, cost trade-offs, and cargo sensitivity.'
    ),

  // ── Proposed route ────────────────────────────────────────

  /**
   * GeoJSON LineString representing the proposed new path.
   * Each coordinate pair is [longitude, latitude].
   * Must have at least 2 waypoints (origin + destination).
   * Include intermediate hub waypoints for realistic routing.
   */
  proposedRoute: z
    .object({
      type: z
        .literal('LineString')
        .describe('Must be the exact string "LineString"'),
      coordinates: z
        .array(z.tuple([z.number(), z.number()]))
        .min(2)
        .describe(
          'Ordered array of [longitude, latitude] pairs defining the new route. ' +
          'Longitude range: -180 to 180. Latitude range: -90 to 90.'
        ),
    })
    .describe('GeoJSON LineString for the proposed reroute path'),

  // ── ETA metrics ───────────────────────────────────────────

  /**
   * Original ETA in decimal hours from the time of this analysis.
   * e.g. 14.83 means 14 hours and ~50 minutes.
   */
  originalETA_h: z
    .number()
    .min(0)
    .describe('Original estimated travel time in decimal hours'),

  /**
   * Proposed ETA in decimal hours if the reroute is executed.
   */
  proposedETA_h: z
    .number()
    .min(0)
    .describe('New estimated travel time in decimal hours if reroute is executed'),

  /**
   * Difference in minutes: positive = reroute adds delay,
   * negative = reroute is faster.
   * Formula: (proposedETA_h - originalETA_h) * 60.
   */
  timeSavedMinutes: z
    .number()
    .describe(
      'Delta in minutes between proposed and original ETA. ' +
      'Negative means the reroute is faster; positive means added delay offset by avoided risk.'
    ),

  /**
   * Estimated USD value of cargo damage / spoilage avoided.
   * Set to 0 if not applicable (non-perishable cargo).
   */
  spoilageAvoided_usd: z
    .number()
    .min(0)
    .default(0)
    .describe(
      'Estimated USD value of cargo loss avoided by taking this reroute. ' +
      'Use 0 for non-perishable cargo.'
    ),

  /**
   * Fuel cost impact as a percentage of the baseline route.
   * e.g. 2.8 means the reroute uses 2.8% more fuel.
   * Negative = fuel saving.
   */
  fuelDeltaPct: z
    .number()
    .default(0)
    .describe(
      'Fuel consumption delta as a percentage vs. the original route. ' +
      'Positive = more fuel; negative = less fuel.'
    ),

  // ── Action gate ───────────────────────────────────────────

  /**
   * The decision gate output.
   *   AUTO_APPROVED          → confidenceScore ≥ 0.85 AND cargo is non-critical
   *   REQUIRES_HUMAN_SIGNOFF → confidenceScore < 0.85 OR cargo is pharma / live / high-value
   */
  action: z
    .enum(['AUTO_APPROVED', 'REQUIRES_HUMAN_SIGNOFF'])
    .describe(
      'Set to AUTO_APPROVED only if confidenceScore ≥ 0.85 AND cargo risk class is non-critical. ' +
      'All pharma, live-animal, or high-value (>$500k) cargo MUST use REQUIRES_HUMAN_SIGNOFF.'
    ),
});

/** TypeScript type inferred from the Zod schema */
export type OrchestratorOutput = z.infer<typeof OrchestratorOutputSchema>;

// ─────────────────────────────────────────────────────────────
// 3.  STRUCTURED OUTPUT PARSER
// ─────────────────────────────────────────────────────────────

const parser = StructuredOutputParser.fromZodSchema(OrchestratorOutputSchema);

// ─────────────────────────────────────────────────────────────
// 4.  PROMPT TEMPLATE
// ─────────────────────────────────────────────────────────────

/**
 * We use a two-message ChatPromptTemplate:
 *
 *  SYSTEM — establishes the agent's role, operational constraints,
 *           and injects the Zod-derived format_instructions so
 *           Gemini knows the exact JSON shape it must produce.
 *
 *  HUMAN  — carries the live runtime data: serialized shipment
 *           and hazard documents from MongoDB.
 *
 * Variables:
 *   {format_instructions}  → injected automatically via .partial()
 *   {shipmentData}         → JSON.stringify of the IShipment doc
 *   {hazardData}           → JSON.stringify of the IRiskAlert doc
 */
const SYSTEM_TEMPLATE = `
You are Meridian's Orchestrator Agent — an expert predictive logistics AI
responsible for protecting global supply chains from disruptions.

Your analytical mandate:
  1. Receive a live shipment and an active hazard that intersects its route.
  2. Evaluate the risk to cargo, timeline, and cost.
  3. Propose the single best alternate route from the available options you
     reason about (consider geographic detours, intermediate hub cities, and
     oceanic routing adjustments).
  4. Produce a machine-readable rerouting decision in strict JSON.

Operational constraints you MUST respect:
  - Prefer alternate routes where the intersection risk probability is < 0.15.
  - Penalise delay at $1,200 USD per hour for refrigerated or pharma cargo.
  - Penalise delay at $400 USD per hour for standard cargo.
  - If the cargo description contains "pharma", "refrigerat", "medical",
    "live", or "cold-chain", set action = REQUIRES_HUMAN_SIGNOFF regardless
    of confidence score.
  - Only set action = AUTO_APPROVED when confidenceScore >= 0.85 AND cargo
    is NOT in a critical class (see above).
  - Produce at least 3 intermediate waypoints in the proposedRoute coordinates
    for any intercontinental reroute.
  - Do NOT hallucinate data not present in the input. If you cannot compute
    a precise figure, use your best conservative estimate and lower the
    confidenceScore accordingly.

Output format — you MUST return ONLY the JSON object described below,
with no markdown fences, no commentary, no preamble:

{format_instructions}
`.trim();

const HUMAN_TEMPLATE = `
## LIVE SHIPMENT DATA
\`\`\`json
{shipmentData}
\`\`\`

## ACTIVE HAZARD DATA
\`\`\`json
{hazardData}
\`\`\`

Evaluate the intersection. Reason about the best alternate route.
Return your decision as strict JSON matching the schema above.
`.trim();

/**
 * Prompt template — format_instructions are NOT pre-filled here
 * because ChatPromptTemplate.partial() returns a Promise in this
 * LangChain version, which cannot be placed directly inside
 * RunnableSequence.from([]).  Instead we inject format_instructions
 * at invoke() time (see evaluateReroute below).
 */
const prompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(SYSTEM_TEMPLATE),
  HumanMessagePromptTemplate.fromTemplate(HUMAN_TEMPLATE),
]);

// ─────────────────────────────────────────────────────────────
// 5.  LCEL CHAIN
// ─────────────────────────────────────────────────────────────

/**
 * pipe: prompt → model → parser
 *
 * RunnableSequence makes the data-flow explicit and gives us
 * typed inputs/outputs at every stage.
 */
const chain = RunnableSequence.from([
  prompt,
  model,
  parser,
]);

// ─────────────────────────────────────────────────────────────
// 6.  PUBLIC API
// ─────────────────────────────────────────────────────────────

/**
 * Subset of IShipment fields we send to Gemini.
 * We strip Mongoose internals (_id, __v, timestamps) to keep
 * the token count lean and avoid confusing the model.
 */
interface ShipmentContext {
  trackingId:       string;
  cargoDescription: string;
  weightTonnes:     number;
  fromCode:         string;
  toCode:           string;
  origin:           IShipment['origin'];
  destination:      IShipment['destination'];
  currentLocation:  IShipment['currentLocation'];
  activeRoute:      IShipment['activeRoute'];
  progress:         number;
  status:           string;
  eta:              IShipment['eta'];
}

/** Subset of IRiskAlert fields we send to Gemini */
interface HazardContext {
  alertId:          string;
  agentSource:      string;
  severity:         string;
  title:            string;
  description:      string;
  hazardZone:       IRiskAlert['hazardZone'];
  isActive:         boolean;
  expectedClearanceAt: Date | null;
}

/** Full typed return from evaluateReroute */
export interface RerouteDecision extends OrchestratorOutput {
  /** ISO-8601 timestamp of when Gemini produced this response */
  generatedAt: string;
}

/**
 * evaluateReroute
 * ───────────────
 * The single public entry-point for the Orchestrator Agent.
 *
 * Usage (from your Express route handler):
 * ```ts
 * const decision = await evaluateReroute(shipment, riskAlert);
 * // decision is fully typed as RerouteDecision — write it to MongoDB.
 * ```
 *
 * @param shipment  - Full IShipment document from MongoDB
 * @param hazard    - Full IRiskAlert document from MongoDB
 * @returns         - Zod-validated, strictly typed rerouting decision
 * @throws          - OrchestratorError on LLM or parse failure
 */
export async function evaluateReroute(
  shipment: IShipment,
  hazard:   IRiskAlert,
): Promise<RerouteDecision> {

  // ── Serialize only what the model needs ─────────────────
  const shipmentContext: ShipmentContext = {
    trackingId:       shipment.trackingId,
    cargoDescription: shipment.cargoDescription,
    weightTonnes:     shipment.weightTonnes,
    fromCode:         shipment.fromCode,
    toCode:           shipment.toCode,
    origin:           shipment.origin,
    destination:      shipment.destination,
    currentLocation:  shipment.currentLocation,
    activeRoute:      shipment.activeRoute,
    progress:         shipment.progress,
    status:           shipment.status,
    eta:              shipment.eta,
  };

  const hazardContext: HazardContext = {
    alertId:             hazard.alertId,
    agentSource:         hazard.agentSource,
    severity:            hazard.severity,
    title:               hazard.title,
    description:         hazard.description,
    hazardZone:          hazard.hazardZone,
    isActive:            hazard.isActive,
    expectedClearanceAt: hazard.expectedClearanceAt,
  };

  // ── Primary attempt ──────────────────────────────────────
  try {
    const result = await chain.invoke({
      shipmentData:        JSON.stringify(shipmentContext, null, 2),
      hazardData:          JSON.stringify(hazardContext,   null, 2),
      format_instructions: parser.getFormatInstructions(),
    });

    return {
      ...result,
      generatedAt: new Date().toISOString(),
    };

  } catch (primaryError) {
    // ── Retry once with an explicit JSON extraction nudge ──
    // Gemini occasionally wraps output in markdown fences despite
    // instructions. We strip those and attempt a manual parse
    // before giving up entirely.
    console.warn(
      '[OrchestratorAgent] Primary parse failed — attempting JSON extraction retry.',
      primaryError instanceof Error ? primaryError.message : primaryError,
    );

    try {
      const rawResponse = await model.invoke(
        await prompt.formatMessages({
          shipmentData:        JSON.stringify(shipmentContext, null, 2),
          hazardData:          JSON.stringify(hazardContext,   null, 2),
          format_instructions: parser.getFormatInstructions(),
        }),
      );

      // Extract the raw text from the model response
      const rawText = typeof rawResponse.content === 'string'
        ? rawResponse.content
        : (rawResponse.content as Array<{ type: string; text?: string }>)
            .filter(b => b.type === 'text')
            .map(b => b.text ?? '')
            .join('');

      // Strip markdown fences: ```json ... ``` or ``` ... ```
      const stripped = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();

      // Parse and validate through Zod manually
      const parsed = OrchestratorOutputSchema.parse(JSON.parse(stripped));

      return {
        ...parsed,
        generatedAt: new Date().toISOString(),
      };

    } catch (retryError) {
      // Both attempts failed — surface a rich error for the caller
      throw new OrchestratorError(
        `Gemini failed to produce a valid rerouting decision after 2 attempts.\n` +
        `Shipment: ${shipment.trackingId} | Hazard: ${hazard.alertId}`,
        primaryError instanceof Error ? primaryError : new Error(String(primaryError)),
        retryError   instanceof Error ? retryError   : new Error(String(retryError)),
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 7.  CUSTOM ERROR CLASS
// ─────────────────────────────────────────────────────────────

/**
 * OrchestratorError
 * ─────────────────
 * Thrown when the agent chain fails after all retries.
 * Carries both the primary and retry errors so the caller
 * (or a logging middleware) can inspect the full failure chain.
 */
export class OrchestratorError extends Error {
  public readonly primaryError:  Error;
  public readonly retryError:    Error;
  public readonly timestamp:     string;

  constructor(message: string, primaryError: Error, retryError: Error) {
    super(message);
    this.name         = 'OrchestratorError';
    this.primaryError = primaryError;
    this.retryError   = retryError;
    this.timestamp    = new Date().toISOString();

    // Maintains correct prototype chain for `instanceof` checks
    Object.setPrototypeOf(this, OrchestratorError.prototype);
  }
}
