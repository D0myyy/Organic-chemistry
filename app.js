// Three.js scene setup
let scene, camera, renderer, molecule, controls;
let isRotating = true;
let currentStyle = 'ballStick';

// Molecule database with 3D coordinates
const molecules = {
    methane: {
        name: 'Metan',
        formula: 'CH₄',
        description: 'Cel mai simplu alcan, o moleculă tetraedrică cu un atom de carbon legat la patru atomi de hidrogen.',
        atoms: [
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'H', x: 0.63, y: 0.63, z: 0.63 },
            { element: 'H', x: -0.63, y: -0.63, z: 0.63 },
            { element: 'H', x: -0.63, y: 0.63, z: -0.63 },
            { element: 'H', x: 0.63, y: -0.63, z: -0.63 }
        ],
        bonds: [[0,1], [0,2], [0,3], [0,4]]
    },
    ethane: {
        name: 'Etan',
        formula: 'C₂H₆',
        description: 'Doi atomi de carbon conectați printr-o legătură simplă, fiecare legat la trei atomi de hidrogen.',
        atoms: [
            { element: 'C', x: -0.76, y: 0, z: 0 },
            { element: 'C', x: 0.76, y: 0, z: 0 },
            { element: 'H', x: -1.16, y: 0.89, z: 0.51 },
            { element: 'H', x: -1.16, y: -0.97, z: 0.26 },
            { element: 'H', x: -1.16, y: 0.08, z: -1.03 },
            { element: 'H', x: 1.16, y: 0.89, z: -0.51 },
            { element: 'H', x: 1.16, y: -0.97, z: -0.26 },
            { element: 'H', x: 1.16, y: 0.08, z: 1.03 }
        ],
        bonds: [[0,1], [0,2], [0,3], [0,4], [1,5], [1,6], [1,7]]
    },
    propane: {
        name: 'Propan',
        formula: 'C₃H₈',
        description: 'Un lanț alcan cu trei carboni, utilizat frecvent ca combustibil.',
        atoms: [
            { element: 'C', x: -1.27, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.27, y: 0, z: 0 },
            { element: 'H', x: -1.67, y: 0.89, z: 0.51 },
            { element: 'H', x: -1.67, y: -0.97, z: 0.26 },
            { element: 'H', x: -1.67, y: 0.08, z: -1.03 },
            { element: 'H', x: 0, y: 0.89, z: -0.51 },
            { element: 'H', x: 0, y: -0.89, z: 0.51 },
            { element: 'H', x: 1.67, y: 0.89, z: -0.51 },
            { element: 'H', x: 1.67, y: -0.97, z: -0.26 },
            { element: 'H', x: 1.67, y: 0.08, z: 1.03 }
        ],
        bonds: [[0,1], [1,2], [0,3], [0,4], [0,5], [1,6], [1,7], [2,8], [2,9], [2,10]]
    },
    butane: {
        name: 'Butan',
        formula: 'C₄H₁₀',
        description: 'Un alcan cu patru carboni utilizat în brichete și ca refrigerent.',
        atoms: [
            { element: 'C', x: -1.91, y: 0, z: 0 },
            { element: 'C', x: -0.64, y: 0, z: 0 },
            { element: 'C', x: 0.64, y: 0, z: 0 },
            { element: 'C', x: 1.91, y: 0, z: 0 },
            { element: 'H', x: -2.31, y: 0.89, z: 0.51 },
            { element: 'H', x: -2.31, y: -0.89, z: 0.51 },
            { element: 'H', x: -2.31, y: 0, z: -1.03 },
            { element: 'H', x: -0.64, y: 0.89, z: -0.51 },
            { element: 'H', x: -0.64, y: -0.89, z: 0.51 },
            { element: 'H', x: 0.64, y: 0.89, z: 0.51 },
            { element: 'H', x: 0.64, y: -0.89, z: -0.51 },
            { element: 'H', x: 2.31, y: 0.89, z: -0.51 },
            { element: 'H', x: 2.31, y: -0.89, z: -0.51 },
            { element: 'H', x: 2.31, y: 0, z: 1.03 }
        ],
        bonds: [[0,1], [1,2], [2,3], [0,4], [0,5], [0,6], [1,7], [1,8], [2,9], [2,10], [3,11], [3,12], [3,13]]
    },
    pentane: {
        name: 'Pentan',
        formula: 'C₅H₁₂',
        description: 'Un alcan cu cinci carboni, component al benzinei.',
        atoms: [
            { element: 'C', x: -2.54, y: 0, z: 0 },
            { element: 'C', x: -1.27, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.27, y: 0, z: 0 },
            { element: 'C', x: 2.54, y: 0, z: 0 },
            { element: 'H', x: -2.94, y: 0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: -0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: 0, z: -1.03 },
            { element: 'H', x: -1.27, y: 0.89, z: -0.51 },
            { element: 'H', x: -1.27, y: -0.89, z: 0.51 },
            { element: 'H', x: 0, y: 0.89, z: 0.51 },
            { element: 'H', x: 0, y: -0.89, z: -0.51 },
            { element: 'H', x: 1.27, y: 0.89, z: -0.51 },
            { element: 'H', x: 1.27, y: -0.89, z: 0.51 },
            { element: 'H', x: 2.94, y: 0.89, z: -0.51 },
            { element: 'H', x: 2.94, y: -0.89, z: -0.51 },
            { element: 'H', x: 2.94, y: 0, z: 1.03 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,4], [0,5], [0,6], [0,7], [1,8], [1,9], [2,10], [2,11], [3,12], [3,13], [4,14], [4,15], [4,16]]
    },
    hexane: {
        name: 'Hexan',
        formula: 'C₆H₁₄',
        description: 'Un alcan cu șase carboni utilizat ca solvent.',
        atoms: [
            { element: 'C', x: -3.18, y: 0, z: 0 },
            { element: 'C', x: -1.91, y: 0, z: 0 },
            { element: 'C', x: -0.64, y: 0, z: 0 },
            { element: 'C', x: 0.64, y: 0, z: 0 },
            { element: 'C', x: 1.91, y: 0, z: 0 },
            { element: 'C', x: 3.18, y: 0, z: 0 },
            { element: 'H', x: -3.58, y: 0.89, z: 0.51 },
            { element: 'H', x: -3.58, y: -0.89, z: 0.51 },
            { element: 'H', x: -3.58, y: 0, z: -1.03 },
            { element: 'H', x: -1.91, y: 0.89, z: -0.51 },
            { element: 'H', x: -1.91, y: -0.89, z: 0.51 },
            { element: 'H', x: -0.64, y: 0.89, z: 0.51 },
            { element: 'H', x: -0.64, y: -0.89, z: -0.51 },
            { element: 'H', x: 0.64, y: 0.89, z: -0.51 },
            { element: 'H', x: 0.64, y: -0.89, z: 0.51 },
            { element: 'H', x: 1.91, y: 0.89, z: 0.51 },
            { element: 'H', x: 1.91, y: -0.89, z: -0.51 },
            { element: 'H', x: 3.58, y: 0.89, z: -0.51 },
            { element: 'H', x: 3.58, y: -0.89, z: -0.51 },
            { element: 'H', x: 3.58, y: 0, z: 1.03 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [0,6], [0,7], [0,8], [1,9], [1,10], [2,11], [2,12], [3,13], [3,14], [4,15], [4,16], [5,17], [5,18], [5,19]]
    },
    heptane: {
        name: 'Heptan',
        formula: 'C₇H₁₆',
        description: 'Un alcan cu șapte carboni utilizat în testarea combustibililor.',
        atoms: [
            { element: 'C', x: -3.81, y: 0, z: 0 },
            { element: 'C', x: -2.54, y: 0, z: 0 },
            { element: 'C', x: -1.27, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.27, y: 0, z: 0 },
            { element: 'C', x: 2.54, y: 0, z: 0 },
            { element: 'C', x: 3.81, y: 0, z: 0 },
            { element: 'H', x: -4.21, y: 0.89, z: 0.51 },
            { element: 'H', x: -4.21, y: -0.89, z: 0.51 },
            { element: 'H', x: -4.21, y: 0, z: -1.03 },
            { element: 'H', x: -2.54, y: 0.89, z: -0.51 },
            { element: 'H', x: -2.54, y: -0.89, z: 0.51 },
            { element: 'H', x: -1.27, y: 0.89, z: 0.51 },
            { element: 'H', x: -1.27, y: -0.89, z: -0.51 },
            { element: 'H', x: 0, y: 0.89, z: -0.51 },
            { element: 'H', x: 0, y: -0.89, z: 0.51 },
            { element: 'H', x: 1.27, y: 0.89, z: 0.51 },
            { element: 'H', x: 1.27, y: -0.89, z: -0.51 },
            { element: 'H', x: 2.54, y: 0.89, z: -0.51 },
            { element: 'H', x: 2.54, y: -0.89, z: 0.51 },
            { element: 'H', x: 4.21, y: 0.89, z: -0.51 },
            { element: 'H', x: 4.21, y: -0.89, z: -0.51 },
            { element: 'H', x: 4.21, y: 0, z: 1.03 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [0,7], [0,8], [0,9], [1,10], [1,11], [2,12], [2,13], [3,14], [3,15], [4,16], [4,17], [5,18], [5,19], [6,20], [6,21], [6,22]]
    },
    octane: {
        name: 'Octan',
        formula: 'C₈H₁₈',
        description: 'Un alcan cu opt carboni, component cheie în evaluarea octanică a benzinei.',
        atoms: [
            { element: 'C', x: -4.45, y: 0, z: 0 },
            { element: 'C', x: -3.18, y: 0, z: 0 },
            { element: 'C', x: -1.91, y: 0, z: 0 },
            { element: 'C', x: -0.64, y: 0, z: 0 },
            { element: 'C', x: 0.64, y: 0, z: 0 },
            { element: 'C', x: 1.91, y: 0, z: 0 },
            { element: 'C', x: 3.18, y: 0, z: 0 },
            { element: 'C', x: 4.45, y: 0, z: 0 },
            { element: 'H', x: -4.85, y: 0.89, z: 0.51 },
            { element: 'H', x: -4.85, y: -0.89, z: 0.51 },
            { element: 'H', x: -4.85, y: 0, z: -1.03 },
            { element: 'H', x: -3.18, y: 0.89, z: -0.51 },
            { element: 'H', x: -3.18, y: -0.89, z: 0.51 },
            { element: 'H', x: -1.91, y: 0.89, z: 0.51 },
            { element: 'H', x: -1.91, y: -0.89, z: -0.51 },
            { element: 'H', x: -0.64, y: 0.89, z: -0.51 },
            { element: 'H', x: -0.64, y: -0.89, z: 0.51 },
            { element: 'H', x: 0.64, y: 0.89, z: 0.51 },
            { element: 'H', x: 0.64, y: -0.89, z: -0.51 },
            { element: 'H', x: 1.91, y: 0.89, z: -0.51 },
            { element: 'H', x: 1.91, y: -0.89, z: 0.51 },
            { element: 'H', x: 3.18, y: 0.89, z: 0.51 },
            { element: 'H', x: 3.18, y: -0.89, z: -0.51 },
            { element: 'H', x: 4.85, y: 0.89, z: -0.51 },
            { element: 'H', x: 4.85, y: -0.89, z: -0.51 },
            { element: 'H', x: 4.85, y: 0, z: 1.03 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [6,7], [0,8], [0,9], [0,10], [1,11], [1,12], [2,13], [2,14], [3,15], [3,16], [4,17], [4,18], [5,19], [5,20], [6,21], [6,22], [7,23], [7,24], [7,25]]
    },
    ethene: {
        name: 'Etenă (Etilenă)',
        formula: 'C₂H₄',
        description: 'Cea mai simplă alchenă cu o legătură dublă carbon-carbon.',
        atoms: [
            { element: 'C', x: -0.66, y: 0, z: 0 },
            { element: 'C', x: 0.66, y: 0, z: 0 },
            { element: 'H', x: -1.23, y: 0.93, z: 0 },
            { element: 'H', x: -1.23, y: -0.93, z: 0 },
            { element: 'H', x: 1.23, y: 0.93, z: 0 },
            { element: 'H', x: 1.23, y: -0.93, z: 0 }
        ],
        bonds: [[0,1,'double'], [0,2], [0,3], [1,4], [1,5]]
    },
    propene: {
        name: 'Propenă (Propilenă)',
        formula: 'C₃H₆',
        description: 'O alchenă cu trei carboni utilizată în producția de polimeri.',
        atoms: [
            { element: 'C', x: -1.33, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.27, y: 0, z: 0 },
            { element: 'H', x: -1.90, y: 0.93, z: 0 },
            { element: 'H', x: -1.90, y: -0.93, z: 0 },
            { element: 'H', x: 0, y: 1.09, z: 0 },
            { element: 'H', x: 1.67, y: 0.89, z: 0.51 },
            { element: 'H', x: 1.67, y: -0.89, z: 0.51 },
            { element: 'H', x: 1.67, y: 0, z: -1.03 }
        ],
        bonds: [[0,1,'double'], [1,2], [0,3], [0,4], [1,5], [2,6], [2,7], [2,8]]
    },
    butene: {
        name: '1-Butenă',
        formula: 'C₄H₈',
        description: 'O alchenă cu patru carboni cu legătura dublă la prima poziție.',
        atoms: [
            { element: 'C', x: -2.0, y: 0, z: 0 },
            { element: 'C', x: -0.67, y: 0, z: 0 },
            { element: 'C', x: 0.64, y: 0, z: 0 },
            { element: 'C', x: 1.91, y: 0, z: 0 },
            { element: 'H', x: -2.57, y: 0.93, z: 0 },
            { element: 'H', x: -2.57, y: -0.93, z: 0 },
            { element: 'H', x: -0.67, y: 1.09, z: 0 },
            { element: 'H', x: 0.64, y: 0.89, z: -0.51 },
            { element: 'H', x: 0.64, y: -0.89, z: 0.51 },
            { element: 'H', x: 2.31, y: 0.89, z: 0.51 },
            { element: 'H', x: 2.31, y: -0.89, z: 0.51 },
            { element: 'H', x: 2.31, y: 0, z: -1.03 }
        ],
        bonds: [[0,1,'double'], [1,2], [2,3], [0,4], [0,5], [1,6], [2,7], [2,8], [3,9], [3,10], [3,11]]
    },
    ethyne: {
        name: 'Etină (Acetilenă)',
        formula: 'C₂H₂',
        description: 'Cea mai simplă alchină cu o legătură triplă carbon-carbon.',
        atoms: [
            { element: 'C', x: -0.6, y: 0, z: 0 },
            { element: 'C', x: 0.6, y: 0, z: 0 },
            { element: 'H', x: -1.66, y: 0, z: 0 },
            { element: 'H', x: 1.66, y: 0, z: 0 }
        ],
        bonds: [[0,1,'triple'], [0,2], [1,3]]
    },
    propyne: {
        name: 'Propină',
        formula: 'C₃H₄',
        description: 'O alchină cu trei carboni cu o legătură triplă terminală.',
        atoms: [
            { element: 'C', x: -1.27, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.2, y: 0, z: 0 },
            { element: 'H', x: -1.67, y: 0.89, z: 0.51 },
            { element: 'H', x: -1.67, y: -0.89, z: 0.51 },
            { element: 'H', x: -1.67, y: 0, z: -1.03 },
            { element: 'H', x: 2.26, y: 0, z: 0 }
        ],
        bonds: [[0,1], [1,2,'triple'], [0,3], [0,4], [0,5], [2,6]]
    },
    cyclopropane: {
        name: 'Ciclopropan',
        formula: 'C₃H₆',
        description: 'O structură în inel cu trei membri, foarte tensionată.',
        atoms: [
            { element: 'C', x: 0, y: 0.58, z: 0 },
            { element: 'C', x: -0.5, y: -0.29, z: 0 },
            { element: 'C', x: 0.5, y: -0.29, z: 0 },
            { element: 'H', x: 0, y: 1.18, z: 0.9 },
            { element: 'H', x: 0, y: 1.18, z: -0.9 },
            { element: 'H', x: -1.0, y: -0.59, z: 0.9 },
            { element: 'H', x: -1.0, y: -0.59, z: -0.9 },
            { element: 'H', x: 1.0, y: -0.59, z: 0.9 },
            { element: 'H', x: 1.0, y: -0.59, z: -0.9 }
        ],
        bonds: [[0,1], [1,2], [2,0], [0,3], [0,4], [1,5], [1,6], [2,7], [2,8]]
    },
    cyclohexane: {
        name: 'Ciclohexan',
        formula: 'C₆H₁₂',
        description: 'Un inel cu șase membri în conformație scaun, foarte stabil.',
        atoms: [
            { element: 'C', x: 0.87, y: 0.5, z: 0 },
            { element: 'C', x: 0.87, y: -0.5, z: 0 },
            { element: 'C', x: 0, y: -1, z: 0 },
            { element: 'C', x: -0.87, y: -0.5, z: 0 },
            { element: 'C', x: -0.87, y: 0.5, z: 0 },
            { element: 'C', x: 0, y: 1, z: 0 },
            { element: 'H', x: 1.54, y: 0.89, z: 0.7 },
            { element: 'H', x: 1.54, y: 0.89, z: -0.7 },
            { element: 'H', x: 1.54, y: -0.89, z: 0.7 },
            { element: 'H', x: 1.54, y: -0.89, z: -0.7 },
            { element: 'H', x: 0, y: -1.78, z: 0.7 },
            { element: 'H', x: 0, y: -1.78, z: -0.7 },
            { element: 'H', x: -1.54, y: -0.89, z: 0.7 },
            { element: 'H', x: -1.54, y: -0.89, z: -0.7 },
            { element: 'H', x: -1.54, y: 0.89, z: 0.7 },
            { element: 'H', x: -1.54, y: 0.89, z: -0.7 },
            { element: 'H', x: 0, y: 1.78, z: 0.7 },
            { element: 'H', x: 0, y: 1.78, z: -0.7 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,0], [0,6], [0,7], [1,8], [1,9], [2,10], [2,11], [3,12], [3,13], [4,14], [4,15], [5,16], [5,17]]
    },
    benzene: {
        name: 'Benzen',
        formula: 'C₆H₆',
        description: 'Un inel aromatic cu electroni delocalizați, fundamental în chimia organică.',
        atoms: [
            { element: 'C', x: 0.87, y: 0.5, z: 0 },
            { element: 'C', x: 0.87, y: -0.5, z: 0 },
            { element: 'C', x: 0, y: -1, z: 0 },
            { element: 'C', x: -0.87, y: -0.5, z: 0 },
            { element: 'C', x: -0.87, y: 0.5, z: 0 },
            { element: 'C', x: 0, y: 1, z: 0 },
            { element: 'H', x: 1.54, y: 0.89, z: 0 },
            { element: 'H', x: 1.54, y: -0.89, z: 0 },
            { element: 'H', x: 0, y: -1.78, z: 0 },
            { element: 'H', x: -1.54, y: -0.89, z: 0 },
            { element: 'H', x: -1.54, y: 0.89, z: 0 },
            { element: 'H', x: 0, y: 1.78, z: 0 }
        ],
        bonds: [[0,1,'aromatic'], [1,2,'aromatic'], [2,3,'aromatic'], [3,4,'aromatic'], [4,5,'aromatic'], [5,0,'aromatic'], [0,6], [1,7], [2,8], [3,9], [4,10], [5,11]]
    },
    ethanol: {
        name: 'Etanol',
        formula: 'C₂H₅OH',
        description: 'Un alcool cu doi carboni, găsit frecvent în băuturi și ca combustibil.',
        atoms: [
            { element: 'C', x: -1.14, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'O', x: 1.14, y: 0, z: 0 },
            { element: 'H', x: -1.54, y: 0.89, z: 0.51 },
            { element: 'H', x: -1.54, y: -0.89, z: 0.51 },
            { element: 'H', x: -1.54, y: 0, z: -1.03 },
            { element: 'H', x: 0, y: 0.89, z: -0.51 },
            { element: 'H', x: 0, y: -0.89, z: 0.51 },
            { element: 'H', x: 1.74, y: 0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [0,3], [0,4], [0,5], [1,6], [1,7], [2,8]]
    },
    acetone: {
        name: 'Acetonă',
        formula: 'C₃H₆O',
        description: 'O cetonă cu o grupă carbonil, utilizată pe scară largă ca solvent.',
        atoms: [
            { element: 'C', x: -1.27, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'O', x: 0, y: 1.22, z: 0 },
            { element: 'C', x: 1.27, y: -0.5, z: 0 },
            { element: 'H', x: -1.67, y: 0.89, z: 0.51 },
            { element: 'H', x: -1.67, y: -0.89, z: 0.51 },
            { element: 'H', x: -1.67, y: 0, z: -1.03 },
            { element: 'H', x: 1.67, y: -0.39, z: 1.03 },
            { element: 'H', x: 1.67, y: -1.39, z: -0.51 },
            { element: 'H', x: 1.67, y: 0.39, z: -0.51 }
        ],
        bonds: [[0,1], [1,2,'double'], [1,3], [0,4], [0,5], [0,6], [3,7], [3,8], [3,9]]
    },
    aceticacid: {
        name: 'Acid Acetic',
        formula: 'CH₃COOH',
        description: 'Un acid carboxilic, component principal al oțetului.',
        atoms: [
            { element: 'C', x: -1.27, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'O', x: 0.6, y: 1.04, z: 0 },
            { element: 'O', x: 0.6, y: -1.04, z: 0 },
            { element: 'H', x: -1.67, y: 0.89, z: 0.51 },
            { element: 'H', x: -1.67, y: -0.89, z: 0.51 },
            { element: 'H', x: -1.67, y: 0, z: -1.03 },
            { element: 'H', x: 1.56, y: -1.04, z: 0 }
        ],
        bonds: [[0,1], [1,2,'double'], [1,3], [0,4], [0,5], [0,6], [3,7]]
    },
    methylamine: {
        name: 'Metilamină',
        formula: 'CH₃NH₂',
        description: 'O amină simplă, cea mai simplă amină primară.',
        atoms: [
            { element: 'C', x: -0.76, y: 0, z: 0 },
            { element: 'N', x: 0.76, y: 0, z: 0 },
            { element: 'H', x: -1.16, y: 0.89, z: 0.51 },
            { element: 'H', x: -1.16, y: -0.89, z: 0.51 },
            { element: 'H', x: -1.16, y: 0, z: -1.03 },
            { element: 'H', x: 1.16, y: 0.78, z: 0 },
            { element: 'H', x: 1.16, y: -0.78, z: 0 }
        ],
        bonds: [[0,1], [0,2], [0,3], [0,4], [1,5], [1,6]]
    }
};

// Element colors (CPK coloring)
const elementColors = {
    'C': 0x909090,  // Gray for carbon
    'H': 0xFFFFFF,  // White for hydrogen
    'O': 0xFF0D0D,  // Red for oxygen
    'N': 0x3050F8   // Blue for nitrogen
};

// Element sizes
const elementSizes = {
    'C': 0.35,
    'H': 0.20,
    'O': 0.32,
    'N': 0.33
};

// IUPAC nomenclature parser
class IUPACParser {
    constructor() {
        // Romanian to English prefix mapping
        this.prefixes = {
            'met': 1, 'metan': 1, 'metil': 1,
            'et': 2, 'etan': 2, 'etil': 2,
            'prop': 3, 'propan': 3, 'propil': 3,
            'but': 4, 'butan': 4, 'butil': 4,
            'pent': 5, 'pentan': 5, 'pentil': 5,
            'hex': 6, 'hexan': 6, 'hexil': 6,
            'hept': 7, 'heptan': 7, 'heptil': 7,
            'oct': 8, 'octan': 8, 'octil': 8,
            'non': 9, 'nonan': 9, 'nonil': 9,
            'dec': 10, 'decan': 10, 'decil': 10
        };
        
        this.multipliers = {
            'di': 2, 'tri': 3, 'tetra': 4, 'penta': 5,
            'hexa': 6, 'hepta': 7, 'octa': 8
        };
    }
    
    parse(name) {
        // Clean and normalize the input
        name = name.toLowerCase().trim().replace(/\s+/g, '');
        
        // Parse substituents (e.g., "2,3-dimetil")
        const substituents = [];
        const substituentRegex = /(\d+(?:,\d+)*)-(\w+)/g;
        let match;
        
        while ((match = substituentRegex.exec(name)) !== null) {
            const positions = match[1].split(',').map(Number);
            const substituentName = match[2];
            
            // Parse multiplier (di, tri, etc.)
            let substituentType = substituentName;
            let count = 1;
            
            for (const [mult, num] of Object.entries(this.multipliers)) {
                if (substituentName.startsWith(mult)) {
                    count = num;
                    substituentType = substituentName.substring(mult.length);
                    break;
                }
            }
            
            // Add substituent for each position
            positions.forEach(pos => {
                substituents.push({ position: pos, type: substituentType });
            });
        }
        
        // Remove substituents from name to get main chain
        let mainChain = name.replace(/\d+(?:,\d+)*-\w+-?/g, '');
        
        // Determine chain length
        let chainLength = 0;
        for (const [prefix, length] of Object.entries(this.prefixes)) {
            if (mainChain.includes(prefix)) {
                chainLength = Math.max(chainLength, length);
            }
        }
        
        if (chainLength === 0) {
            throw new Error('Nu s-a putut determina lungimea lanțului');
        }
        
        return { chainLength, substituents };
    }
    
    buildMolecule(chainLength, substituents) {
        const atoms = [];
        const bonds = [];
        const spacing = 1.54; // Carbon-carbon bond length (in Angstroms)
        const bondLength = 1.09; // C-H bond length
        
        // Build carbon chain with alternating geometry to prevent overlap
        for (let i = 0; i < chainLength; i++) {
            const x = (i - (chainLength - 1) / 2) * spacing;
            // Stagger carbons in a zig-zag pattern
            const z = (i % 2) * 0.3;
            atoms.push({ element: 'C', x, y: 0, z });
        }
        
        // Add bonds between carbons
        for (let i = 0; i < chainLength - 1; i++) {
            bonds.push([i, i + 1]);
        }
        
        // Track what positions are occupied for each carbon
        const occupiedPositions = new Array(chainLength).fill(null).map(() => []);
        
        // Mark chain bonds as occupied
        for (let i = 0; i < chainLength; i++) {
            if (i > 0) occupiedPositions[i].push('left');
            if (i < chainLength - 1) occupiedPositions[i].push('right');
        }
        
        // Add substituents
        substituents.forEach(sub => {
            const carbonIndex = sub.position - 1;
            if (carbonIndex >= 0 && carbonIndex < chainLength) {
                if (sub.type.includes('metil') || sub.type.includes('methyl')) {
                    // Get available positions for substituent
                    const availablePositions = this.getAvailableTetrahedralPositions(
                        atoms[carbonIndex], 
                        occupiedPositions[carbonIndex],
                        carbonIndex,
                        chainLength
                    );
                    
                    if (availablePositions.length > 0) {
                        const position = availablePositions[0];
                        const methyl = {
                            element: 'C',
                            x: atoms[carbonIndex].x + position.x * spacing * 0.7,
                            y: atoms[carbonIndex].y + position.y * spacing * 0.7,
                            z: atoms[carbonIndex].z + position.z * spacing * 0.7
                        };
                        const methylIndex = atoms.length;
                        atoms.push(methyl);
                        bonds.push([carbonIndex, methylIndex]);
                        
                        // Add hydrogens to methyl carbon with tetrahedral geometry
                        this.addHydrogensTetrahedrally(atoms, bonds, methylIndex, 3, carbonIndex);
                        occupiedPositions[carbonIndex].push('substituent');
                    }
                }
            }
        });
        
        // Add remaining hydrogens to main chain carbons
        for (let i = 0; i < chainLength; i++) {
            const bondsToCarbon = bonds.filter(b => b[0] === i || b[1] === i).length;
            const hydrogensNeeded = 4 - bondsToCarbon;
            if (hydrogensNeeded > 0) {
                this.addHydrogensTetrahedrally(atoms, bonds, i, hydrogensNeeded, 
                    i > 0 ? i - 1 : (i < chainLength - 1 ? i + 1 : -1));
            }
        }
        
        return { atoms, bonds };
    }
    
    getAvailableTetrahedralPositions(carbon, occupied, carbonIndex, chainLength) {
        // Tetrahedral positions around carbon
        const positions = [
            { x: 0, y: 1, z: 0, name: 'top' },
            { x: 0, y: -1, z: 0, name: 'bottom' },
            { x: 0, y: 0, z: 1, name: 'front' },
            { x: 0, y: 0, z: -1, name: 'back' }
        ];
        
        // Filter out occupied positions
        return positions.filter(p => !occupied.includes(p.name));
    }
    
    addHydrogensTetrahedrally(atoms, bonds, carbonIndex, count, connectedCarbonIndex) {
        const carbon = atoms[carbonIndex];
        const bondLength = 1.35; // Increased from 1.09 to space hydrogens further apart
        
        // Get direction to connected carbon (if any)
        let mainDirection = { x: 0, y: 0, z: 0 };
        if (connectedCarbonIndex >= 0 && connectedCarbonIndex < atoms.length) {
            const connectedCarbon = atoms[connectedCarbonIndex];
            mainDirection = {
                x: carbon.x - connectedCarbon.x,
                y: carbon.y - connectedCarbon.y,
                z: carbon.z - connectedCarbon.z
            };
            const len = Math.sqrt(mainDirection.x**2 + mainDirection.y**2 + mainDirection.z**2);
            if (len > 0) {
                mainDirection.x /= len;
                mainDirection.y /= len;
                mainDirection.z /= len;
            }
        }
        
        // True tetrahedral angles (109.5°) with maximized separation
        // Using proper tetrahedral geometry coordinates
        const tetrahedralPositions = [
            { x: 1, y: 1, z: 1 },       // Corner 1
            { x: -1, y: -1, z: 1 },     // Corner 2
            { x: -1, y: 1, z: -1 },     // Corner 3
            { x: 1, y: -1, z: -1 }      // Corner 4
        ];
        
        // Normalize the positions
        tetrahedralPositions.forEach(pos => {
            const len = Math.sqrt(pos.x**2 + pos.y**2 + pos.z**2);
            pos.x /= len;
            pos.y /= len;
            pos.z /= len;
        });
        
        // Add hydrogens at tetrahedral positions
        for (let i = 0; i < count && i < tetrahedralPositions.length; i++) {
            const pos = tetrahedralPositions[i];
            atoms.push({
                element: 'H',
                x: carbon.x + pos.x * bondLength,
                y: carbon.y + pos.y * bondLength,
                z: carbon.z + pos.z * bondLength
            });
            bonds.push([carbonIndex, atoms.length - 1]);
        }
    }
}

const iupacParser = new IUPACParser();

function init() {
    const container = document.getElementById('moleculeViewer');
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2332);
    
    // Camera
    camera = new THREE.PerspectiveCamera(
        50,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 8;
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
    
    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        isRotating = false;
    });
    
    container.addEventListener('mousemove', (e) => {
        if (isDragging && molecule) {
            const deltaMove = {
                x: e.offsetX - previousMousePosition.x,
                y: e.offsetY - previousMousePosition.y
            };
            
            molecule.rotation.y += deltaMove.x * 0.01;
            molecule.rotation.x += deltaMove.y * 0.01;
        }
        
        previousMousePosition = {
            x: e.offsetX,
            y: e.offsetY
        };
    });
    
    container.addEventListener('mouseup', () => {
        isDragging = false;
        if (document.getElementById('rotate').checked) {
            isRotating = true;
        }
    });
    
    // Wheel zoom
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        camera.position.z += e.deltaY * 0.01;
        camera.position.z = Math.max(3, Math.min(15, camera.position.z));
    });
    
    animate();
}

