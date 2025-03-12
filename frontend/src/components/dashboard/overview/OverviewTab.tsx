import React from 'react';
import { SystemStatusCard } from '../system/SystemStatusCard';
import { ResourceUsageCard } from '../system/ResourceUsageCard';
import { ActivityFeed } from './ActivityFeed';
import { QuickAccess } from './QuickAccess';

export function OverviewTab() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* System-Status */}
        <div>
          <SystemStatusCard />
        </div>

        {/* Ressourcen-Nutzung */}
        <div>
          <ResourceUsageCard />
        </div>

        {/* Aktivitäts-Feed */}
        <div>
          <ActivityFeed />
        </div>
      </div>

      {/* Schnellzugriff */}
      <QuickAccess />
    </>
  );
} 