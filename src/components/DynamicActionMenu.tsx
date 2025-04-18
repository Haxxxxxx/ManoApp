import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Typography
} from '@mui/material';
import { panelRegistry } from './panels/panelRegistry';

interface ActionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  dividerAfter?: boolean;
}

interface DynamicActionMenuProps {
  actions: ActionItem[];
  buttonText: string;
  buttonVariant?: 'text' | 'outlined' | 'contained';
  buttonColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  buttonStartIcon?: React.ReactNode;
  buttonEndIcon?: React.ReactNode;
  buttonSx?: any;
  menuWidth?: number;
}

const DynamicActionMenu: React.FC<DynamicActionMenuProps> = ({
  actions,
  buttonText,
  buttonVariant = 'contained',
  buttonColor = 'primary',
  buttonStartIcon,
  buttonEndIcon,
  buttonSx = {},
  menuWidth = 220
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: () => void) => {
    action();
    handleClose();
  };

  return (
    <Box>
      <Button
        variant={buttonVariant}
        color={buttonColor}
        startIcon={buttonStartIcon}
        endIcon={buttonEndIcon}
        onClick={handleClick}
        sx={buttonSx}
      >
        {buttonText}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { width: menuWidth }
        }}
      >
        {actions.map((item, index) => (
          <React.Fragment key={item.id || index}>
            <MenuItem onClick={() => handleAction(item.action)}>
              {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
            {item.dividerAfter && <Divider />}
          </React.Fragment>
        ))}
      </Menu>
    </Box>
  );
};

export default DynamicActionMenu; 