import { render, screen } from '@testing-library/react';
import { Section } from './section';

describe('Section', () => {
  it('renders the section with hero, buttoner, and footer', () => {
    render(<Section />);
    
    // Check if Hero is rendered (assuming Hero has some text or element)
    expect(screen.getByText('Test')).toBeInTheDocument();
    
    // Check for buttoner or other elements
    expect(screen.getByText('Content for One')).toBeInTheDocument();
  });
});