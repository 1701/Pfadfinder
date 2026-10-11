// Import first in every Testing Library test (environment jsdom via docblock).
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);
