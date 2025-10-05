import { createContext } from 'react';
import { RoleContextType } from './RoleContext.types';

export const RoleContext = createContext<RoleContextType | undefined>(undefined);
