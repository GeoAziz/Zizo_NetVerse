
"use client";

import { useState, useEffect } from 'react';
import ThreatCard, { type Threat } from './ThreatCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card'; // Added import
import { Bug, ShieldOff, Bot } from 'lucide-react'; // Example icons

const mockThreats: Threat[] = [
  {
    id: 'threat-001',
    name: 'Kryll웜變異體 (KryllWorm Variant X)',
    severity: 'Critical',
    type: 'Malware',
    status: 'Active',
    description: '高度適應性蠕蟲，利用零日漏洞在內部網絡中橫向移動。能夠竊取憑證並部署勒索軟件組件。',
    firstSeen: '2024-07-15T08:30:00Z',
    lastSeen: '2024-07-20T10:00:00Z',
    affectedSystems: 152,
    aiVerdict: 'AI偵測到異常的網絡釣魚活動和C2通信模式。建議立即隔離受影響的網段。',
    recommendation: '部署針對CVE-2024-XXXX的補丁。增強端點檢測和響應（EDR）監控。',
    genomeSignature: 'Kryll-X-Sig-A7B3',
    icon: Bug,
  },
  {
    id: 'threat-002',
    name: '幽靈釣魚行動 (Operation PhantomPhish)',
    severity: 'High',
    type: 'Phishing',
    status: 'Investigating',
    description: '針對高層管理人員的複雜魚叉式網絡釣魚活動，旨在獲取敏感公司數據。',
    firstSeen: '2024-07-18T14:00:00Z',
    lastSeen: '2024-07-20T11:00:00Z',
    affectedSystems: 12,
    aiVerdict: 'AI識別出與已知APT組織使用的TTPs相似之處。社會工程學向量複雜。',
    genomeSignature: 'PhishAPT-Variant-C4D9',
  },
  {
    id: 'threat-003',
    name: '數據風暴DDOS (DataStorm DDoS)',
    severity: 'Medium',
    type: 'DDoS',
    status: 'Mitigated',
    description: '針對面向公眾的Web服務器的大規模分佈式拒絕服務攻擊。',
    firstSeen: '2024-07-10T00:00:00Z',
    lastSeen: '2024-07-10T06:00:00Z',
    affectedSystems: 3,
    recommendation: '已通過流量清洗中心成功緩解。建議審查上游帶寬容量。',
    icon: ShieldOff,
  },
   {
    id: 'threat-004',
    name: 'SQL注入器 "SiphonSQL"',
    severity: 'High',
    type: 'SQLi',
    status: 'Active',
    description: '自動化SQL注入工具，針對易受攻擊的Web應用程序，試圖洩露數據庫內容。',
    firstSeen: '2024-07-19T09:15:00Z',
    lastSeen: '2024-07-20T12:30:00Z',
    affectedSystems: 5,
    aiVerdict: 'AI檢測到與SiphonSQL簽名匹配的異常查詢模式。高度自信的攻擊。',
    genomeSignature: 'SQLi-Siphon-V2-E5F1',
    icon: Bot,
  },
  {
    id: 'threat-005',
    name: 'ZeroDay Exploit "VoidRunner"',
    severity: 'Critical',
    type: 'Zero-day',
    status: 'Investigating',
    description: '檢測到利用未知漏洞的潛在零日攻擊。行為模式與任何已知威脅不符。',
    firstSeen: '2024-07-20T14:00:00Z',
    lastSeen: '2024-07-20T14:30:00Z',
    affectedSystems: 1,
    aiVerdict: 'AI標記為高度異常和潛在的零日攻擊。需要立即進行人工分析和沙箱測試。',
    recommendation: '隔離可疑端點。捕獲網絡流量以供進一步分析。',
  },
];


export default function ThreatIntelligenceClient() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Simulate API call
    setThreats(mockThreats);
  }, []);

  const filteredThreats = threats.filter(threat => {
    const matchesSearch = threat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          threat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (threat.aiVerdict && threat.aiVerdict.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSeverity = severityFilter === 'all' || threat.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || threat.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center">
          <Input 
            placeholder="Search threats..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs flex-grow bg-input border-border focus:ring-primary"
          />
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[180px] bg-input border-border focus:ring-primary">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Informational">Informational</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-input border-border focus:ring-primary">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Mitigated">Mitigated</SelectItem>
              <SelectItem value="Investigating">Investigating</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {filteredThreats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredThreats.map((threat) => (
            <ThreatCard key={threat.id} threat={threat} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">No threats match your criteria.</p>
        </div>
      )}
    </div>
  );
}
