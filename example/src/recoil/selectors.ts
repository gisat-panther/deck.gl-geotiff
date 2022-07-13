import { useMemo } from 'react';
import { useAtoms } from './useAtoms';

export const useSelectors = () => {
  const { atomUploaded, atomOpacity } = useAtoms();

  const uploaded = useMemo(() => atomUploaded, [atomUploaded]);
  const opacity = useMemo(() => atomOpacity, [atomOpacity]);

  return { uploaded, opacity };
};
