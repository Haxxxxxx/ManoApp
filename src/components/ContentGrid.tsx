import React from 'react';
import { Box } from '@mui/material';
import DynamicCard, { CardTag } from './DynamicCard';
import DynamicGrid from './DynamicGrid';
import { Avatar } from '@mui/material';

interface ContentItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  photoURL?: string;
  tags?: CardTag[];
  actions?: Array<{
    label: string;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    onClick: () => void;
  }>;
  iconButtons?: Array<{
    icon: React.ReactNode;
    tooltip: string;
    onClick: () => void;
  }>;
}

interface ContentGridProps {
  items: ContentItem[];
  loading?: boolean;
  emptyMessage?: string;
  columns?: number;
  onItemClick?: (item: ContentItem) => void;
}

const ContentGrid: React.FC<ContentGridProps> = ({
  items,
  loading = false,
  emptyMessage = 'No content available',
  columns = 3,
  onItemClick
}) => {
  const renderCard = (item: ContentItem) => (
    <DynamicCard
      key={item.id}
      title={item.title}
      subtitle={item.subtitle}
      description={item.description}
      photoURL={item.photoURL}
      tags={item.tags}
      actions={item.actions}
      iconButtons={item.iconButtons}
      onClick={() => onItemClick?.(item)}
    >
      <Avatar
        alt={item.title}
        src={item.photoURL}
        sx={{ width: 56, height: 56 }}
      />
    </DynamicCard>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <DynamicGrid
        items={items.map(renderCard)}
        loading={loading}
        emptyMessage={emptyMessage}
        columns={columns}
      />
    </Box>
  );
};

export default ContentGrid; 