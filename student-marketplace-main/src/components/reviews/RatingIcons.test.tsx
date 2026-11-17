import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RatingIcons } from './RatingIcons';

function ControlledRating({ onChange }: { onChange: (value: 1 | 2 | 3 | 4 | 5) => void }) {
  const [value, setValue] = useState<1 | 2 | 3 | 4 | 5>(3);

  return (
    <RatingIcons
      value={value}
      interactive
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('RatingIcons', () => {
  it('reports a click on four caps and ArrowRight to five', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<ControlledRating onChange={onChange} />);

    const fourCaps = screen.getByRole('radio', { name: '4 stars' });
    await user.click(fourCaps);
    expect(onChange).toHaveBeenCalledWith(4);

    fourCaps.focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith(5);
  });
});
