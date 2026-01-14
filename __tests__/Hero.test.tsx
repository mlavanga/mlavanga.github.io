import { render, screen } from '@testing-library/react';
import Hero from '../app/components/Hero';
import { personalInfo } from '../app/data/content';

describe('Hero', () => {
  it('renders the hero section with personal information', () => {
    render(<Hero info={personalInfo} />);

    const nameElement = screen.getByText(personalInfo.name);
    expect(nameElement).toBeInTheDocument();

    const titleElement = screen.getByText(personalInfo.title);
    expect(titleElement).toBeInTheDocument();
  });
});
