/**
 * Card Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

describe('Card', () => {
    it('should render with children', () => {
        render(<Card>Card content</Card>);
        expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should apply default variant styles', () => {
        render(<Card data-testid="card">Content</Card>);
        expect(screen.getByTestId('card')).toHaveClass('shadow-md');
    });

    it('should apply neo variant', () => {
        render(<Card variant="neo" data-testid="card">Neo Card</Card>);
        expect(screen.getByTestId('card')).toHaveClass('bg-neo-yellow');
    });

    it('should apply neoBlue variant', () => {
        render(<Card variant="neoBlue" data-testid="card">Blue Card</Card>);
        expect(screen.getByTestId('card')).toHaveClass('bg-neo-blue');
    });

    it('should accept custom className', () => {
        render(<Card className="custom-class" data-testid="card">Custom</Card>);
        expect(screen.getByTestId('card')).toHaveClass('custom-class');
    });

    it('should forward ref correctly', () => {
        const ref = vi.fn();
        render(<Card ref={ref}>With Ref</Card>);
        expect(ref).toHaveBeenCalled();
    });
});

describe('CardHeader', () => {
    it('should render with children', () => {
        render(<CardHeader>Header content</CardHeader>);
        expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('should have proper spacing classes', () => {
        render(<CardHeader data-testid="header">Header</CardHeader>);
        expect(screen.getByTestId('header')).toHaveClass('p-6');
    });
});

describe('CardTitle', () => {
    it('should render as h3', () => {
        render(<CardTitle>Title</CardTitle>);
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title');
    });

    it('should have bold styling', () => {
        render(<CardTitle data-testid="title">Title</CardTitle>);
        expect(screen.getByTestId('title')).toHaveClass('font-bold');
    });
});

describe('CardDescription', () => {
    it('should render with muted styling', () => {
        render(<CardDescription data-testid="desc">Description</CardDescription>);
        expect(screen.getByTestId('desc')).toHaveClass('text-muted-foreground');
    });
});

describe('CardContent', () => {
    it('should render with proper padding', () => {
        render(<CardContent data-testid="content">Content</CardContent>);
        expect(screen.getByTestId('content')).toHaveClass('p-6');
    });
});

describe('CardFooter', () => {
    it('should render with flex layout', () => {
        render(<CardFooter data-testid="footer">Footer</CardFooter>);
        expect(screen.getByTestId('footer')).toHaveClass('flex');
    });
});

describe('Card composition', () => {
    it('should compose all subcomponents correctly', () => {
        render(
            <Card data-testid="card">
                <CardHeader>
                    <CardTitle>Test Title</CardTitle>
                    <CardDescription>Test Description</CardDescription>
                </CardHeader>
                <CardContent>Test Content</CardContent>
                <CardFooter>Test Footer</CardFooter>
            </Card>
        );

        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Title');
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        expect(screen.getByText('Test Content')).toBeInTheDocument();
        expect(screen.getByText('Test Footer')).toBeInTheDocument();
    });
});
