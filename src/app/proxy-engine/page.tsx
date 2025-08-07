"use client";

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Network, Settings, BarChart3, ListPlus, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout';
import { useEffect, useState } from 'react';
import { startProxy, stopProxy, fetchProxyRules, getProxyStatus } from '@/lib/proxyApi';

type Rule = {
  id: string;
  description: string;
  action: 'Block' | 'Allow' | 'Log' | 'Rate Limit';
  status: 'Active' | 'Inactive';
};

export default function ProxyEnginePage() {
	const { toast } = useToast();
	const [rules, setRules] = useState<Rule[]>([]);
	const [engineStatus, setEngineStatus] = useState<'active' | 'inactive' | 'error'>('inactive');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const initProxyState = async () => {
			try {
				const rulesData = await fetchProxyRules();
				setRules(rulesData);
				const statusData = await getProxyStatus();
				setEngineStatus(statusData.status === 'active' ? 'active' : 'inactive');
			} catch (e) {
				toast({ title: 'Error', description: 'Failed to fetch initial proxy state.', variant: 'destructive'});
				setEngineStatus('error');
			}
		};
		initProxyState();
	}, [toast]);

	const handleStartProxy = async () => {
		setLoading(true);
		try {
			await startProxy();
			setEngineStatus('active');
			toast({ title: 'Proxy Started', description: 'Proxy interception engine is now running.' });
		} catch (e: any) {
			const errorMessage = e.response?.data?.detail || 'An unknown error occurred while starting the proxy.';
			toast({ title: 'Failed to Start Proxy', description: errorMessage, variant: 'destructive' });
		} finally {
			setLoading(false);
		}
	};

	const handleStopProxy = async () => {
		setLoading(true);
		try {
			await stopProxy();
			setEngineStatus('inactive');
			toast({ title: 'Proxy Stopped', description: 'Proxy interception engine has been stopped.' });
		} catch (e: any) {
			const errorMessage = e.response?.data?.detail || 'An unknown error occurred while stopping the proxy.';
			toast({ title: 'Failed to Stop Proxy', description: errorMessage, variant: 'destructive' });
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

	const getStatusColor = () => {
		if (engineStatus === 'active') return 'text-green-400';
		if (engineStatus === 'inactive') return 'text-yellow-400';
		return 'text-red-500';
	}

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
							Engine Status: <span className={getStatusColor()}>{engineStatus.charAt(0).toUpperCase() + engineStatus.slice(1)}</span>
						</CardTitle>
						<CardDescription>
							{engineStatus === 'active' 
								? 'The proxy engine is currently intercepting and analyzing traffic.' 
								: engineStatus === 'inactive'
								? 'The proxy engine is not running.'
								: 'There was an error communicating with the proxy engine.'}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex gap-4">
						<Button onClick={handleStartProxy} disabled={engineStatus === 'active' || loading} variant="default">
							{loading && engineStatus !== 'active' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
							Start Proxy
						</Button>
						<Button onClick={handleStopProxy} disabled={engineStatus !== 'active' || loading} variant="destructive">
							{loading && engineStatus === 'active' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
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
