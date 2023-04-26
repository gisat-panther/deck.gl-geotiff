import { useRecoilState } from 'recoil'
import { AtomUploaded, AtomOpacity } from './atoms'
export const useAtoms = () => {
    const [atomUploaded, setAtomUploaded] = useRecoilState(AtomUploaded)
    const [atomOpacity, setAtomOpacity] = useRecoilState(AtomOpacity)
    return { atomUploaded, setAtomUploaded, atomOpacity, setAtomOpacity }
}
