// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../../../src/ui/components/Button';

describe('Button', () => {
  it('is a plain button that reports clicks', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Zur Übersicht</Button>);
    const button = screen.getByRole('button', { name: 'Zur Übersicht' });
    expect(button.getAttribute('type')).toBe('button');
    expect(button.className).toContain('min-h-touch');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('primary: 56 px high, fixed width, no clicks while disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button variant="primary" disabled onClick={onClick}>
        Prüfen
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Prüfen' }) as HTMLButtonElement;
    expect(button.className).toContain('min-h-primary');
    expect(button.className).toContain('min-w-action');
    expect(button.disabled).toBe(true);
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('fill: 56 px high, width from its grid cell (no fixed width)', () => {
    render(<Button size="fill">Noch nicht</Button>);
    const button = screen.getByRole('button', { name: 'Noch nicht' });
    expect(button.className).toContain('min-h-primary');
    expect(button.className).not.toContain('min-w-action');
  });
});
