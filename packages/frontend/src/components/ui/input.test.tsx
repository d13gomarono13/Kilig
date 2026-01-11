/**
 * Input Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input', () => {
    it('should render an input element', () => {
        render(<Input placeholder="Enter text" />);
        expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should handle text input', async () => {
        const user = userEvent.setup();
        render(<Input data-testid="input" />);

        const input = screen.getByTestId('input');
        await user.type(input, 'Hello World');

        expect(input).toHaveValue('Hello World');
    });

    it('should handle onChange events', async () => {
        const handleChange = vi.fn();
        const user = userEvent.setup();

        render(<Input onChange={handleChange} data-testid="input" />);
        await user.type(screen.getByTestId('input'), 'a');

        expect(handleChange).toHaveBeenCalled();
    });

    it('should be disabled when disabled prop is true', () => {
        render(<Input disabled data-testid="input" />);
        expect(screen.getByTestId('input')).toBeDisabled();
    });

    it('should apply different input types', () => {
        const { rerender } = render(<Input type="email" data-testid="input" />);
        expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');

        rerender(<Input type="password" data-testid="input" />);
        expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');

        rerender(<Input type="number" data-testid="input" />);
        expect(screen.getByTestId('input')).toHaveAttribute('type', 'number');
    });

    it('should accept custom className', () => {
        render(<Input className="custom-class" data-testid="input" />);
        expect(screen.getByTestId('input')).toHaveClass('custom-class');
    });

    it('should forward ref correctly', () => {
        const ref = vi.fn();
        render(<Input ref={ref} />);
        expect(ref).toHaveBeenCalled();
    });

    it('should have border and shadow styling', () => {
        render(<Input data-testid="input" />);
        const input = screen.getByTestId('input');
        expect(input).toHaveClass('border-2');
        expect(input).toHaveClass('shadow-md');
    });

    it('should support aria-invalid for error states', () => {
        render(<Input aria-invalid="true" data-testid="input" />);
        expect(screen.getByTestId('input')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have proper height', () => {
        render(<Input data-testid="input" />);
        expect(screen.getByTestId('input')).toHaveClass('h-10');
    });
});
