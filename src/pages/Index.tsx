import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LogEntry {
  id: number;
  time: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
}

interface Connection {
  id: string;
  name: string;
  ip: string;
  os: string;
  status: "online" | "offline" | "idle";
  lastSeen: string;
  cpu: number;
  ram: number;
  uptime: string;
}

interface CommandEntry {
  id: number;
  input: string;
  output: string;
  time: string;
  host: string;
}

const MOCK_CONNECTIONS: Connection[] = [
  { id: "srv-01", name: "Production Server", ip: "192.168.1.100", os: "Ubuntu 22.04", status: "online", lastSeen: "сейчас", cpu: 34, ram: 67, uptime: "45д 12ч" },
  { id: "srv-02", name: "Dev Machine", ip: "192.168.1.101", os: "Windows 11", status: "online", lastSeen: "сейчас", cpu: 12, ram: 45, uptime: "12д 3ч" },
  { id: "srv-03", name: "Backup Node", ip: "192.168.1.102", os: "Debian 12", status: "idle", lastSeen: "5 мин назад", cpu: 2, ram: 23, uptime: "90д 1ч" },
  { id: "srv-04", name: "Test Server", ip: "10.0.0.50", os: "CentOS 9", status: "offline", lastSeen: "2ч назад", cpu: 0, ram: 0, uptime: "—" },
];

