import { render, screen } from '@testing-library/react';
import Footer from '../app/components/Footer';
import { personalInfo } from '../app/data/content';

describe('Footer', () => {
  it('renders the footer with personal information', () => {
    render(<Footer info={personalInfo} />);

    const nameElement = screen.getByText(personalInfo.name);
    expect(nameElement).toBeInTheDocument();

    const copyrightElement = screen.getByText(`© ${new Date().getFullYear()} ${personalInfo.name}. All rights reserved.`);
    expect(copyrightElement).toBeInTheDocument();
  });
});
