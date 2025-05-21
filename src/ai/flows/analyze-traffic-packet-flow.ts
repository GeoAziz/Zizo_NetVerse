
'use server';
/**
 * @fileOverview An AI agent for analyzing network traffic packets.
 *
 * - analyzeTrafficPacket - A function that analyzes a traffic packet.
 * - AnalyzeTrafficPacketInput - The input type for the analyzeTrafficPacket function.
 * - AnalyzeTrafficPacketOutput - The return type for the analyzeTrafficPacket function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTrafficPacketInputSchema = z.object({
  protocol: z.string().describe('The network protocol (e.g., HTTP, TCP, DNS).'),
  sourceIp: z.string().describe('The source IP address.'),
  sourcePort: z.number().describe('The source port number.'),
  destIp: z.string().describe('The destination IP address.'),
  destPort: z.number().describe('The destination port number.'),
  summary: z.string().describe('A brief summary or description of the packet/log entry.'),
  payloadExcerpt: z.string().optional().describe('An excerpt of the packet payload, if available.'),
  action: z.string().describe('The action taken on the packet (e.g., Allowed, Blocked).')
});
export type AnalyzeTrafficPacketInput = z.infer<typeof AnalyzeTrafficPacketInputSchema>;

const AnalyzeTrafficPacketOutputSchema = z.object({
  isSuspicious: z.boolean().describe('Whether the AI deems the packet suspicious.'),
  suspicionReason: z.string().describe('A detailed explanation if the packet is suspicious, or a confirmation of normalcy if not.'),
  severity: z.enum(['Informational', 'Low', 'Medium', 'High', 'Critical']).describe('The assessed severity level if suspicious, or Informational if not.'),
  suggestedActions: z.array(z.string()).describe('A list of suggested actions or investigation steps.'),
  confidenceScore: z.number().min(0).max(1).describe('The AI model\'s confidence in its assessment (0.0 to 1.0).')
});
export type AnalyzeTrafficPacketOutput = z.infer<typeof AnalyzeTrafficPacketOutputSchema>;

export async function analyzeTrafficPacket(input: AnalyzeTrafficPacketInput): Promise<AnalyzeTrafficPacketOutput> {
  return analyzeTrafficPacketFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTrafficPacketPrompt',
  input: {schema: AnalyzeTrafficPacketInputSchema},
  output: {schema: AnalyzeTrafficPacketOutputSchema},
  prompt: `You are an expert network security analyst. Analyze the following network traffic packet data:

Protocol: {{{protocol}}}
Source IP: {{{sourceIp}}}:{{{sourcePort}}}
Destination IP: {{{destIp}}}:{{{destPort}}}
Summary: {{{summary}}}
Action Taken: {{{action}}}
{{#if payloadExcerpt}}Payload Excerpt: {{{payloadExcerpt}}}{{/if}}

Based on this information:
1.  Determine if the packet is suspicious.
2.  Provide a clear reason for your assessment (isSuspicious and suspicionReason).
3.  Assign a severity level (Informational, Low, Medium, High, Critical). If not suspicious, use Informational.
4.  Suggest 2-3 actionable steps for further investigation or mitigation if suspicious, or standard logging/monitoring if not (suggestedActions).
5.  Provide a confidence score (0.0 to 1.0) for your overall assessment.

Focus on identifying common attack patterns, anomalies, policy violations, or indicators of compromise. Consider the protocol, ports, IPs (e.g., known malicious, internal/external), and any payload content.
For example, unexpected protocols on standard ports, connections to known C&C servers, or suspicious payloads should be flagged.
If action was 'Blocked', explain if the block was justified based on your analysis.
`,
});

const analyzeTrafficPacketFlow = ai.defineFlow(
  {
    name: 'analyzeTrafficPacketFlow',
    inputSchema: AnalyzeTrafficPacketInputSchema,
    outputSchema: AnalyzeTrafficPacketOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
