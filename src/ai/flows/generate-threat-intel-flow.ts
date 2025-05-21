
'use server';
/**
 * @fileOverview An AI agent for generating mock threat intelligence data.
 *
 * - generateThreatIntel - A function that generates a list of threat intelligence entries.
 * - GenerateThreatIntelInput - The input type for the generateThreatIntel function.
 * - GenerateThreatIntelOutput - The return type for the generateThreatIntel function (an array of threats).
 * - ThreatIntelEntry - The type for a single threat intelligence entry.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ThreatIntelEntrySchema = z.object({
  id: z.string().describe('A unique UUID for the threat entry.'),
  name: z.string().describe('The name or title of the threat (e.g., "KryllWorm Variant X", "Operation PhantomPhish"). Should sound technical and plausible for cybersecurity.'),
  severity: z.enum(['Critical', 'High', 'Medium', 'Low', 'Informational']).describe('The severity level of the threat.'),
  type: z.enum(['Malware', 'Phishing', 'DDoS', 'SQLi', 'RCE', 'Zero-day']).describe('The type of threat.'),
  status: z.enum(['Active', 'Mitigated', 'Investigating']).describe('The current status of the threat.'),
  description: z.string().describe('A detailed description of the threat, its characteristics, and potential impact. Should be 2-3 sentences.'),
  firstSeen: z.string().datetime().describe('The timestamp (ISO 8601 format) when the threat was first observed. Should be a plausible recent date.'),
  lastSeen: z.string().datetime().describe('The timestamp (ISO 8601 format) when the threat was last observed. Should be after firstSeen and a plausible recent date.'),
  affectedSystems: z.number().int().min(0).describe('The number of systems affected by this threat.'),
  aiVerdict: z.string().optional().describe('A brief, AI-generated analysis or verdict on the threat. (e.g., "AI detected anomalous C2 communication patterns."). Keep it concise.'),
  recommendation: z.string().optional().describe('A brief, actionable recommendation for this threat. (e.g., "Deploy patch for CVE-XXXX. Enhance EDR monitoring."). Keep it concise.'),
  genomeSignature: z.string().optional().describe('A fictional, catchy "genome signature" or codename for the threat (e.g., "Kryll-X-Sig-A7B3", "PhishAPT-C4D9").')
});
export type ThreatIntelEntry = z.infer<typeof ThreatIntelEntrySchema>;

const GenerateThreatIntelInputSchema = z.object({
  count: z.number().int().min(1).max(10).default(5).describe('The number of threat intelligence entries to generate.'),
  locale: z.string().optional().default('en').describe('The locale for the generated content (e.g., "en", "zh-TW"). Defaults to "en".')
});
export type GenerateThreatIntelInput = z.infer<typeof GenerateThreatIntelInputSchema>;

// The prompt will output an object containing an array of threats.
const GenerateThreatIntelOutputSchema = z.object({
  threats: z.array(ThreatIntelEntrySchema).describe('An array of generated threat intelligence entries.')
});
export type GenerateThreatIntelOutput = z.infer<typeof GenerateThreatIntelOutputSchema>;

export async function generateThreatIntel(input: GenerateThreatIntelInput): Promise<GenerateThreatIntelOutput> {
  return generateThreatIntelFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateThreatIntelPrompt',
  input: {schema: GenerateThreatIntelInputSchema},
  output: {schema: GenerateThreatIntelOutputSchema},
  prompt: `You are a cybersecurity threat intelligence analyst. Your task is to generate a list of {{count}} realistic and diverse mock threat intelligence entries.
Each entry should be distinct and plausible.
For names and descriptions, aim for a technical and slightly sci-fi tone suitable for a cybersecurity platform called "NetSense".
Generate unique UUIDs for each threat ID.
Ensure 'firstSeen' and 'lastSeen' dates are recent and logical (lastSeen after firstSeen).
The content should be in {{locale}}.

Generate an object containing a 'threats' array, where the array has {{count}} threat entries.
`,
});

const generateThreatIntelFlow = ai.defineFlow(
  {
    name: 'generateThreatIntelFlow',
    inputSchema: GenerateThreatIntelInputSchema,
    outputSchema: GenerateThreatIntelOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
