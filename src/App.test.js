import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Elderlyze hero heading', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /elderlyze/i });
  expect(heading).toBeInTheDocument();
});
