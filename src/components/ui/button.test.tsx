import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './button';

describe('Button primitive', () => {
  it('keeps the glass variant and insightflare attributes on the native button', () => {
    render(
      <Button variant="glassSecondary" data-insightflare-event="ui_button_test">
        保存
      </Button>,
    );

    const button = screen.getByRole('button', { name: '保存' });
    expect(button).toHaveClass('btn-glass-secondary');
    expect(button).toHaveAttribute('data-insightflare-event', 'ui_button_test');
    expect(button).toHaveAttribute('type', 'button');
  });
});
