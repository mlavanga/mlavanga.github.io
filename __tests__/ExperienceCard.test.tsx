import { render, screen } from '@testing-library/react';
import ExperienceCard from '../app/components/ExperienceCard';
import { experience } from '../app/data/content';

describe('ExperienceCard', () => {
  it('renders the experience card with the correct information', () => {
    const testExperience = experience[0];
    render(<ExperienceCard item={testExperience} />);

    const titleElement = screen.getByText(testExperience.title);
    expect(titleElement).toBeInTheDocument();

    const subTitleElement = screen.getByText(testExperience.sub_title!);
    expect(subTitleElement).toBeInTheDocument();

    const captionElement = screen.getByText(testExperience.caption);
    expect(captionElement).toBeInTheDocument();
  });
});
