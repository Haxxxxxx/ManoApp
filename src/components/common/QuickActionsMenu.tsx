import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';

export interface QuickAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  dividerBefore?: boolean;
  disabled?: boolean;
  color?: 'error' | 'inherit';
}

interface QuickActionsMenuProps {
  anchorPosition: { top: number; left: number } | null;
  onClose: () => void;
  actions: QuickAction[];
}

const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({ anchorPosition, onClose, actions }) => {
  if (!anchorPosition) return null;

  return (
    <Menu
      open={true}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
    >
      {actions.map((action, idx) => (
        <React.Fragment key={idx}>
          {action.dividerBefore && <Divider />}
          <MenuItem
            onClick={() => {
              action.onClick();
              onClose();
            }}
            disabled={action.disabled}
            sx={action.color === 'error' ? { color: 'error.main' } : undefined}
          >
            {action.icon && <ListItemIcon sx={action.color === 'error' ? { color: 'error.main' } : undefined}>{action.icon}</ListItemIcon>}
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        </React.Fragment>
      ))}
    </Menu>
  );
};

export default QuickActionsMenu;
