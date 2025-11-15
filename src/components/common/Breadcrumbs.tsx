import React from 'react';
import { Box, Breadcrumbs as MuiBreadcrumbs, Link, Typography, useTheme, alpha } from '@mui/material';
import { NavigateNext, Home } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  maxItems?: number;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, maxItems = 4 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleClick = (event: React.MouseEvent, path?: string) => {
    event.preventDefault();
    if (path) {
      navigate(path);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <MuiBreadcrumbs
        separator={<NavigateNext fontSize="small" sx={{ color: 'text.secondary' }} />}
        maxItems={maxItems}
        itemsAfterCollapse={2}
        itemsBeforeCollapse={1}
        sx={{
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'nowrap',
          }
        }}
      >
        {/* Home link */}
        <Link
          component="button"
          variant="body2"
          onClick={(e) => handleClick(e, '/')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: location.pathname === '/' ? 'primary.main' : 'text.secondary',
            textDecoration: 'none',
            fontWeight: location.pathname === '/' ? 600 : 400,
            transition: 'all 0.2s ease',
            '&:hover': {
              color: 'primary.main',
              transform: 'translateX(-2px)',
            }
          }}
        >
          <Home fontSize="small" />
          <Typography variant="body2">Home</Typography>
        </Link>

        {/* Other breadcrumb items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isActive = item.path === location.pathname;

          if (isLast) {
            return (
              <Typography
                key={index}
                variant="body2"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'text.primary',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.icon}
                {item.label}
              </Typography>
            );
          }

          return (
            <Link
              key={index}
              component="button"
              variant="body2"
              onClick={(e) => handleClick(e, item.path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: isActive ? 'primary.main' : 'text.secondary',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  borderRadius: 1,
                  px: 0.5,
                  py: 0.25,
                }
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;

