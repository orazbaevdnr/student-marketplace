import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Lightbox } from './Lightbox';

const FIVE_IMAGES = ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg', 'e.jpg'];

describe('Lightbox', () => {
  it('opens at the requested photo, moves with the arrows and wraps at both ends', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const proto = HTMLElement.prototype as unknown as {
      setPointerCapture?: (pointerId: number) => void;
    };
    const originalCapture = proto.setPointerCapture;
    const capture = vi.fn();
    proto.setPointerCapture = capture;

    try {
      render(<Lightbox images={FIVE_IMAGES} startIndex={2} onClose={onClose} />);

      expect(screen.getByText('3 / 5')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Listing photo 3 of 5' })).toHaveAttribute(
        'src',
        'c.jpg'
      );

      await user.click(screen.getByRole('button', { name: 'Next photo' }));
      expect(screen.getByText('4 / 5')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Listing photo 4 of 5' })).toHaveAttribute(
        'src',
        'd.jpg'
      );

      await user.click(screen.getByRole('button', { name: 'Next photo' }));
      expect(screen.getByText('5 / 5')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Next photo' }));
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Listing photo 1 of 5' })).toHaveAttribute(
        'src',
        'a.jpg'
      );

      await user.click(screen.getByRole('button', { name: 'Previous photo' }));
      expect(screen.getByText('5 / 5')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Listing photo 5 of 5' })).toHaveAttribute(
        'src',
        'e.jpg'
      );

      // Regression: capturing the pointer on the stage retargets the click away
      // from the arrow, so the viewer closed instead of showing the next photo.
      expect(capture).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    } finally {
      if (originalCapture) {
        proto.setPointerCapture = originalCapture;
      } else {
        delete proto.setPointerCapture;
      }
    }
  });

  it('closes on Escape, advances with ArrowRight and a swipe, and hides arrows for one photo', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { unmount } = render(
      <Lightbox images={FIVE_IMAGES} startIndex={0} onClose={onClose} />
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('2 / 5')).toBeInTheDocument();

    const surface = screen.getByTestId('lightbox-surface');
    fireEvent.pointerDown(surface, { clientX: 250 });
    fireEvent.pointerMove(surface, { clientX: 150 });
    fireEvent.pointerUp(surface, { clientX: 150 });
    expect(screen.getByText('3 / 5')).toBeInTheDocument();

    // A swipe ends with a click on the stage; it must not close the viewer.
    fireEvent.click(surface);
    expect(screen.getByText('3 / 5')).toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);

    unmount();

    render(<Lightbox images={['only.jpg']} startIndex={0} onClose={vi.fn()} />);

    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous photo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next photo' })).not.toBeInTheDocument();
  });
});
