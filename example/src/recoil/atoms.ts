import { atom } from 'recoil'

export const AtomUploaded = atom<string>({
    key: 'uploaded',
    default: ''
})

export const AtomOpacity = atom<number>({
    key: 'opacity',
    default: 255
})
