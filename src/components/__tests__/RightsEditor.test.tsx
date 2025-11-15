/**
 * RightsEditor Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RightsEditor } from '../RightsEditor';
import { RightsSplit } from '../../types/export';

const mockCollaborators = [
  { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
  { id: 'user-2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: 'user-3', name: 'Bob Johnson', email: 'bob@example.com' },
];

describe('RightsEditor', () => {
  it('renders empty state', () => {
    render(<RightsEditor collaborators={mockCollaborators} />);
    
    expect(screen.getByText('No rights splits defined')).toBeInTheDocument();
    expect(screen.getByText('Add Collaborator')).toBeInTheDocument();
  });

  it('adds a collaborator split', () => {
    const onChange = jest.fn();
    render(<RightsEditor collaborators={mockCollaborators} onChange={onChange} />);
    
    const addButton = screen.getByText('Add Collaborator');
    fireEvent.click(addButton);
    
    expect(screen.getByLabelText('Collaborator')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalled();
  });

  it('displays existing splits', () => {
    const splits: RightsSplit[] = [
      { userId: 'user-1', name: 'John Doe', percentage: 50 },
      { userId: 'user-2', name: 'Jane Smith', percentage: 50 },
    ];
    
    render(<RightsEditor splits={splits} collaborators={mockCollaborators} />);
    
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    expect(screen.getByText('100.00%')).toBeInTheDocument();
  });

  it('updates split percentage', async () => {
    const splits: RightsSplit[] = [
      { userId: 'user-1', name: 'John Doe', percentage: 50 },
    ];
    const onChange = jest.fn();
    
    render(<RightsEditor splits={splits} collaborators={mockCollaborators} onChange={onChange} />);
    
    const percentageInput = screen.getByLabelText('Percentage');
    fireEvent.change(percentageInput, { target: { value: '60' } });
    
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
  });

  it('validates total equals 100%', () => {
    const splits: RightsSplit[] = [
      { userId: 'user-1', name: 'John Doe', percentage: 60 },
      { userId: 'user-2', name: 'Jane Smith', percentage: 30 },
    ];
    
    render(<RightsEditor splits={splits} collaborators={mockCollaborators} showValidation />);
    
    expect(screen.getByText(/Total must equal 100%/)).toBeInTheDocument();
    expect(screen.getByText('90.00%')).toBeInTheDocument();
  });

  it('shows success when total equals 100%', () => {
    const splits: RightsSplit[] = [
      { userId: 'user-1', name: 'John Doe', percentage: 50 },
      { userId: 'user-2', name: 'Jane Smith', percentage: 50 },
    ];
    
    render(<RightsEditor splits={splits} collaborators={mockCollaborators} showValidation />);
    
    expect(screen.getByText('Rights splits are valid')).toBeInTheDocument();
    expect(screen.getByText('100.00%')).toBeInTheDocument();
  });

  it('removes a split', () => {
    const splits: RightsSplit[] = [
      { userId: 'user-1', name: 'John Doe', percentage: 50 },
      { userId: 'user-2', name: 'Jane Smith', percentage: 50 },
    ];
    const onChange = jest.fn();
    
    render(<RightsEditor splits={splits} collaborators={mockCollaborators} onChange={onChange} />);
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    expect(onChange).toHaveBeenCalled();
  });

  it('disables editing in read-only mode', () => {
    const splits: RightsSplit[] = [
      { userId: 'user-1', name: 'John Doe', percentage: 50 },
    ];
    
    render(<RightsEditor splits={splits} collaborators={mockCollaborators} readOnly />);
    
    const percentageInput = screen.getByLabelText('Percentage');
    expect(percentageInput).toBeDisabled();
    
    expect(screen.queryByText('Add Collaborator')).not.toBeInTheDocument();
  });

  it('calculates total correctly with multiple splits', () => {
    const splits: RightsSplit[] = [
      { userId: 'user-1', name: 'John Doe', percentage: 33.33 },
      { userId: 'user-2', name: 'Jane Smith', percentage: 33.33 },
      { userId: 'user-3', name: 'Bob Johnson', percentage: 33.34 },
    ];
    
    render(<RightsEditor splits={splits} collaborators={mockCollaborators} showValidation />);
    
    expect(screen.getByText('100.00%')).toBeInTheDocument();
    expect(screen.getByText('Rights splits are valid')).toBeInTheDocument();
  });
});

