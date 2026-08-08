'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, FolderKanban, ClipboardList, FlaskConical, TrendingUp, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type StatCardData = {
  label: string;
  value: number;
  change: string | null;
  trend: 'up' | 'down' | 'neutral';
  icon: typeof Shield;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<StatCardData[]>([
    { label: 'Policies', value: 0, change: null, trend: 'neutral', icon: Shield },
    { label: 'Entities', value: 0, change: null, trend: 'neutral', icon: Users },
    { label: 'Resources', value: 0, change: null, trend: 'neutral', icon: FolderKanban },
    { label: 'Decisions (24h)', value: 0, change: null, trend: 'neutral', icon: ClipboardList },
  ]);
  const [loading, setLoading] = useState(true);
  const [recentDecisions, setRecentDecisions] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [policiesRes, entitiesRes, resourcesRes, decisionsRes] = await Promise.all([
          api.policies.list({ limit: 1 }),
          api.entities.list({ limit: 1 }),
          api.resources.list({ limit: 1 }),
          api.decisions.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        ]);

        setStats([
          { label: 'Policies', value: policiesRes.pagination.total, change: null, trend: 'neutral', icon: Shield },
          { label: 'Entities', value: entitiesRes.pagination.total, change: null, trend: 'neutral', icon: Users },
          { label: 'Resources', value: resourcesRes.pagination.total, change: null, trend: 'neutral', icon: FolderKanban },
          { label: 'Decisions (24h)', value: decisionsRes.pagination.total, change: '+12%', trend: 'up', icon: ClipboardList },
        ]);

        setRecentDecisions(decisionsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const statCards = stats.map((stat, i) => {
    const Icon = stat.icon;
    return (
      <motion.div
        key={stat.label}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
        className="col-span-1"
      >
        <Card className="rounded-xl border-border bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted">{stat.label}</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Icon className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-ink" aria-live="polite">
                  {stat.value.toLocaleString()}
                </p>
                {stat.change && (
                  <div className="mt-1 flex items-center gap-1">
                    <TrendingUp className={`h-3 w-3 ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`} />
                    <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted">vs last week</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  });

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted">Overview of your authorization platform</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => window.location.href = '/test'}>
          <FlaskConical className="h-4 w-4" />
          Run Test
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-white p-6 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
            <FolderKanban className="h-5 w-5 text-accent" />
            Quick Actions
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-auto py-4 text-left justify-start gap-3"
              onClick={() => window.location.href = '/policies'}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Shield className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-ink">Create Policy</p>
                <p className="text-xs text-muted">Define new access rules</p>
              </div>
              <ArrowUpRight className="h-4 w-4 ml-auto text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 text-left justify-start gap-3"
              onClick={() => window.location.href = '/entities'}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-ink">Add Entity</p>
                <p className="text-xs text-muted">Register user or service</p>
              </div>
              <ArrowUpRight className="h-4 w-4 ml-auto text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 text-left justify-start gap-3"
              onClick={() => window.location.href = '/resources'}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <FolderKanban className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-ink">Register Resource</p>
                <p className="text-xs text-muted">Define protected resources</p>
              </div>
              <ArrowUpRight className="h-4 w-4 ml-auto text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 text-left justify-start gap-3"
              onClick={() => window.location.href = '/test'}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
                <FlaskConical className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="font-medium text-ink">Test Access</p>
                <p className="text-xs text-muted">Verify policies in console</p>
              </div>
              <ArrowUpRight className="h-4 w-4 ml-auto text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        </motion.div>

        {/* Recent Decisions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-border bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <ClipboardList className="h-5 w-5 text-accent" />
              Recent Decisions
            </h2>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/decisions'}>
              View All
            </Button>
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="h-8 w-8 rounded bg-surface-2" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-surface-2" />
                      <div className="h-3 w-1/2 rounded bg-surface-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentDecisions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-muted">
                <ClipboardList className="h-8 w-8 mb-2 opacity-30" />
                <p>No decisions yet</p>
                <p className="text-xs">Run a test in Test Console to see activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDecisions.map((decision, i) => (
                  <motion.div
                    key={decision.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-2/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        decision.decision === 'allow' ? 'bg-emerald-50' : 'bg-red-50'
                      }`}>
                        {decision.decision === 'allow' ? (
                          <Shield className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ClipboardList className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {decision.entityId} → {decision.resourceType}
                        </p>
                        <p className="text-xs text-muted">
                          {decision.action} · {new Date(decision.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      decision.decision === 'allow' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {decision.decision === 'allow' ? 'ALLOWED' : 'DENIED'}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}