function createMolecule(moleculeData) {
    if (molecule) {
        scene.remove(molecule);
    }
    
    molecule = new THREE.Group();
    
    const atomMeshes = [];
    
    // Create atoms
    moleculeData.atoms.forEach((atom, index) => {
        const geometry = currentStyle === 'ballStick' 
            ? new THREE.SphereGeometry(elementSizes[atom.element], 32, 32)
            : new THREE.SphereGeometry(elementSizes[atom.element] * 2, 32, 32);
        
        const material = new THREE.MeshPhongMaterial({
            color: elementColors[atom.element],
            shininess: 100,
            specular: 0x444444
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(atom.x, atom.y, atom.z);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        
        molecule.add(sphere);
        atomMeshes.push(sphere);
        
        // Add labels if enabled
        if (document.getElementById('showLabels').checked) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 128;
            canvas.height = 128;
            
            // Clear canvas - transparent background
            context.clearRect(0, 0, 128, 128);
            
            // Add text with shadow for better visibility
            context.font = 'Bold 60px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            
            // Draw shadow for text
            context.shadowColor = 'rgba(0, 0, 0, 0.8)';
            context.shadowBlur = 8;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            
            context.fillStyle = 'white';
            context.fillText(atom.element, 64, 64);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true
            });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(0.5, 0.5, 1);
            sprite.position.set(atom.x, atom.y + 0.5, atom.z);
            
            molecule.add(sprite);
        }
    });
    
    // Create bonds
    moleculeData.bonds.forEach(bond => {
        const [atom1Idx, atom2Idx, bondType] = bond;
        const atom1 = moleculeData.atoms[atom1Idx];
        const atom2 = moleculeData.atoms[atom2Idx];
        
        const start = new THREE.Vector3(atom1.x, atom1.y, atom1.z);
        const end = new THREE.Vector3(atom2.x, atom2.y, atom2.z);
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        
        if (bondType === 'double') {
            // Create two parallel bonds for double bonds
            const offset = 0.1;
            createBond(start, end, length, offset);
            createBond(start, end, length, -offset);
        } else if (bondType === 'triple') {
            // Create three bonds for triple bonds
            createBond(start, end, length, 0);
            createBond(start, end, length, 0.12);
            createBond(start, end, length, -0.12);
        } else if (bondType === 'aromatic') {
            // Create aromatic bonds (benzene)
            createBond(start, end, length, 0, 0xFFD700);
        } else {
            // Single bond
            createBond(start, end, length, 0);
        }
    });
    
    scene.add(molecule);
}

