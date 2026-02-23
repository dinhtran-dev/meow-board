import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Meow Board title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Meow Board/i);
  expect(titleElement).toBeInTheDocument();
});
