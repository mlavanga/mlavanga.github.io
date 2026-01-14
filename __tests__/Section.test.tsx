import { render, screen } from '@testing-library/react';
import Section from '../app/components/Section';

describe('Section', () => {
  it('renders the section with a title and children', () => {
    render(
      <Section id="test-section" title="Test Title">
        <p>Test Content</p>
      </Section>
    );

    const titleElement = screen.getByText('Test Title');
    expect(titleElement).toBeInTheDocument();

    const contentElement = screen.getByText('Test Content');
    expect(contentElement).toBeInTheDocument();
  });
});
