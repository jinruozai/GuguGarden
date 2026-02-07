import { PatternType } from '../types';

interface PatternDef {
    name: string;
    svg: string; 
    backgroundSize: string;
}

// Base color for patterns (Muted Warm Grey)
const COLOR = '%238a817c'; 
const OPACITY = '0.15';

export const PATTERNS: Record<PatternType, PatternDef> = {
    none: { 
        name: '纯色', 
        svg: '', 
        backgroundSize: '0' 
    },
    dots: {
        name: '波点',
        svg: `data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='${COLOR}' fill-opacity='${OPACITY}'/%3E%3C/svg%3E`,
        backgroundSize: '20px 20px'
    },
    grid: {
        name: '方格',
        svg: `data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='none' stroke='${COLOR}' stroke-opacity='${OPACITY}' stroke-width='1'/%3E%3C/svg%3E`,
        backgroundSize: '40px 40px'
    },
    stars: {
        name: '星星',
        svg: `data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z' fill='${COLOR}' fill-opacity='${OPACITY}'/%3E%3C/svg%3E`,
        backgroundSize: '32px 32px'
    },
    flowers: {
        name: '小花',
        svg: `data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4-4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z' fill='${COLOR}' fill-opacity='${OPACITY}'/%3E%3C/svg%3E`,
        backgroundSize: '32px 32px'
    },
    hearts: {
        name: '爱心',
        svg: `data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' fill='${COLOR}' fill-opacity='${OPACITY}'/%3E%3C/svg%3E`,
        backgroundSize: '32px 32px'
    }
};
