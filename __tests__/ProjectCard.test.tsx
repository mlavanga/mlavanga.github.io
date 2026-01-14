import { render, screen } from '@testing-library/react';
import ProjectCard from '../app/components/ProjectCard';
import { projects } from '../app/data/content';

describe('ProjectCard', () => {
  it('renders the project card with the correct information', () => {
    const testProject = projects[0];
    render(<ProjectCard item={testProject} />);

    const titleElement = screen.getByText(testProject.title);
    expect(titleElement).toBeInTheDocument();

    const descriptionElement = screen.getByText(testProject.description);
    expect(descriptionElement).toBeInTheDocument();

    testProject.tags.forEach(tag => {
      const tagElement = screen.getByText(tag);
      expect(tagElement).toBeInTheDocument();
    });
  });
});
