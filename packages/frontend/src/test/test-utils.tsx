/**
 * Test utilities and providers for page component tests
 */
import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

interface WrapperProps {
    children: React.ReactNode;
}

/**
 * Wrapper with BrowserRouter for standard rendering
 */
function BrowserRouterWrapper({ children }: WrapperProps) {
    return <BrowserRouter>{children}</BrowserRouter>;
}

/**
 * Render with BrowserRouter context
 */
export function renderWithRouter(
    ui: React.ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    return rtlRender(ui, { wrapper: BrowserRouterWrapper, ...options });
}

/**
 * Render with MemoryRouter at a specific route
 */
export function renderWithMemoryRouter(
    ui: React.ReactElement,
    { initialEntries = ['/'], ...options }: { initialEntries?: string[] } & Omit<RenderOptions, 'wrapper'> = {}
) {
    function MemoryRouterWrapper({ children }: WrapperProps) {
        return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
    }

    return rtlRender(ui, { wrapper: MemoryRouterWrapper, ...options });
}

// Re-export testing-library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