const MOCK_LOGS: LogEntry[] = [
  { id: 1, time: "17:42:01", type: "success", message: "[srv-01] Подключение установлено" },
  { id: 2, time: "17:42:03", type: "info", message: "[srv-01] Сессия активна, ping 12ms" },
  { id: 3, time: "17:41:55", type: "info", message: "[srv-02] Обновление агента завершено v2.4.1" },
  { id: 4, time: "17:41:30", type: "warning", message: "[srv-03] Высокая загрузка диска: 89%" },
  { id: 5, time: "17:40:12", type: "error", message: "[srv-04] Потеряно соединение — таймаут 30с" },
  { id: 6, time: "17:39:50", type: "info", message: "[srv-01] Выполнена команда: systemctl status nginx" },
  { id: 7, time: "17:38:22", type: "success", message: "[srv-02] Файл backup.tar.gz передан успешно (2.3 GB)" },
  { id: 8, time: "17:37:10", type: "info", message: "Система мониторинга запущена" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedConnection, setSelectedConnection] = useState<Connection>(MOCK_CONNECTIONS[0]);
  const [commandInput, setCommandInput] = useState("");
  const [commands, setCommands] = useState<CommandEntry[]>([
    { id: 1, input: "systemctl status nginx", output: "● nginx.service - A high performance web server\n   Active: active (running) since Mon 2026-02-10 05:12:33 UTC\n   Main PID: 1234 (nginx)\n   Tasks: 5 (limit: 4915)\n   Memory: 12.4M", time: "17:39:50", host: "srv-01" },
    { id: 2, input: "df -h", output: "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        50G   23G   25G  48% /\ntmpfs           2.0G  156M  1.8G   8% /dev/shm", time: "17:40:22", host: "srv-01" },
  ]);
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  const handleCommand = () => {
    if (!commandInput.trim()) return;
    const responses: Record<string, string> = {
      "ls": "bin  boot  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var",
      "whoami": "root",
      "uptime": " 17:42:01 up 45 days, 12:33,  2 users,  load average: 0.34, 0.28, 0.21",
      "free -h": "              total        used        free      shared  buff/cache   available\nMem:          7.8Gi       5.2Gi       0.8Gi       256Mi       1.8Gi       2.1Gi\nSwap:         2.0Gi       0.1Gi       1.9Gi",
      "top -bn1 | head -5": "top - 17:42:01 up 45 days, 12:33,  2 users,  load average: 0.34\nTasks: 156 total,   1 running, 155 sleeping,   0 stopped\n%Cpu(s):  3.4 us,  1.2 sy,  0.0 ni, 95.1 id,  0.3 wa\nMiB Mem :   7987.4 total,    812.3 free,   5324.1 used,   1851.0 buff/cache\nMiB Swap:   2048.0 total,   1932.8 free,    115.2 used.   2187.3 avail Mem",
      "hostname": selectedConnection.name.toLowerCase().replace(/\s/g, "-"),
      "pwd": "/root",
      "date": new Date().toString(),
    };
    const output = responses[commandInput.trim()] || `bash: ${commandInput.trim().split(" ")[0]}: результат выполнения команды`;

    const newCmd: CommandEntry = {
      id: commands.length + 1,
      input: commandInput,
      output,
      time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      host: selectedConnection.id,
    };
    setCommands([...commands, newCmd]);

    const newLog: LogEntry = {
      id: logs.length + 1,
      time: newCmd.time,
      type: "info",
      message: `[${selectedConnection.id}] Выполнена команда: ${commandInput}`,
    };
    setLogs([newLog, ...logs]);
    setCommandInput("");
  };

  const statusColor = (status: string) => {
    if (status === "online") return "bg-emerald-500 glow-dot";
    if (status === "idle") return "bg-amber-500";
    return "bg-red-500";
  };

  const logColor = (type: string) => {
    if (type === "success") return "text-emerald-400";
    if (type === "warning") return "text-amber-400";
    if (type === "error") return "text-red-400";
    return "text-slate-400";
  };

  const onlineCount = MOCK_CONNECTIONS.filter(c => c.status === "online").length;

  const navItems = [
    { id: "dashboard", label: "Панель", icon: "LayoutDashboard" },
    { id: "terminal", label: "Терминал", icon: "Terminal" },
    { id: "connections", label: "Подключения", icon: "Network" },
    { id: "logs", label: "Логи", icon: "ScrollText" },
    { id: "monitoring", label: "Мониторинг", icon: "Activity" },
    { id: "history", label: "История", icon: "History" },
    { id: "settings", label: "Настройки", icon: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Icon name="Shield" size={20} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-foreground">ServerControl</h1>
              <p className="text-[11px] text-muted-foreground">Remote Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeTab === item.id
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-emerald-500 glow-dot" />
            <span>{onlineCount} из {MOCK_CONNECTIONS.length} онлайн</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-medium text-foreground">{navItems.find(n => n.id === activeTab)?.label}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs text-muted-foreground">
              <Icon name="Wifi" size={14} className="text-emerald-400" />
              Подключён к {selectedConnection.name}
            </div>
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
              v2.4.1
            </Badge>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Dashboard */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Активных", value: onlineCount.toString(), icon: "MonitorCheck", color: "text-emerald-400" },
                  { label: "Команд сегодня", value: "47", icon: "Terminal", color: "text-blue-400" },
                  { label: "Ср. отклик", value: "12ms", icon: "Zap", color: "text-amber-400" },
                  { label: "Ошибок", value: "2", icon: "AlertTriangle", color: "text-red-400" },
                ].map((stat, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                      <Icon name={stat.icon} size={16} className={stat.color} />
                    </div>
                    <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-medium text-foreground mb-4">Подключения</h3>
                  <div className="space-y-3">
                    {MOCK_CONNECTIONS.map(conn => (
                      <div key={conn.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${statusColor(conn.status)}`} />
                          <div>
                            <p className="text-sm text-foreground">{conn.name}</p>
                            <p className="text-xs text-muted-foreground">{conn.ip} · {conn.os}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{conn.lastSeen}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-medium text-foreground mb-4">Последние события</h3>
                  <div className="space-y-2">
                    {logs.slice(0, 6).map(log => (
                      <div key={log.id} className="flex items-start gap-3 py-1.5">
                        <span className="text-[11px] text-muted-foreground terminal-text shrink-0 mt-0.5">{log.time}</span>
                        <span className={`text-xs ${logColor(log.type)}`}>{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Terminal */}
          {activeTab === "terminal" && (
            <div className="animate-fade-in h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <select
                  className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                  value={selectedConnection.id}
                  onChange={(e) => {
                    const conn = MOCK_CONNECTIONS.find(c => c.id === e.target.value);
                    if (conn) setSelectedConnection(conn);
                  }}
                >
                  {MOCK_CONNECTIONS.filter(c => c.status !== "offline").map(conn => (
                    <option key={conn.id} value={conn.id}>{conn.name} ({conn.ip})</option>
                  ))}
                </select>
                <Badge className={`${selectedConnection.status === "online" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"} border-0`}>
                  {selectedConnection.status === "online" ? "Подключён" : "Idle"}
                </Badge>
              </div>

              <div className="flex-1 bg-[hsl(220,24%,5%)] border border-border rounded-xl overflow-hidden flex flex-col min-h-[500px]">
                <div className="flex items-center gap-2 px-4 py-3 bg-[hsl(220,20%,8%)] border-b border-border">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs text-muted-foreground terminal-text ml-2">
                    root@{selectedConnection.name.toLowerCase().replace(/\s/g, "-")} — bash
                  </span>
                </div>

                <ScrollArea className="flex-1 p-4" ref={terminalRef}>
                  <div className="terminal-text text-sm space-y-3">
                    <div className="text-muted-foreground text-xs">
                      ServerControl Terminal v2.4.1 — Подключено к {selectedConnection.ip}
                    </div>
                    {commands.map(cmd => (
                      <div key={cmd.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400">root@{cmd.host}</span>
                          <span className="text-muted-foreground">:</span>
                          <span className="text-blue-400">~</span>
                          <span className="text-muted-foreground">$</span>
                          <span className="text-foreground">{cmd.input}</span>
                        </div>
                        <pre className="text-slate-400 mt-1 whitespace-pre-wrap text-xs leading-relaxed">{cmd.output}</pre>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">root@{selectedConnection.id}</span>
                      <span className="text-muted-foreground">:</span>
                      <span className="text-blue-400">~</span>
                      <span className="text-muted-foreground">$</span>
                      <span className="w-2 h-4 bg-emerald-400 inline-block animate-blink" />
                    </div>
                  </div>
                </ScrollArea>

                <div className="border-t border-border p-3 flex gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-[hsl(220,20%,8%)] rounded-lg px-3">
                    <span className="text-emerald-400 terminal-text text-sm">$</span>
                    <Input
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCommand()}
                      placeholder="Введите команду..."
                      className="border-0 bg-transparent terminal-text text-sm focus-visible:ring-0 px-0 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <Button onClick={handleCommand} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Icon name="Send" size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Connections */}
          {activeTab === "connections" && (
            <div className="animate-fade-in space-y-4">
              {MOCK_CONNECTIONS.map(conn => (
                <div
                  key={conn.id}
                  className={`bg-card border rounded-xl p-5 cursor-pointer transition-all hover:border-emerald-500/30 ${
                    selectedConnection.id === conn.id ? "border-emerald-500/50" : "border-border"
                  }`}
                  onClick={() => { setSelectedConnection(conn); setActiveTab("terminal"); }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        conn.status === "online" ? "bg-emerald-500/10" : conn.status === "idle" ? "bg-amber-500/10" : "bg-red-500/10"
                      }`}>
                        <Icon name="Monitor" size={20} className={
                          conn.status === "online" ? "text-emerald-400" : conn.status === "idle" ? "text-amber-400" : "text-red-400"
                        } />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-foreground">{conn.name}</h3>
                          <div className={`w-2 h-2 rounded-full ${statusColor(conn.status)}`} />
                        </div>
                        <p className="text-xs text-muted-foreground">{conn.ip} · {conn.os} · Аптайм: {conn.uptime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">CPU</p>
                        <p className={`text-sm font-medium ${conn.cpu > 70 ? "text-red-400" : "text-foreground"}`}>{conn.cpu}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">RAM</p>
                        <p className={`text-sm font-medium ${conn.ram > 80 ? "text-red-400" : "text-foreground"}`}>{conn.ram}%</p>
                      </div>
                      <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Logs */}
          {activeTab === "logs" && (
            <div className="animate-fade-in">
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                  <Tabs defaultValue="all" className="w-auto">
                    <TabsList className="bg-secondary h-8">
                      <TabsTrigger value="all" className="text-xs h-6">Все</TabsTrigger>
                      <TabsTrigger value="errors" className="text-xs h-6">Ошибки</TabsTrigger>
                      <TabsTrigger value="warnings" className="text-xs h-6">Предупреждения</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setLogs([])}>
                    <Icon name="Trash2" size={14} className="mr-1" /> Очистить
                  </Button>
                </div>
                <ScrollArea className="h-[600px]">
                  <div className="divide-y divide-border">
                    {logs.map(log => (
                      <div key={log.id} className="flex items-start gap-4 px-5 py-3 hover:bg-secondary/50 transition-colors">
                        <span className="text-[11px] text-muted-foreground terminal-text shrink-0 mt-0.5">{log.time}</span>
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                          log.type === "error" ? "bg-red-400" : log.type === "warning" ? "bg-amber-400" : log.type === "success" ? "bg-emerald-400" : "bg-slate-500"
                        }`} />
                        <span className={`text-sm terminal-text ${logColor(log.type)}`}>{log.message}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Monitoring */}
          {activeTab === "monitoring" && (
            <div className="animate-fade-in space-y-6">
              {MOCK_CONNECTIONS.filter(c => c.status !== "offline").map(conn => (
                <div key={conn.id} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${statusColor(conn.status)}`} />
                      <h3 className="text-sm font-medium text-foreground">{conn.name}</h3>
                      <span className="text-xs text-muted-foreground">{conn.ip}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Аптайм: {conn.uptime}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">CPU</span>
                        <span className="text-xs font-medium text-foreground">{conn.cpu}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${conn.cpu > 70 ? "bg-red-500" : conn.cpu > 40 ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${conn.cpu}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">RAM</span>
                        <span className="text-xs font-medium text-foreground">{conn.ram}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${conn.ram > 80 ? "bg-red-500" : conn.ram > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                          style={{ width: `${conn.ram}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">Диск</span>
                        <span className="text-xs font-medium text-foreground">{Math.round(conn.cpu * 1.3 + 20)}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.round(conn.cpu * 1.3 + 20)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History */}
          {activeTab === "history" && (
            <div className="animate-fade-in">
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <ScrollArea className="h-[600px]">
                  <div className="divide-y divide-border">
                    {commands.map(cmd => (
                      <div key={cmd.id} className="px-5 py-4 hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon name="Terminal" size={14} className="text-emerald-400" />
                            <code className="text-sm terminal-text text-foreground">{cmd.input}</code>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{cmd.host}</span>
                            <span>{cmd.time}</span>
                          </div>
                        </div>
                        <pre className="text-xs terminal-text text-muted-foreground bg-secondary/50 rounded-lg p-3 mt-2 whitespace-pre-wrap">{cmd.output}</pre>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="animate-fade-in max-w-2xl space-y-6">
              {[
                { title: "Подключение", fields: [
                  { label: "Адрес агента", placeholder: "https://agent.example.com", icon: "Globe" },
                  { label: "Порт", placeholder: "8443", icon: "Hash" },
                  { label: "API ключ", placeholder: "sk-xxxx-xxxx-xxxx", icon: "Key" },
                ]},
                { title: "Уведомления", fields: [
                  { label: "Webhook URL", placeholder: "https://hooks.slack.com/...", icon: "Bell" },
                  { label: "Email", placeholder: "admin@example.com", icon: "Mail" },
                ]},
              ].map((section, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-medium text-foreground mb-4">{section.title}</h3>
                  <div className="space-y-3">
                    {section.fields.map((field, j) => (
                      <div key={j}>
                        <label className="text-xs text-muted-foreground mb-1.5 block">{field.label}</label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Icon name={field.icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder={field.placeholder} className="pl-9 bg-secondary border-border text-sm" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Icon name="Save" size={16} className="mr-2" /> Сохранить настройки
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
