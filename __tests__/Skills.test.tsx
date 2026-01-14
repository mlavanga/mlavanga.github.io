import { render, screen } from '@testing-library/react';
import Skills from '../app/components/Skills';
import { skills } from '../app/data/content';

describe('Skills', () => {
  it('renders the skills list with the correct information', () => {
    render(<Skills items={skills} />);

    skills.forEach(skill => {
      const nameElement = screen.getByText(skill.name);
      expect(nameElement).toBeInTheDocument();

      const levelElement = screen.getByText(skill.level);
      expect(levelElement).toBeInTheDocument();
    });
  });
});
