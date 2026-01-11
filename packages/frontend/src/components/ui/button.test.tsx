/**
 * Button Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
    it('should render with children', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should handle click events', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();

        render(<Button onClick={handleClick}>Click me</Button>);
        await user.click(screen.getByRole('button'));

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should apply variant classes', () => {
        const { rerender } = render(<Button variant="destructive">Delete</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-destructive');

        rerender(<Button variant="secondary">Secondary</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-secondary');
    });

    it('should apply neo variants correctly', () => {
        const { rerender } = render(<Button variant="neo">Neo</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-neo-yellow');

        rerender(<Button variant="neoBlue">Blue</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-neo-blue');
    });

    it('should apply size classes', () => {
        const { rerender } = render(<Button size="sm">Small</Button>);
        expect(screen.getByRole('button')).toHaveClass('h-8');

        rerender(<Button size="lg">Large</Button>);
        expect(screen.getByRole('button')).toHaveClass('h-10');
    });

    it('should render without shadow when shadow=false', () => {
        render(<Button shadow={false}>No Shadow</Button>);
        // Without shadow, button should have m-[3px] class
        expect(screen.getByRole('button')).toHaveClass('m-[3px]');
    });

    it('should accept custom className', () => {
        render(<Button className="custom-class">Custom</Button>);
        expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('should forward ref correctly', () => {
        const ref = vi.fn();
        render(<Button ref={ref}>With Ref</Button>);
        expect(ref).toHaveBeenCalled();
    });

    it('should have button data-slot attribute', () => {
        render(<Button>With Slot</Button>);
        expect(screen.getByRole('button')).toHaveAttribute('data-slot', 'button');
    });
});
