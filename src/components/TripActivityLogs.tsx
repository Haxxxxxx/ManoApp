import React from 'react';
import ActivityFeed from './dashboard/ActivityFeed';

interface TripActivityLogsProps {
  tripId: string;
}

const TripActivityLogs: React.FC<TripActivityLogsProps> = ({ tripId }) => {
  return <ActivityFeed tripIds={[tripId]} maxItems={20} />;
};

export default TripActivityLogs;
