/**
 * NotFound Page Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithMemoryRouter } from '@/test/test-utils';
import NotFound from './NotFound';

describe('NotFound Page', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('should render 404 heading', () => {
        renderWithMemoryRouter(<NotFound />, { initialEntries: ['/unknown-route'] });
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404');
    });

    it('should display page not found message', () => {
        renderWithMemoryRouter(<NotFound />);
        expect(screen.getByText(/page not found/i)).toBeInTheDocument();
    });

    it('should have a link to return home', () => {
        renderWithMemoryRouter(<NotFound />);
        const link = screen.getByRole('link', { name: /return to home/i });
        expect(link).toHaveAttribute('href', '/');
    });

    it('should log error to console', () => {
        renderWithMemoryRouter(<NotFound />, { initialEntries: ['/bad-path'] });
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('404 Error'),
            expect.any(String)
        );
    });

    it('should have proper styling', () => {
        renderWithMemoryRouter(<NotFound />);
        // Main container should be full height and centered
        const container = screen.getByText('404').closest('div');
        expect(container).toHaveClass('text-center');
    });
});
