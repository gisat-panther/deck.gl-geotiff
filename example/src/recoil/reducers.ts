import { useAtoms } from './useAtoms';

export const useReducer = () => {
  const { setAtomUploaded, setAtomOpacity } = useAtoms();

  const updateUploaded = (val: string) => setAtomUploaded(val);
  const updateOpacity = (val: number) => setAtomOpacity(val);

  return { updateUploaded, updateOpacity };
};
