import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../../src/hooks/useLanguage';
import { FieldAlignmentDiagram } from '../../src/components/game/FieldAlignmentDiagram';

const teamBox = {
  pitchers: [90, 91],
  players: {
    ID11: {
      person: { id: 11, fullName: 'Corey Seager' },
      position: { abbreviation: 'SS' },
      allPositions: [{ abbreviation: 'SS' }],
      battingOrder: '100',
    },
    ID12: {
      person: { id: 12, fullName: 'Jonah Heim' },
      position: { abbreviation: 'C' },
      allPositions: [{ abbreviation: 'C' }],
      battingOrder: '200',
    },
    ID13: {
      person: { id: 13, fullName: 'Wyatt Langford' },
      position: { abbreviation: 'LF' },
      allPositions: [{ abbreviation: 'LF' }],
      battingOrder: '301',
    },
    ID90: {
      person: { id: 90, fullName: 'Nathan Eovaldi' },
      position: { abbreviation: 'P' },
    },
    ID91: {
      person: { id: 91, fullName: 'Kirby Yates' },
      position: { abbreviation: 'P' },
    },
  },
};

const renderDiagram = (props = {}) =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <FieldAlignmentDiagram teamBox={teamBox} teamName="Texas Rangers" {...props} />
      </LanguageProvider>
    </MemoryRouter>
  );

describe('FieldAlignmentDiagram component', () => {
  it('renders the fielders at their positions with links to player pages', () => {
    renderDiagram();

    expect(screen.getByText('Texas Rangers')).toBeInTheDocument();
    // Each fielder appears twice: once in the SVG, once in the mobile list
    expect(screen.getAllByText('Corey Seager').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Corey Seager/ })[0]).toHaveAttribute(
      'href',
      '#/players/11'
    );
  });

  it('puts the relief pitcher on the mound rather than the starter', () => {
    renderDiagram();

    expect(screen.getAllByText('Kirby Yates').length).toBeGreaterThan(0);
    expect(screen.queryByText('Nathan Eovaldi')).not.toBeInTheDocument();
  });

  it('renders every one of the nine position labels', () => {
    const { container } = renderDiagram();
    const svgText = container.querySelector('svg')?.textContent || '';

    ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'].forEach((pos) => {
      expect(svgText).toContain(pos);
    });
  });

  it('falls back to an empty state when no lineup has been posted', () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <FieldAlignmentDiagram teamBox={{ players: {} }} teamName="Texas Rangers" />
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('本場尚未公布守備名單。')).toBeInTheDocument();
  });

  it('shows who a substituted fielder came in for', () => {
    const swapped = {
      pitchers: [90],
      players: {
        ID40: {
          person: { id: 40, fullName: 'Marcus Semien' },
          position: { abbreviation: '2B' },
          allPositions: [{ abbreviation: '2B' }],
          battingOrder: '400',
        },
        ID41: {
          person: { id: 41, fullName: 'Josh Smith' },
          position: { abbreviation: '2B' },
          allPositions: [{ abbreviation: '2B' }],
          battingOrder: '401',
        },
        ID90: { person: { id: 90, fullName: 'Kirby Yates' }, position: { abbreviation: 'P' } },
      },
    };

    render(
      <MemoryRouter>
        <LanguageProvider>
          <FieldAlignmentDiagram teamBox={swapped} teamName="Texas Rangers" />
        </LanguageProvider>
      </MemoryRouter>
    );

    // Only the current occupant is charted, annotated with who he replaced
    expect(screen.getAllByText('Josh Smith').length).toBeGreaterThan(0);
    // Rendered twice on purpose: the SVG tooltip and the narrow-screen list
    expect(screen.getAllByText(/替下 Marcus Semien/).length).toBe(2);
  });

  it('marks a slot as position-pending rather than leaving a hole on the field', () => {
    const pending = {
      pitchers: [90],
      players: {
        ID40: {
          person: { id: 40, fullName: 'Marcus Semien' },
          position: { abbreviation: '2B' },
          allPositions: [{ abbreviation: '2B' }],
          battingOrder: '400',
        },
        ID41: {
          person: { id: 41, fullName: 'Pinch Runner' },
          position: { abbreviation: 'PR' },
          allPositions: [{ abbreviation: 'PR' }],
          battingOrder: '401',
        },
        ID90: { person: { id: 90, fullName: 'Kirby Yates' }, position: { abbreviation: 'P' } },
      },
    };

    render(
      <MemoryRouter>
        <LanguageProvider>
          <FieldAlignmentDiagram teamBox={pending} teamName="Texas Rangers" />
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(screen.getAllByText('Pinch Runner').length).toBeGreaterThan(0);
    expect(screen.getByText('(守位待定)')).toBeInTheDocument();
  });
});
