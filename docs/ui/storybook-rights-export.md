# Storybook: RightsEditor & ExportPanel

This document describes the Storybook setup and stories for the RightsEditor and ExportPanel components.

## Overview

Storybook provides an isolated development environment for UI components, allowing designers and developers to view and test components in various states without running the full application.

## Setup

### Installation

Storybook dependencies are already included in `package.json`. To install:

```bash
npm install
```

### Running Storybook

```bash
npm run storybook
```

This starts Storybook on `http://localhost:6006`.

### Building Storybook

To build a static version of Storybook:

```bash
npm run build-storybook
```

The output will be in the `storybook-static` directory.

## Stories

### RightsEditor

The RightsEditor component allows users to manage rights splits for collaborators.

#### Available Stories

1. **Default** - Empty state with no splits
2. **WithEqualSplits** - Two collaborators with 50/50 split
3. **InvalidSplits** - Splits that don't sum to 100% (shows error)
4. **ThreeWaySplit** - Three collaborators with roles
5. **ReadOnly** - Read-only mode (editing disabled)
6. **NoCollaborators** - Empty state when no collaborators available

#### Usage Example

```tsx
import { RightsEditor } from '@/components/RightsEditor';

<RightsEditor
  splits={[
    { userId: 'user-1', name: 'Artist', percentage: 50 },
    { userId: 'user-2', name: 'Producer', percentage: 50 },
  ]}
  collaborators={collaborators}
  onChange={(splits) => console.log('Splits changed:', splits)}
  showValidation={true}
/>
```

### ExportPanel

The ExportPanel component provides a complete export workflow with preflight validation, provider selection, and export history.

#### Available Stories

1. **Default** - Basic export panel with valid manifest
2. **PreflightErrors** - Shows preflight validation errors
3. **PreflightWarnings** - Shows preflight validation warnings
4. **ExportInProgress** - Export in progress state
5. **WithHistory** - Export panel with export history
6. **NoProviders** - No providers available

#### Usage Example

```tsx
import { ExportPanel } from '@/components/ExportPanel';

<ExportPanel
  manifest={releaseManifest}
  providers={[
    { id: 'soundcloud', name: 'SoundCloud', enabled: true },
    { id: 'spotify', name: 'Spotify', enabled: false },
  ]}
  onRunPreflight={async (manifest) => {
    // Run preflight validation
    return preflightResult;
  }}
  onSubmit={async (manifest, providerIds) => {
    // Submit to providers
    return submissionResults;
  }}
  exportHistory={history}
/>
```

## Mock Data

Mock data is available in `src/mocks/storybook/`:

- `mockReleaseManifest.ts` - Sample release manifests
- `mockPreflightResults.ts` - Sample preflight validation results

## Accessibility (a11y)

Storybook includes the `@storybook/addon-a11y` addon for accessibility testing. Each story is automatically checked for:

- Color contrast
- Keyboard navigation
- Screen reader compatibility
- ARIA attributes

To view accessibility results:
1. Open a story in Storybook
2. Click the "Accessibility" tab in the addon panel
3. Review any violations or warnings

## Testing

### Component Tests

RightsEditor has unit tests in `src/components/__tests__/RightsEditor.test.tsx`:

```bash
npm test -- RightsEditor
```

### Visual Regression

Storybook can be used for visual regression testing:

1. Take snapshots: `npm run build-storybook`
2. Compare snapshots in CI/CD pipeline
3. Review changes in pull requests

## Best Practices

### Writing Stories

1. **Cover all states**: Include stories for empty, loading, error, and success states
2. **Use meaningful names**: Story names should clearly describe the state
3. **Provide mock data**: Use mock data from `src/mocks/storybook/`
4. **Test interactions**: Use Storybook interactions to test user flows
5. **Document props**: Use JSDoc comments to document component props

### Example Story Structure

```tsx
export const StoryName: Story = {
  args: {
    // Component props
    prop1: 'value1',
    prop2: 'value2',
  },
  parameters: {
    // Story-specific parameters
    docs: {
      description: {
        story: 'Description of what this story demonstrates',
      },
    },
  },
};
```

## Troubleshooting

### Storybook Won't Start

1. Check Node.js version (should be 18+)
2. Clear cache: `rm -rf node_modules/.cache`
3. Reinstall dependencies: `rm -rf node_modules && npm install`

### Stories Not Appearing

1. Check file naming: stories must end with `.stories.tsx`
2. Check file location: stories should be near their components
3. Check Storybook config: verify `stories` array in `.storybook/main.ts`

### TypeScript Errors

1. Ensure types are properly imported
2. Check `tsconfig.json` includes Storybook files
3. Verify component props match TypeScript definitions

## Screenshots

Screenshots of stories should be included in pull requests for UI changes. To generate screenshots:

1. Run Storybook: `npm run storybook`
2. Navigate to each story
3. Take screenshots manually or use automated tools
4. Include in PR description

## Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Storybook React](https://storybook.js.org/docs/react/get-started/introduction)
- [Accessibility Addon](https://storybook.js.org/addons/@storybook/addon-a11y)
- [Testing with Storybook](https://storybook.js.org/docs/react/writing-tests)

