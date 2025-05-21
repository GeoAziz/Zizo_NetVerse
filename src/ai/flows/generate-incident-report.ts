
// src/ai/flows/generate-incident-report.ts
'use server';
/**
 * @fileOverview An AI agent for generating cybersecurity incident reports with visualizations and rule suggestions.
 *
 * - generateIncidentReport - A function that generates an incident report.
 * - GenerateIncidentReportInput - The input type for the generateIncidentReport function.
 * - GenerateIncidentReportOutput - The return type for the generateIncidentReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateIncidentReportInputSchema = z.object({
  incidentDescription: z
    .string()
    .describe('A detailed description of the cybersecurity incident.'),
  networkDataSummary: z
    .string()
    .describe(
      'A summary of the network data related to the incident, including relevant statistics and anomalies.'
    ),
  threatIntelData: z
    .string()
    .describe(
      'Threat intelligence data related to the incident, including potential threat actors and their known tactics.'
    ),
  visualizationType: z
    .enum(['network_map', 'threat_timeline', 'geo_distribution'])
    .describe(
      'The type of visualization to generate for the report (network_map, threat_timeline, geo_distribution).'
    ),
});
export type GenerateIncidentReportInput = z.infer<
  typeof GenerateIncidentReportInputSchema
>;

const GenerateIncidentReportOutputSchema = z.object({
  reportTitle: z.string().describe('The title of the generated incident report.'),
  executiveSummary: z
    .string()
    .describe('A concise executive summary of the incident.'),
  detailedAnalysis: z
    .string()
    .describe('A detailed analysis of the incident, including its impact.'),
  recommendations: z
    .string()
    .describe('Recommendations for mitigating the incident and preventing future occurrences.'),
  visualizationDataUri: z
    .string()
    .describe(
      'A data URI containing the visualization as an image (e.g., a network map or threat timeline).'
    ),
  suggestedRuleImprovements: z
    .array(z.string())
    .describe('Specific, actionable rule improvement suggestions for a proxy/firewall based on the incident analysis. E.g., "Block IP X.X.X.X on port YYYY", "Alert on traffic to domain Z.com".')
});
export type GenerateIncidentReportOutput = z.infer<
  typeof GenerateIncidentReportOutputSchema
>;

export async function generateIncidentReport(
  input: GenerateIncidentReportInput
): Promise<GenerateIncidentReportOutput> {
  return generateIncidentReportFlow(input);
}

const generateIncidentReportPrompt = ai.definePrompt({
  name: 'generateIncidentReportPrompt',
  input: {schema: GenerateIncidentReportInputSchema},
  output: {schema: GenerateIncidentReportOutputSchema},
  prompt: `You are an expert cybersecurity analyst tasked with generating an incident report.

  Based on the provided information, create a comprehensive incident report that includes:

  - A concise report title.
  - An executive summary of the incident.
  - A detailed analysis of the incident, including its impact on the network.
  - Actionable recommendations for mitigating the incident and preventing future occurrences.
  - A visualization that complements the report, such as a network map, threat timeline, or geo-distribution of attacks.
  - 1-2 specific, actionable rule improvement suggestions for a proxy/firewall based on the incident analysis. These should be precise (e.g., "Block outbound TCP connections to IP 123.45.67.89 on port 4444", "Create new rule to monitor and alert on DNS requests for *.maliciousdomain.com").

  Incident Description: {{{incidentDescription}}}
  Network Data Summary: {{{networkDataSummary}}}
  Threat Intelligence Data: {{{threatIntelData}}}
  Visualization Type: {{{visualizationType}}}

  Ensure the report is clear, concise, and provides valuable insights to cybersecurity professionals.
  Also ensure the report output for executiveSummary, detailedAnalysis, and recommendations is in markdown format.
  The suggestedRuleImprovements should be an array of strings.

  Include a visualizationDataUri field, generating an image with a description appropriate for the provided visualization type.
  
  For example, if the visualizationType is network_map, generate a network map visualization.
  If the visualizationType is threat_timeline, generate a threat timeline visualization.
  If the visualizationType is geo_distribution, generate a geo-distribution visualization.
  `, // Ensure proper Handlebars syntax
});

const generateIncidentReportFlow = ai.defineFlow(
  {
    name: 'generateIncidentReportFlow',
    inputSchema: GenerateIncidentReportInputSchema,
    outputSchema: GenerateIncidentReportOutputSchema,
  },
  async input => {
    const {output} = await generateIncidentReportPrompt(input);

    // Generate the visualization based on the visualization type
    const visualizationPrompt =
      'Generate an image of a ' + input.visualizationType;

    const {media} = await ai.generate({
      // IMPORTANT: ONLY the googleai/gemini-2.0-flash-exp model is able to generate images. You MUST use exactly this model to generate images.
      model: 'googleai/gemini-2.0-flash-exp',

      // simple prompt
      prompt: visualizationPrompt,

      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });
    return {
      ...output!,
      visualizationDataUri: media.url,
    };
  }
);

