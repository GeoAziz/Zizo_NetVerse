"use client";

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Network, ToggleLeft, BarChart, Database, Settings, ShieldCheck, BarChart3, FileText, ListPlus } from 'lucide-react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout'; // Import AppLayout
import { useEffect, useState } from 'react';
import { startProxy, stopProxy, fetchProxyRules, getProxyStatus } from '@/lib/proxyApi';

const mockRules = [
	{ id: 'RULE-001', description: 'Block known C&C server IPs (ThreatFeed-A)', action: 'Block', status: 'Active' },
	{ id: 'RULE-002', description: 'Allow outbound HTTPS on port 443 for finance dept', action: 'Allow', status: 'Active' },
	{ id: 'RULE-003', description: 'Log all DNS requests to *.internal.local (Audit)', action: 'Log', status: 'Inactive' },
	{ id: 'RULE-004', description: 'Rate limit connections to /login endpoint', action: 'Rate Limit', status: 'Active' },
];

export default function ProxyEnginePage() {
	const { toast } = useToast();
	const [rules, setRules] = useState<typeof mockRules>([]);
	const [engineStatus, setEngineStatus] = useState<'active' | 'inactive' | 'error'>('inactive');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		fetchProxyRules().then(setRules);
		getProxyStatus().then((res) => setEngineStatus(res.status === 'active' ? 'active' : 'inactive'));
	}, []);

	const handleStartProxy = async () => {
		setLoading(true);
		try {
			await startProxy();
			setEngineStatus('active');
			toast({ title: 'Proxy Started', description: 'Proxy engine is now running.' });
		} catch (e: any) {
			toast({ title: 'Failed to Start Proxy', description: e?.message || 'Unknown error', variant: 'destructive' });
		} finally {
			setLoading(false);
		}
	};

	const handleStopProxy = async () => {
		setLoading(true);
		try {
			await stopProxy();
			setEngineStatus('inactive');
			toast({ title: 'Proxy Stopped', description: 'Proxy engine has been stopped.' });
		} catch (e: any) {
			toast({ title: 'Failed to Stop Proxy', description: e?.message || 'Unknown error', variant: 'destructive' });
		} finally {
			setLoading(false);
		}
	};

	const handleAddNewRule = () => {
		toast({
			title: "Feature Coming Soon!",
			description: "The rule editor and rule creation functionality will be implemented in a future update.",
			variant: "default",
		});
	};

	return (
		<AppLayout>
			<div>
				<PageHeader
					title="Proxy Interception Engine"
					description="Status, configuration, and real-time metrics for the traffic interception module."
					icon={Network}
				/>
				<Card className="shadow-xl mb-6">
					<CardHeader>
						<CardTitle>
							Engine Status: {engineStatus === 'active' ? (
								<span className="text-green-400">Active & Nominal</span>
							) : (
								<span className="text-red-400">Inactive</span>
							)}
						</CardTitle>
						<CardDescription>
							The proxy engine is currently {engineStatus === 'active' ? 'intercepting and analyzing HTTP/S, TCP, and WebSocket traffic.' : 'not running.'}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex gap-4">
						<Button onClick={handleStartProxy} disabled={engineStatus === 'active' || loading} variant="default">
							Start Proxy
						</Button>
						<Button onClick={handleStopProxy} disabled={engineStatus !== 'active' || loading} variant="destructive">
							Stop Proxy
						</Button>
					</CardContent>
				</Card>

				<div className="grid lg:grid-cols-2 gap-6">
					<Card className="shadow-lg">
						<CardHeader>
							<CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5 text-accent"/>Rule Management & Configuration</CardTitle>
							<CardDescription>Define and manage interception rules, policies, and engine settings.</CardDescription>
						</CardHeader>
						<CardContent className="p-6 space-y-4">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[100px]">ID</TableHead>
										<TableHead>Description</TableHead>
										<TableHead className="w-[100px]">Action</TableHead>
										<TableHead className="w-[100px] text-right">Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{rules.map((rule) => (
										<TableRow key={rule.id}>
											<TableCell className="font-mono text-xs">{rule.id}</TableCell>
											<TableCell className="text-sm">{rule.description}</TableCell>
											<TableCell>
												<Badge
													variant={rule.action === 'Block' ? 'destructive' : rule.action === 'Allow' ? 'default' : 'secondary'}
													className={rule.action === 'Allow' ? 'bg-green-600/80 hover:bg-green-700/80 text-green-100' : ''}
												>
													{rule.action}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<Badge variant={rule.status === 'Active' ? 'default' : 'outline'}
												className={rule.status === 'Active' ? 'bg-primary/80' : 'border-muted-foreground/50 text-muted-foreground'}
												>
													{rule.status}
												</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							<Button variant="outline" onClick={handleAddNewRule} className="w-full sm:w-auto">
								<ListPlus className="mr-2 h-4 w-4"/> Add New Rule
							</Button>
						</CardContent>
					</Card>

					<Card className="shadow-lg">
						<CardHeader>
							<CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-accent"/>Live Performance Metrics</CardTitle>
							<CardDescription>Monitor real-time performance, resource usage, and traffic statistics.</CardDescription>
						</CardHeader>
						<CardContent className="text-center p-8 border-2 border-dashed border-border/30 rounded-lg m-6 mt-0 bg-background/30">
							<Image
								src="https://placehold.co/600x300.png"
								alt="Live Metrics UI Placeholder"
								width={600}
								height={300}
								className="opacity-60 rounded-md mx-auto shadow-md"
								data-ai-hint="dashboard charts"
							/>
							<p className="mt-4 text-md text-muted-foreground">
								Future: Real-time charts for CPU/memory, connection rates, and rule hit counts.
							</p>
							<Button variant="outline" className="mt-4">View Live Dashboard (Coming Soon)</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</AppLayout>
	);
}
