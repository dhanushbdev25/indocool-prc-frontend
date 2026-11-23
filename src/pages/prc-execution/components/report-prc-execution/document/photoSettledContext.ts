import { createContext } from 'react';

/** Each photo calls this once, when it has loaded or failed, so Print can wait for all of them. */
export const PhotoSettledContext = createContext<(key: string) => void>(() => {});
