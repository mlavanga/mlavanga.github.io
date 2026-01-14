import { render, screen } from '@testing-library/react';
import Navbar from '../app/components/Navbar';

describe('Navbar', () => {
  it('renders the navbar with navigation links', () => {
    render(<Navbar />);

    const logoElement = screen.getByText('ML');
    expect(logoElement).toBeInTheDocument();

    const aboutLink = screen.getByText('About');
    expect(aboutLink).toBeInTheDocument();

    const experienceLink = screen.getByText('Experience');
    expect(experienceLink).toBeInTheDocument();

    const projectsLink = screen.getByText('Projects');
    expect(projectsLink).toBeInTheDocument();

    const publicationsLink = screen.getByText('Publications');
    expect(publicationsLink).toBeInTheDocument();

    const skillsLink = screen.getByText('Skills');
    expect(skillsLink).toBeInTheDocument();

    const mediaLink = screen.getByText('Media');
    expect(mediaLink).toBeInTheDocument();

    const contactLink = screen.getByText('Contact');
    expect(contactLink).toBeInTheDocument();
  });
});