function createBond(start, end, length, offset, color = 0xCCCCCC) {
    const bondRadius = currentStyle === 'ballStick' ? 0.08 : 0.15;
    const geometry = new THREE.CylinderGeometry(bondRadius, bondRadius, length, 8);
    const material = new THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 30
    });
    
    const bond = new THREE.Mesh(geometry, material);
    
    const direction = new THREE.Vector3().subVectors(end, start);
    const midpoint = new THREE.Vector3().addVectors(start, direction.multiplyScalar(0.5));
    
    // Apply offset for double/triple bonds
    if (offset !== 0) {
        const perpendicular = new THREE.Vector3(direction.z, 0, -direction.x).normalize();
        midpoint.add(perpendicular.multiplyScalar(offset));
    }
    
    bond.position.copy(midpoint);
    
    const axis = new THREE.Vector3(0, 1, 0);
    bond.quaternion.setFromUnitVectors(axis, direction.normalize());
    
    bond.castShadow = true;
    bond.receiveShadow = true;
    
    molecule.add(bond);
}

function loadMolecule(moleculeName) {
    const data = molecules[moleculeName];
    if (!data) return;
    
    createMolecule(data);
    
    document.getElementById('moleculeName').textContent = data.name;
    document.getElementById('moleculeFormula').textContent = data.formula;
    document.getElementById('moleculeDescription').textContent = data.description;
    
    // Update active button
    document.querySelectorAll('.molecule-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function onWindowResize() {
    const container = document.getElementById('moleculeViewer');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (molecule && isRotating) {
        molecule.rotation.y += 0.005;
    }
    
    renderer.render(scene, camera);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // IUPAC search functionality
    document.getElementById('searchBtn').addEventListener('click', () => {
        const input = document.getElementById('iupacSearch').value;
        const errorElement = document.getElementById('searchError');
        
        try {
            errorElement.textContent = '';
            const parsed = iupacParser.parse(input);
            const moleculeData = iupacParser.buildMolecule(parsed.chainLength, parsed.substituents);
            
            // Create molecule from parsed data
            createMolecule(moleculeData);
            
            // Update info panel
            document.getElementById('moleculeName').textContent = input.charAt(0).toUpperCase() + input.slice(1);
            document.getElementById('moleculeFormula').textContent = 'Generat din nume IUPAC';
            document.getElementById('moleculeDescription').textContent = `Lanț de carbon: ${parsed.chainLength} atomi, Substituți: ${parsed.substituents.length}`;
            
            // Clear active buttons
            document.querySelectorAll('.molecule-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        } catch (error) {
            errorElement.textContent = 'Eroare: ' + error.message + '. Încearcă: "hexan", "2,3-dimetilhexan", "2-metilbutan"';
        }
    });
    
    // Allow Enter key to search
    document.getElementById('iupacSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('searchBtn').click();
        }
    });
    
    // Molecule selection
    document.querySelectorAll('.molecule-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const moleculeName = btn.getAttribute('data-molecule');
            loadMolecule(moleculeName);
        });
    });
    
    // Show labels toggle
    document.getElementById('showLabels').addEventListener('change', (e) => {
        if (molecule) {
            const currentMolecule = document.querySelector('.molecule-btn.active');
            if (currentMolecule) {
                loadMolecule(currentMolecule.getAttribute('data-molecule'));
            }
        }
    });
    
    // Auto-rotate toggle
    document.getElementById('rotate').addEventListener('change', (e) => {
        isRotating = e.target.checked;
    });
    
    // Display style buttons
    document.getElementById('ballStick').addEventListener('click', () => {
        currentStyle = 'ballStick';
        document.getElementById('ballStick').classList.add('active');
        document.getElementById('spaceFill').classList.remove('active');
        const currentMolecule = document.querySelector('.molecule-btn.active');
        if (currentMolecule) {
            loadMolecule(currentMolecule.getAttribute('data-molecule'));
        }
    });
    
    document.getElementById('spaceFill').addEventListener('click', () => {
        currentStyle = 'spaceFill';
        document.getElementById('spaceFill').classList.add('active');
        document.getElementById('ballStick').classList.remove('active');
        const currentMolecule = document.querySelector('.molecule-btn.active');
        if (currentMolecule) {
            loadMolecule(currentMolecule.getAttribute('data-molecule'));
        }
    });
    
    // Load default molecule
    loadMolecule('methane');
});
