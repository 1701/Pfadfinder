// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FeedbackPanel } from '../../../src/ui/components/FeedbackPanel';
import { singleChoice } from '../../fixtures/items';

const { feedback } = singleChoice;

describe('FeedbackPanel', () => {
  it('confirms a correct answer without the misconception', () => {
    render(<FeedbackPanel correct feedback={feedback} onNext={() => {}} />);
    expect(screen.getByRole('heading').textContent).toBe('Richtig.');
    expect(screen.getByText(feedback.correct.replace(/(\d) (?=\d{3})/g, '$1\u00a0'))).toBeTruthy();
    expect(screen.queryByText(feedback.misconception!)).toBeNull();
  });

  it('says "Noch nicht ganz", explains and names the misconception – never "Falsch"', () => {
    const { container } = render(
      <FeedbackPanel correct={false} feedback={feedback} onNext={() => {}} />,
    );
    expect(screen.getByRole('heading').textContent).toBe('Noch nicht ganz.');
    expect(container.textContent).toContain(feedback.incorrect);
    expect(container.textContent).toContain(feedback.misconception);
    expect(container.textContent).not.toMatch(/falsch/i);
  });

  it('focuses "Weiter", which describes the message and calls onNext', async () => {
    const onNext = vi.fn();
    render(<FeedbackPanel correct={false} feedback={feedback} onNext={onNext} />);
    const weiter = screen.getByRole('button', { name: 'Weiter' });
    expect(document.activeElement).toBe(weiter);
    expect(weiter.getAttribute('aria-describedby')).toBe(screen.getByRole('status').id);
    await userEvent.click(weiter);
    expect(onNext).toHaveBeenCalledOnce();
  });
});
