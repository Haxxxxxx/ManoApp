import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { COMMON_SHORTCUTS } from '../../hooks/useKeyboardShortcuts';

interface ShortcutEntry {
  keys: string[];
  description: string;
  category: string;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
const mod = isMac ? 'Cmd' : 'Ctrl';

function buildShortcutEntries(): ShortcutEntry[] {
  const entries: ShortcutEntry[] = [];
  const seen = new Set<string>();

  // COMMON_SHORTCUTS members are heterogeneous const objects — widen to the
  // full shortcut shape so optional modifier keys can be probed
  type ShortcutDef = { key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; description?: string };
  for (const [name, def] of Object.entries(COMMON_SHORTCUTS) as Array<[string, ShortcutDef]>) {
    // Skip SEARCH (duplicate of COMMAND_PALETTE)
    if (name === 'SEARCH') continue;

    const keys: string[] = [];
    if (def.ctrlKey) keys.push(mod);
    if (def.shiftKey) keys.push('Shift');
    if (def.altKey) keys.push('Alt');
    keys.push(def.key === '?' ? '?' : def.key.length === 1 ? def.key.toUpperCase() : def.key);

    const keyStr = keys.join('+');
    if (seen.has(keyStr)) continue;
    seen.add(keyStr);

    const isNav = !!def.altKey || def.key === 'Escape' || def.key === '?';
    entries.push({
      keys,
      description: def.description || name.toLowerCase().replace(/_/g, ' '),
      category: isNav ? 'Navigation' : 'Actions',
    });
  }

  return entries;
}

const SHORTCUTS = buildShortcutEntries();

interface ShortcutGuideDialogProps {
  open: boolean;
  onClose: () => void;
}

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    component="kbd"
    sx={{
      display: 'inline-block',
      px: 1,
      py: 0.25,
      mx: 0.25,
      fontSize: '0.8rem',
      fontFamily: 'monospace',
      fontWeight: 600,
      lineHeight: 1.6,
      color: 'text.primary',
      bgcolor: 'action.hover',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      minWidth: 24,
      textAlign: 'center',
    }}
  >
    {children}
  </Box>
);

const ShortcutGuideDialog: React.FC<ShortcutGuideDialogProps> = ({ open, onClose }) => {
  const categories = [...new Set(SHORTCUTS.map((s) => s.category))];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Keyboard Shortcuts
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {categories.map((cat) => (
          <Box key={cat} sx={{ mb: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              {cat}
            </Typography>
            <Table size="small">
              <TableBody>
                {SHORTCUTS.filter((s) => s.category === cat).map((s, i) => (
                  <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ width: 180 }}>
                      {s.keys.map((k, j) => (
                        <React.Fragment key={j}>
                          {j > 0 && <Typography component="span" variant="caption" sx={{ mx: 0.25 }}>+</Typography>}
                          <Kbd>{k}</Kbd>
                        </React.Fragment>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{s.description}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        ))}
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutGuideDialog;
