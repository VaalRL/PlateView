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

    // Only the current occupant is charted
    expect(screen.getAllByText('Josh Smith').length).toBeGreaterThan(0);
    // Who he came in for lives in the node's tooltip; the lineup board beside
    // the chart spells the chain out in full, so the compact list stays clean
    expect(screen.getAllByText(/替下 Marcus Semien/).length).toBe(1);
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

  it('paints the field from theme tokens that follow dark and light mode', () => {
    const { container } = renderDiagram();
    const svg = container.querySelector('svg')!;

    // Each surface reads a CSS variable that :root and .dark both define
    expect(svg.querySelector('.fill-field-grass')).toBeInTheDocument();
    expect(svg.querySelector('.fill-field-dirt')).toBeInTheDocument();
    expect(svg.querySelector('.fill-field-infield')).toBeInTheDocument();
    expect(svg.querySelector('.fill-field-line')).toBeInTheDocument();
  });

  it('draws a generic arc when the venue publishes no dimensions', () => {
    const { container } = renderDiagram();
    const grass = container.querySelector('.fill-field-grass')!;

    // The fallback is the fixed 250-unit arc from before venues were wired in
    expect(grass.getAttribute('d')).toContain('A 250 250');
    expect(screen.queryByText(/依官方公布之全壘打牆距離/)).not.toBeInTheDocument();
  });

  it('shapes the outfield wall from the published fence distances', () => {
    const { container } = render(
      <MemoryRouter>
        <LanguageProvider>
          <FieldAlignmentDiagram
            teamBox={teamBox}
            teamName="Pittsburgh Pirates"
            venueName="PNC Park"
            fieldInfo={{
              leftLine: 325,
              left: 389,
              leftCenter: 410,
              center: 399,
              rightCenter: 375,
              rightLine: 320,
            }}
          />
        </LanguageProvider>
      </MemoryRouter>
    );

    const grass = container.querySelector('.fill-field-grass')!;
    // A measured wall is a spline, never the generic arc
    expect(grass.getAttribute('d')).not.toContain('A 250 250');
    expect(grass.getAttribute('d')).toContain('Q ');

    // The chart says where the numbers came from
    expect(screen.getByText('PNC Park')).toBeInTheDocument();
    expect(screen.getByText('325 · 389 · 410 · 399 · 375 · 320')).toBeInTheDocument();
    expect(screen.getByText(/非球場平面圖/)).toBeInTheDocument();
  });

  it('pulls an outfielder in when his corner of the wall is short', () => {
    const shortRight = {
      leftLine: 310,
      leftCenter: 379,
      center: 420,
      rightCenter: 380,
      rightLine: 302,
    };

    const { container } = render(
      <MemoryRouter>
        <LanguageProvider>
          <FieldAlignmentDiagram teamBox={teamBox} teamName="Boston Red Sox" fieldInfo={shortRight} />
        </LanguageProvider>
      </MemoryRouter>
    );

    // Centre field is the deepest wall here, so the centre fielder plays deepest
    const svg = container.querySelector('svg')!;
    const labels = [...svg.querySelectorAll('text')].filter((el) =>
      ['LF', 'CF', 'RF'].includes(el.textContent || '')
    );
    const byPosition = Object.fromEntries(
      labels.map((el) => [el.textContent, Number(el.getAttribute('y'))])
    );

    // Smaller y is deeper into the outfield
    expect(byPosition.CF).toBeLessThan(byPosition.LF);
    expect(byPosition.CF).toBeLessThan(byPosition.RF);
  });
});
