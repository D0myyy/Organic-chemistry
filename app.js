// Three.js scene setup
let scene, camera, renderer, molecule, controls;
let isRotating = true;
let currentStyle = 'ballStick';

// Sound effects using Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let soundEnabled = true; // Global sound toggle

const sounds = {
    // Hover sound - warm, subtle low tone (ASMR-like)
    hover: () => {
        if (!soundEnabled) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 180; // Much lower, warmer
        oscillator.type = 'sine'; // Smooth sine wave
        
        gainNode.gain.setValueAtTime(0.0125, audioContext.currentTime); // 75% quieter (was 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
    },
    
    // Click sound - warm, soft pop
    click: () => {
        if (!soundEnabled) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 150; // Lower, warmer
        oscillator.type = 'triangle'; // Softer than square
        
        gainNode.gain.setValueAtTime(0.02, audioContext.currentTime); // 75% quieter (was 0.08)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    },
    
    // Error sound - warm descending tone
    error: () => {
        if (!soundEnabled) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(250, audioContext.currentTime); // Lower starting point
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.4); // Lower end point
        oscillator.type = 'sine'; // Smoother than sawtooth
        
        gainNode.gain.setValueAtTime(0.03, audioContext.currentTime); // 75% quieter (was 0.12)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    },
    
    // Success sound - warm ascending chord (ASMR-like)
    success: () => {
        if (!soundEnabled) return;
        
        [130, 165, 196].forEach((freq, i) => { // Lower frequencies (C3, E3, G3)
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine'; // Smooth warm tone
            
            const startTime = audioContext.currentTime + (i * 0.08);
            gainNode.gain.setValueAtTime(0.0175, startTime); // 75% quieter (was 0.07)
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.5);
        });
    }
};

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

// Isomers database
const isomersData = {
    pentane: {
        formula: 'C₅H₁₂',
        isomers: [
            {
                name: 'n-Pentan',
                type: 'Izomerie de catenă',
                description: 'Lanț liniar de 5 atomi de carbon',
                data: 'pentane'
            },
            {
                name: 'Izopentan (2-metilbutan)',
                type: 'Izomerie de catenă',
                description: 'Lanț ramificat cu un grup metil pe poziția 2',
                atoms: [
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 1.27, y: 0.73, z: 0 },
                    { element: 'C', x: -1.27, y: 2.19, z: 0 },
                    { element: 'C', x: 0, y: -1.52, z: 0 },
                    { element: 'H', x: -2.14, y: 0.22, z: 0.51 },
                    { element: 'H', x: -1.27, y: 0.73, z: -1.03 },
                    { element: 'H', x: 2.14, y: 0.22, z: 0.51 },
                    { element: 'H', x: 1.27, y: 0.73, z: 1.03 },
                    { element: 'H', x: 1.27, y: 1.78, z: 0.51 },
                    { element: 'H', x: -1.27, y: 2.70, z: 1.03 },
                    { element: 'H', x: -2.14, y: 2.70, z: -0.51 },
                    { element: 'H', x: -0.40, y: 2.70, z: -0.51 },
                    { element: 'H', x: 0, y: -2.03, z: 1.03 },
                    { element: 'H', x: 0.87, y: -2.03, z: -0.51 },
                    { element: 'H', x: -0.87, y: -2.03, z: -0.51 }
                ],
                bonds: [[0,1], [0,2], [0,4], [1,3], [1,5], [1,6], [2,7], [2,8], [2,9], [3,10], [3,11], [3,12], [4,13], [4,14], [4,15]]
            },
            {
                name: 'Neopentan (2,2-dimetilpropan)',
                type: 'Izomerie de catenă',
                description: 'Structură compactă cu carbon central legat la 4 grupuri metil',
                atoms: [
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 0.9, y: 0.9, z: 0.9 },
                    { element: 'C', x: -0.9, y: -0.9, z: 0.9 },
                    { element: 'C', x: -0.9, y: 0.9, z: -0.9 },
                    { element: 'C', x: 0.9, y: -0.9, z: -0.9 },
                    { element: 'H', x: 1.3, y: 1.3, z: 1.8 },
                    { element: 'H', x: 1.8, y: 1.3, z: 0.3 },
                    { element: 'H', x: 0.3, y: 1.8, z: 0.3 },
                    { element: 'H', x: -1.3, y: -1.3, z: 1.8 },
                    { element: 'H', x: -1.8, y: -1.3, z: 0.3 },
                    { element: 'H', x: -0.3, y: -1.8, z: 0.3 },
                    { element: 'H', x: -1.3, y: 1.3, z: -1.8 },
                    { element: 'H', x: -1.8, y: 1.3, z: -0.3 },
                    { element: 'H', x: -0.3, y: 1.8, z: -0.3 },
                    { element: 'H', x: 1.3, y: -1.3, z: -1.8 },
                    { element: 'H', x: 1.8, y: -1.3, z: -0.3 },
                    { element: 'H', x: 0.3, y: -1.8, z: -0.3 }
                ],
                bonds: [[0,1], [0,2], [0,3], [0,4], [1,5], [1,6], [1,7], [2,8], [2,9], [2,10], [3,11], [3,12], [3,13], [4,14], [4,15], [4,16]]
            }
        ]
    },
    butane: {
        formula: 'C₄H₁₀',
        isomers: [
            {
                name: 'n-Butan',
                type: 'Izomerie de catenă',
                description: 'Lanț liniar de 4 atomi de carbon',
                data: 'butane'
            },
            {
                name: 'Isobutan (2-metilpropan)',
                type: 'Izomerie de catenă',
                description: 'Lanț ramificat cu carbon central',
                atoms: [
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 0, y: -1.52, z: 0 },
                    { element: 'H', x: -1.67, y: 0.73, z: 1.03 },
                    { element: 'H', x: -2.14, y: 0.22, z: -0.51 },
                    { element: 'H', x: -1.27, y: 1.78, z: -0.51 },
                    { element: 'H', x: 1.67, y: 0.73, z: 1.03 },
                    { element: 'H', x: 2.14, y: 0.22, z: -0.51 },
                    { element: 'H', x: 1.27, y: 1.78, z: -0.51 },
                    { element: 'H', x: 0, y: -2.03, z: 1.03 },
                    { element: 'H', x: 0.87, y: -2.03, z: -0.51 },
                    { element: 'H', x: -0.87, y: -2.03, z: -0.51 }
                ],
                bonds: [[0,1], [0,2], [0,3], [1,4], [1,5], [1,6], [2,7], [2,8], [2,9], [3,10], [3,11], [3,12]]
            }
        ]
    },
    ethanol: {
        formula: 'C₂H₆O',
        isomers: [
            {
                name: 'Etanol (alcool etilic)',
                type: 'Izomerie de funcțiune',
                description: 'Alcool cu grupă -OH',
                data: 'ethanol'
            },
            {
                name: 'Dimetil eter',
                type: 'Izomerie de funcțiune',
                description: 'Eter cu oxigen între doi carboni',
                atoms: [
                    { element: 'C', x: -1.14, y: 0, z: 0 },
                    { element: 'O', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 1.14, y: 0, z: 0 },
                    { element: 'H', x: -1.54, y: 0.89, z: 0.51 },
                    { element: 'H', x: -1.54, y: -0.89, z: 0.51 },
                    { element: 'H', x: -1.54, y: 0, z: -1.03 },
                    { element: 'H', x: 1.54, y: 0.89, z: 0.51 },
                    { element: 'H', x: 1.54, y: -0.89, z: 0.51 },
                    { element: 'H', x: 1.54, y: 0, z: -1.03 }
                ],
                bonds: [[0,1], [1,2], [0,3], [0,4], [0,5], [2,6], [2,7], [2,8]]
            }
        ]
    },
    butene: {
        formula: 'C₄H₈',
        isomers: [
            {
                name: 'But-1-enă',
                type: 'Izomerie de poziție',
                description: 'Dubla legătură între C1 și C2',
                data: 'butene'
            },
            {
                name: 'But-2-enă (cis)',
                type: 'Izomerie geometrică (cis-trans)',
                description: 'Dubla legătură între C2 și C3, grupuri CH₃ pe aceeași parte',
                atoms: [
                    { element: 'C', x: -1.91, y: 0.5, z: 0 },
                    { element: 'C', x: -0.64, y: 0, z: 0 },
                    { element: 'C', x: 0.64, y: 0, z: 0 },
                    { element: 'C', x: 1.91, y: 0.5, z: 0 },
                    { element: 'H', x: -2.31, y: 0.89, z: 0.89 },
                    { element: 'H', x: -2.31, y: -0.39, z: 0.51 },
                    { element: 'H', x: -2.31, y: 1.00, z: -0.89 },
                    { element: 'H', x: -0.64, y: -1.03, z: 0 },
                    { element: 'H', x: 0.64, y: -1.03, z: 0 },
                    { element: 'H', x: 2.31, y: 0.89, z: 0.89 },
                    { element: 'H', x: 2.31, y: -0.39, z: 0.51 },
                    { element: 'H', x: 2.31, y: 1.00, z: -0.89 }
                ],
                bonds: [[0,1], [1,2,'double'], [2,3], [0,4], [0,5], [0,6], [1,7], [2,8], [3,9], [3,10], [3,11]]
            },
            {
                name: 'But-2-enă (trans)',
                type: 'Izomerie geometrică (cis-trans)',
                description: 'Dubla legătură între C2 și C3, grupuri CH₃ pe părți opuse',
                atoms: [
                    { element: 'C', x: -1.91, y: 0.5, z: 0 },
                    { element: 'C', x: -0.64, y: 0, z: 0 },
                    { element: 'C', x: 0.64, y: 0, z: 0 },
                    { element: 'C', x: 1.91, y: -0.5, z: 0 },
                    { element: 'H', x: -2.31, y: 0.89, z: 0.89 },
                    { element: 'H', x: -2.31, y: -0.39, z: 0.51 },
                    { element: 'H', x: -2.31, y: 1.00, z: -0.89 },
                    { element: 'H', x: -0.64, y: -1.03, z: 0 },
                    { element: 'H', x: 0.64, y: 1.03, z: 0 },
                    { element: 'H', x: 2.31, y: -0.89, z: 0.89 },
                    { element: 'H', x: 2.31, y: 0.39, z: 0.51 },
                    { element: 'H', x: 2.31, y: -1.00, z: -0.89 }
                ],
                bonds: [[0,1], [1,2,'double'], [2,3], [0,4], [0,5], [0,6], [1,7], [2,8], [3,9], [3,10], [3,11]]
            }
        ]
    },
    propene: {
        formula: 'C₃H₆',
        isomers: [
            {
                name: 'Propenă',
                type: 'Izomerie de funcțiune',
                description: 'Alchenă cu dubla legătură',
                data: 'propene'
            },
            {
                name: 'Ciclopropan',
                type: 'Izomerie de funcțiune',
                description: 'Compus ciclic cu legături simple',
                data: 'cyclopropane'
            }
        ]
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

// IUPAC nomenclature parser (Romanian nomenclature)
class IUPACParser {
    constructor() {
        // Romanian prefixes for carbon chain length
        this.chainPrefixes = {
            'met': 1,
            'et': 2,
            'prop': 3,
            'but': 4,
            'pent': 5,
            'hex': 6,
            'hept': 7,
            'oct': 8,
            'non': 9,
            'dec': 10
        };
        
        // Substituent prefixes
        this.substituentPrefixes = {
            'metil': 1,
            'etil': 2,
            'propil': 3,
            'butil': 4
        };
        
        this.multipliers = {
            'di': 2, 
            'tri': 3, 
            'tetra': 4, 
            'penta': 5,
            'hexa': 6, 
            'hepta': 7, 
            'octa': 8
        };
    }
    
    parse(name) {
        // Clean and normalize the input
        name = name.toLowerCase().trim().replace(/\s+/g, '');
        
        const result = {
            chainLength: 0,
            substituents: [],
            doubleBonds: [],
            tripleBonds: [],
            isomer: null  // 'cis' or 'trans'
        };
        
        // Check for geometric isomers (cis/trans)
        if (name.startsWith('cis-')) {
            result.isomer = 'cis';
            name = name.substring(4);
        } else if (name.startsWith('trans-')) {
            result.isomer = 'trans';
            name = name.substring(6);
        }
        
        // Parse substituents (e.g., "2,3-dimetil", "2-etil")
        const substituentRegex = /(\d+(?:,\d+)*)-([a-z]+)/g;
        let match;
        let nameWithoutSubstituents = name;
        
        while ((match = substituentRegex.exec(name)) !== null) {
            const positions = match[1].split(',').map(Number);
            const substituentName = match[2];
            
            // Skip if this is the main chain (ends with -an, -ena, -ina, -diena)
            if (substituentName.endsWith('an') || 
                substituentName.endsWith('ena') || 
                substituentName.endsWith('ina') ||
                substituentName.endsWith('diena')) {
                continue;
            }
            
            // Parse multiplier (di, tri, etc.)
            let substituentType = substituentName;
            
            for (const [mult, num] of Object.entries(this.multipliers)) {
                if (substituentName.startsWith(mult)) {
                    substituentType = substituentName.substring(mult.length);
                    break;
                }
            }
            
            // Add substituent for each position
            positions.forEach(pos => {
                result.substituents.push({ 
                    position: pos, 
                    type: substituentType,
                    chainLength: this.substituentPrefixes[substituentType] || 1
                });
            });
            
            // Remove this substituent from the name
            nameWithoutSubstituents = nameWithoutSubstituents.replace(match[0] + '-', '');
        }
        
        // Parse main chain and functional groups
        // Examples: "hexan", "but-1-ena", "but-1,3-diena", "but-1-ina"
        
        // Check for alkyne (-ina)
        if (nameWithoutSubstituents.includes('-ina')) {
            const match = nameWithoutSubstituents.match(/(\d+(?:,\d+)*)?-?(\w+)-(\d+)-ina/);
            if (match) {
                const chainPrefix = match[2];
                const bondPosition = parseInt(match[3]);
                result.chainLength = this.chainPrefixes[chainPrefix] || 0;
                result.tripleBonds.push(bondPosition);
            } else {
                // Simple format: but-1-ina
                const match2 = nameWithoutSubstituents.match(/(\w+)-(\d+)-ina/);
                if (match2) {
                    const chainPrefix = match2[1];
                    const bondPosition = parseInt(match2[2]);
                    result.chainLength = this.chainPrefixes[chainPrefix] || 0;
                    result.tripleBonds.push(bondPosition);
                }
            }
        }
        // Check for diene (-diena)
        else if (nameWithoutSubstituents.includes('-diena')) {
            const match = nameWithoutSubstituents.match(/(\w+)-(\d+(?:,\d+)+)-diena/);
            if (match) {
                const chainPrefix = match[1];
                const bondPositions = match[2].split(',').map(Number);
                result.chainLength = this.chainPrefixes[chainPrefix] || 0;
                result.doubleBonds = bondPositions;
            }
        }
        // Check for alkene (-ena)
        else if (nameWithoutSubstituents.includes('-ena')) {
            const match = nameWithoutSubstituents.match(/(\w+)-(\d+)-ena/);
            if (match) {
                const chainPrefix = match[1];
                const bondPosition = parseInt(match[2]);
                result.chainLength = this.chainPrefixes[chainPrefix] || 0;
                result.doubleBonds.push(bondPosition);
            }
        }
        // Check for alkane (-an)
        else {
            // Try to find chain prefix ending with 'an'
            for (const [prefix, length] of Object.entries(this.chainPrefixes)) {
                if (nameWithoutSubstituents.includes(prefix + 'an')) {
                    result.chainLength = length;
                    break;
                }
            }
        }
        
        if (result.chainLength === 0) {
            throw new Error('Nu s-a putut determina lungimea lanțului. Exemple valide: "hexan", "but-1-ena", "2,3-dimetilhexan"');
        }
        
        return result;
    }
    
    buildMolecule(parsed) {
        const atoms = [];
        const bonds = [];
        const spacing = 1.54; // Carbon-carbon bond length (in Angstroms)
        
        const chainLength = parsed.chainLength;
        const substituents = parsed.substituents;
        const doubleBonds = parsed.doubleBonds;
        const tripleBonds = parsed.tripleBonds;
        
        // Build carbon chain with zig-zag geometry
        for (let i = 0; i < chainLength; i++) {
            const x = (i - (chainLength - 1) / 2) * spacing;
            // Stagger carbons in a zig-zag pattern
            const z = (i % 2) * 0.3;
            atoms.push({ element: 'C', x, y: 0, z });
        }
        
        // Add bonds between carbons (single bonds by default)
        for (let i = 0; i < chainLength - 1; i++) {
            let bondType = 'single';
            
            // Check for double bonds
            if (doubleBonds.includes(i + 1)) {
                bondType = 'double';
            }
            
            // Check for triple bonds
            if (tripleBonds.includes(i + 1)) {
                bondType = 'triple';
            }
            
            bonds.push([i, i + 1, bondType]);
        }
        
        // Track what positions are occupied for each carbon
        const occupiedPositions = new Array(chainLength).fill(null).map(() => []);
        
        // Mark chain bonds as occupied
        for (let i = 0; i < chainLength; i++) {
            if (i > 0) occupiedPositions[i].push('left');
            if (i < chainLength - 1) occupiedPositions[i].push('right');
        }
        
        // Add substituents (metil, etil groups)
        // First, group substituents by position to handle multiple substituents on same carbon
        const substituentsByPosition = {};
        substituents.forEach(sub => {
            if (!substituentsByPosition[sub.position]) {
                substituentsByPosition[sub.position] = [];
            }
            substituentsByPosition[sub.position].push(sub);
        });
        
        // Now add each group of substituents
        Object.entries(substituentsByPosition).forEach(([position, subs]) => {
            const carbonIndex = parseInt(position) - 1;
            if (carbonIndex >= 0 && carbonIndex < chainLength) {
                // Get available positions for substituents
                const availablePositions = this.getAvailableTetrahedralPositions(
                    atoms[carbonIndex], 
                    occupiedPositions[carbonIndex],
                    carbonIndex,
                    chainLength
                );
                
                // Add each substituent at this position using different available positions
                subs.forEach((sub, subIndex) => {
                    if (subIndex < availablePositions.length) {
                        const position = availablePositions[subIndex];
                        
                        // Add the first carbon of the substituent
                        const substituentCarbon = {
                            element: 'C',
                            x: atoms[carbonIndex].x + position.x * spacing * 0.85,
                            y: atoms[carbonIndex].y + position.y * spacing * 0.85,
                            z: atoms[carbonIndex].z + position.z * spacing * 0.85
                        };
                        const substituentCarbonIndex = atoms.length;
                        atoms.push(substituentCarbon);
                        bonds.push([carbonIndex, substituentCarbonIndex]);
                        
                        // If it's an ethyl (etil) group, add another carbon
                        if (sub.type === 'etil') {
                            const secondCarbon = {
                                element: 'C',
                                x: substituentCarbon.x + position.x * spacing * 0.7,
                                y: substituentCarbon.y + position.y * spacing * 0.7,
                                z: substituentCarbon.z + position.z * spacing * 0.7
                            };
                            const secondCarbonIndex = atoms.length;
                            atoms.push(secondCarbon);
                            bonds.push([substituentCarbonIndex, secondCarbonIndex]);
                            
                            // Add hydrogens to both carbons of ethyl group
                            this.addHydrogensTetrahedrally(atoms, bonds, substituentCarbonIndex, 2, carbonIndex);
                            this.addHydrogensTetrahedrally(atoms, bonds, secondCarbonIndex, 3, substituentCarbonIndex);
                        } else if (sub.type === 'metil') {
                            // Methyl group - add 3 hydrogens
                            this.addHydrogensTetrahedrally(atoms, bonds, substituentCarbonIndex, 3, carbonIndex);
                        }
                        
                        occupiedPositions[carbonIndex].push(position.name);
                    }
                });
            }
        });
        
        // Add remaining hydrogens to main chain carbons
        for (let i = 0; i < chainLength; i++) {
            // Count bonds AND account for bond types (double/triple bonds)
            let totalValence = 0;
            bonds.forEach(bond => {
                if (bond[0] === i || bond[1] === i) {
                    // Count valence based on bond type
                    if (bond[2] === 'triple') {
                        totalValence += 3; // Triple bond uses 3 valences
                    } else if (bond[2] === 'double') {
                        totalValence += 2; // Double bond uses 2 valences
                    } else {
                        totalValence += 1; // Single bond uses 1 valence
                    }
                }
            });
            
            const hydrogensNeeded = 4 - totalValence;
            if (hydrogensNeeded > 0) {
                this.addHydrogensTetrahedrally(atoms, bonds, i, hydrogensNeeded, 
                    i > 0 ? i - 1 : (i < chainLength - 1 ? i + 1 : -1));
            }
        }
        
        return { atoms, bonds };
    }
    
    getAvailableTetrahedralPositions(carbon, occupied, carbonIndex, chainLength) {
        // Tetrahedral positions around carbon - proper tetrahedral angles (109.5°)
        const positions = [
            { x: 0, y: 1.2, z: 0, name: 'top' },      // Higher up for more separation
            { x: 0, y: -1.2, z: 0, name: 'bottom' },  // Lower down for more separation
            { x: 0.8, y: 0, z: 0.8, name: 'front' },  // Diagonal positions for better spacing
            { x: -0.8, y: 0, z: -0.8, name: 'back' }  // Diagonal positions for better spacing
        ];
        
        // Filter out occupied positions
        return positions.filter(p => !occupied.includes(p.name));
    }
    
    addHydrogensTetrahedrally(atoms, bonds, carbonIndex, count, connectedCarbonIndex) {
        const carbon = atoms[carbonIndex];
        const bondLength = 1.09; // Standard C-H bond length - mai scurt
        
        // True tetrahedral angles (109.5°) with maximized separation
        let tetrahedralPositions = [
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
        
        // Score each position based on distance from ALL other atoms
        // Higher score = farther from other atoms = better position
        const scoredPositions = tetrahedralPositions.map(pos => {
            let totalScore = 0;
            
            // Calculate potential hydrogen position
            const hPos = {
                x: carbon.x + pos.x * bondLength,
                y: carbon.y + pos.y * bondLength,
                z: carbon.z + pos.z * bondLength
            };
            
            // Check distance to all existing atoms (except the carbon we're attached to)
            atoms.forEach((atom, idx) => {
                if (idx === carbonIndex) return; // Skip the parent carbon
                
                const dx = hPos.x - atom.x;
                const dy = hPos.y - atom.y;
                const dz = hPos.z - atom.z;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                
                // Add to score - farther is better
                // Weight more heavily for nearby atoms
                if (dist > 0) {
                    totalScore += dist;
                }
            });
            
            return { pos, score: totalScore };
        });
        
        // Sort by score (highest first - farthest from other atoms)
        scoredPositions.sort((a, b) => b.score - a.score);
        
        // Add hydrogens at the best positions
        for (let i = 0; i < count && i < scoredPositions.length; i++) {
            const pos = scoredPositions[i].pos;
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

// Store parent compound information
let parentCompound = null;

// Function to generate isomers for IUPAC compounds
function generateIUPACIsomers(parsed, currentMoleculeData, currentName) {
    const isomers = [];
    const formula = calculateMolecularFormula(currentMoleculeData);
    
    // Add current structure as first isomer
    isomers.push({
        name: currentName,
        type: getIsomerType(parsed),
        description: buildDetailedDescription(parsed),
        atoms: currentMoleculeData.atoms,
        bonds: currentMoleculeData.bonds
    });
    
    // Generate positional isomers for alkenes (keeping substituents)
    if (parsed.doubleBonds.length > 0) {
        const chainLen = parsed.chainLength;
        for (let pos = 1; pos <= Math.floor(chainLen / 2); pos++) {
            if (!parsed.doubleBonds.includes(pos)) {
                try {
                    // Create new parsed object with same substituents but different double bond position
                    const newParsed = { 
                        ...parsed, 
                        doubleBonds: [pos],
                        substituents: [...parsed.substituents] // Keep all substituents
                    };
                    const newMolecule = iupacParser.buildMolecule(newParsed);
                    const newName = generateFullIUPACName(newParsed);
                    
                    isomers.push({
                        name: newName,
                        type: 'Izomerie de poziție',
                        description: buildDetailedDescription(newParsed),
                        atoms: newMolecule.atoms,
                        bonds: newMolecule.bonds
                    });
                } catch (e) {
                    // Skip invalid isomers
                    console.log('Skipped invalid isomer:', e.message);
                }
            }
        }
        
        // Generate cis-trans isomers if applicable
        if (parsed.doubleBonds.length > 0 && !parsed.isomer) {
            const dbPos = parsed.doubleBonds[0];
            if (dbPos > 1 && dbPos < parsed.chainLength - 1) {
                // Generate cis isomer
                try {
                    const cisParsed = { ...parsed, isomer: 'cis', substituents: [...parsed.substituents] };
                    const cisMolecule = iupacParser.buildMolecule(cisParsed);
                    isomers.push({
                        name: `(E)-${generateFullIUPACName(parsed)}`,
                        type: 'Izomerie geometrică (cis-trans)',
                        description: buildDetailedDescription(cisParsed) + '\n(Substituenți pe aceeași parte)',
                        atoms: cisMolecule.atoms,
                        bonds: cisMolecule.bonds
                    });
                } catch (e) {}
                
                // Generate trans isomer
                try {
                    const transParsed = { ...parsed, isomer: 'trans', substituents: [...parsed.substituents] };
                    const transMolecule = iupacParser.buildMolecule(transParsed);
                    isomers.push({
                        name: `(Z)-${generateFullIUPACName(parsed)}`,
                        type: 'Izomerie geometrică (cis-trans)',
                        description: buildDetailedDescription(transParsed) + '\n(Substituenți pe părți opuse)',
                        atoms: transMolecule.atoms,
                        bonds: transMolecule.bonds
                    });
                } catch (e) {}
            }
        }
    }
    
    // Generate chain isomers for alkanes with 4+ carbons (only for simple alkanes without substituents)
    if (parsed.chainLength >= 4 && parsed.doubleBonds.length === 0 && parsed.tripleBonds.length === 0 && parsed.substituents.length === 0) {
        // Add branched isomers
        if (parsed.chainLength === 4) {
            // Isobutane
            isomers.push({
                name: '2-metilpropan (isobutan)',
                type: 'Izomerie de catenă',
                description: 'Lanț principal: 3 atomi de carbon\nSubstituenți: metil la C-2',
                data: 'butane' // Will use predefined isobutane if we add it
            });
        } else if (parsed.chainLength === 5) {
            // Isopentane and neopentane structures would be added here
            isomers.push({
                name: '2-metilbutan (izopentan)',
                type: 'Izomerie de catenă',
                description: 'Lanț ramificat cu metil pe C2'
            });
            isomers.push({
                name: '2,2-dimetilpropan (neopentan)',
                type: 'Izomerie de catenă',
                description: 'Structură compactă cu carbon central'
            });
        }
    }
    
    // Only return isomers if we have more than just the current one
    return isomers.length > 1 ? { formula, isomers } : null;
}

function getIsomerType(parsed) {
    if (parsed.isomer) return 'Izomerie geometrică (cis-trans)';
    if (parsed.doubleBonds.length > 0 || parsed.tripleBonds.length > 0) return 'Izomerie de poziție';
    if (parsed.substituents.length > 0) return 'Izomerie de catenă';
    return 'Structură principală';
}

function buildDetailedDescription(parsed) {
    let desc = `Lanț principal: ${parsed.chainLength} atomi de carbon`;
    
    if (parsed.doubleBonds.length > 0) {
        desc += `\nLegături duble la poziția: ${parsed.doubleBonds.join(', ')}`;
    }
    
    if (parsed.tripleBonds.length > 0) {
        desc += `\nLegături triple la poziția: ${parsed.tripleBonds.join(', ')}`;
    }
    
    if (parsed.substituents.length > 0) {
        const subList = parsed.substituents
            .map(s => `${s.type} la C-${s.position}`)
            .join(', ');
        desc += `\nSubstituenți: ${subList}`;
    }
    
    return desc;
}

function generateFullIUPACName(parsed) {
    const prefixes = ['', 'met', 'et', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec'];
    const multipliers = ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa'];
    
    // Build substituent part
    let substituentPart = '';
    if (parsed.substituents.length > 0) {
        // Group substituents by type
        const subGroups = {};
        parsed.substituents.forEach(s => {
            const key = s.type;
            if (!subGroups[key]) subGroups[key] = [];
            subGroups[key].push(s.position);
        });
        
        const subParts = [];
        // Sort by substituent type (alphabetically)
        Object.keys(subGroups).sort().forEach(type => {
            const positions = subGroups[type].sort((a, b) => a - b);
            const posStr = positions.join(',');
            // Use the actual COUNT of substituents, not unique positions
            const count = positions.length;
            const multiplier = count > 1 ? multipliers[count] : '';
            subParts.push(`${posStr}-${multiplier}${type}`);
        });
        
        substituentPart = subParts.join('-') + '-';
    }
    
    // Build main chain part
    let mainPart = prefixes[parsed.chainLength] || parsed.chainLength;
    
    if (parsed.doubleBonds.length > 0) {
        mainPart += `-${parsed.doubleBonds.join(',')}-enă`;
    } else if (parsed.tripleBonds.length > 0) {
        mainPart += `-${parsed.tripleBonds.join(',')}-ină`;
    } else {
        mainPart += 'an';
    }
    
    return substituentPart + mainPart;
}

function calculateMolecularFormula(moleculeData) {
    const counts = {};
    moleculeData.atoms.forEach(atom => {
        counts[atom.element] = (counts[atom.element] || 0) + 1;
    });
    
    // Helper function to convert number to subscript
    const toSubscript = (num) => {
        if (num <= 1) return '';
        const subscripts = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
        return String(num).split('').map(d => subscripts[parseInt(d)]).join('');
    };
    
    let formula = '';
    if (counts.C) formula += `C${toSubscript(counts.C)}`;
    if (counts.H) formula += `H${toSubscript(counts.H)}`;
    if (counts.O) formula += `O${toSubscript(counts.O)}`;
    if (counts.N) formula += `N${toSubscript(counts.N)}`;
    
    return formula;
}

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
            // Create two bonds stacked vertically for double bonds (visible from front)
            const offset = 0.1;
            createBond(start, end, length, 0, offset, 0xCCCCCC);
            createBond(start, end, length, 0, -offset, 0xCCCCCC);
        } else if (bondType === 'triple') {
            // Create three bonds for triple bonds (one center, two vertical)
            createBond(start, end, length, 0, 0, 0xCCCCCC);
            createBond(start, end, length, 0, 0.12, 0xCCCCCC);
            createBond(start, end, length, 0, -0.12, 0xCCCCCC);
        } else if (bondType === 'aromatic') {
            // Create aromatic bonds (benzene)
            createBond(start, end, length, 0, 0, 0xFFD700);
        } else {
            // Single bond
            createBond(start, end, length, 0, 0, 0xCCCCCC);
        }
    });
    
    scene.add(molecule);
}

function createBond(start, end, length, horizontalOffset = 0, verticalOffset = 0, color = 0xCCCCCC) {
    const bondRadius = currentStyle === 'ballStick' ? 0.08 : 0.15;
    const geometry = new THREE.CylinderGeometry(bondRadius, bondRadius, length, 8);
    const material = new THREE.MeshPhongMaterial({ 
        color: color,
        shininess: 30
    });
    
    const bond = new THREE.Mesh(geometry, material);
    
    const direction = new THREE.Vector3().subVectors(end, start);
    const midpoint = new THREE.Vector3().addVectors(start, direction.multiplyScalar(0.5));
    
    // Apply horizontal offset for double/triple bonds (perpendicular in XZ plane)
    if (horizontalOffset !== 0) {
        const perpendicular = new THREE.Vector3(direction.z, 0, -direction.x).normalize();
        midpoint.add(perpendicular.multiplyScalar(horizontalOffset));
    }
    
    // Apply vertical offset (Y axis) - this makes bonds stack vertically
    if (verticalOffset !== 0) {
        midpoint.y += verticalOffset;
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
    
    // Reset parent compound when loading a new molecule from sidebar
    parentCompound = null;
    
    // Hide back button
    document.getElementById('backToParentBtn').style.display = 'none';
    
    // Show/hide isomers button
    const isomersBtn = document.getElementById('showIsomersBtn');
    if (isomersData[moleculeName]) {
        isomersBtn.style.display = 'block';
        isomersBtn.onclick = () => showIsomersModal(moleculeName);
    } else {
        isomersBtn.style.display = 'none';
    }
    
    // Update active button only if called from button click
    if (window.event && window.event.target) {
        document.querySelectorAll('.molecule-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        window.event.target.classList.add('active');
    }
}

function showIsomersModal(moleculeName) {
    const data = isomersData[moleculeName];
    if (!data) return;
    
    sounds.click();
    
    const modal = document.getElementById('isomersModal');
    const compoundName = molecules[moleculeName].name;
    
    document.getElementById('isomerCompoundName').textContent = compoundName;
    document.getElementById('isomerFormula').textContent = data.formula;
    
    const isomersList = document.getElementById('isomersList');
    isomersList.innerHTML = '';
    
    data.isomers.forEach((isomer, index) => {
        const card = document.createElement('div');
        card.className = 'isomer-card';
        
        card.innerHTML = `
            <h3>${isomer.name}</h3>
            <span class="isomer-type">${isomer.type}</span>
            <p class="formula">${data.formula}</p>
            <p>${isomer.description}</p>
        `;
        
        card.addEventListener('mouseenter', () => sounds.hover());
        card.addEventListener('click', () => {
            sounds.click();
            
            // Store parent compound before switching
            parentCompound = {
                name: molecules[moleculeName].name,
                formula: molecules[moleculeName].formula,
                description: molecules[moleculeName].description,
                moleculeName: moleculeName,
                isomersData: data
            };
            
            // Load the isomer structure
            if (isomer.data) {
                loadMolecule(isomer.data);
            } else {
                createMolecule(isomer);
                document.getElementById('moleculeName').textContent = isomer.name;
                document.getElementById('moleculeFormula').textContent = data.formula;
                document.getElementById('moleculeDescription').textContent = isomer.description;
                
                // Show back button and keep isomers button
                document.getElementById('backToParentBtn').style.display = 'block';
                document.getElementById('showIsomersBtn').style.display = 'block';
                
                // Update isomers button to show parent's isomers
                document.getElementById('showIsomersBtn').onclick = () => showIsomersModal(moleculeName);
            }
            modal.style.display = 'none';
        });
        
        isomersList.appendChild(card);
    });
    
    modal.style.display = 'block';
}

function showIUPACIsomersModal(compoundName, isomersData) {
    sounds.click();
    
    const modal = document.getElementById('isomersModal');
    
    document.getElementById('isomerCompoundName').textContent = compoundName;
    document.getElementById('isomerFormula').textContent = isomersData.formula;
    
    const isomersList = document.getElementById('isomersList');
    isomersList.innerHTML = '';
    
    isomersData.isomers.forEach((isomer, index) => {
        const card = document.createElement('div');
        card.className = 'isomer-card';
        
        card.innerHTML = `
            <h3>${isomer.name}</h3>
            <span class="isomer-type">${isomer.type}</span>
            <p class="formula">${isomersData.formula}</p>
            <p>${isomer.description}</p>
        `;
        
        card.addEventListener('mouseenter', () => sounds.hover());
        card.addEventListener('click', () => {
            sounds.click();
            
            // Store parent compound before switching (only if not already set)
            if (!parentCompound || index === 0) {
                const firstIsomer = isomersData.isomers[0];
                parentCompound = {
                    name: firstIsomer.name,
                    formula: isomersData.formula,
                    description: firstIsomer.description,
                    atoms: firstIsomer.atoms,
                    bonds: firstIsomer.bonds,
                    isIUPAC: true,
                    isomersData: isomersData,
                    compoundName: compoundName
                };
            }
            
            // Load the isomer structure
            if (isomer.data) {
                loadMolecule(isomer.data);
            } else {
                createMolecule(isomer);
                document.getElementById('moleculeName').textContent = isomer.name;
                document.getElementById('moleculeFormula').textContent = isomersData.formula;
                document.getElementById('moleculeDescription').textContent = isomer.description;
                
                // Show back button if not the first isomer
                if (index !== 0) {
                    document.getElementById('backToParentBtn').style.display = 'block';
                } else {
                    document.getElementById('backToParentBtn').style.display = 'none';
                }
                
                // Keep isomers button visible
                document.getElementById('showIsomersBtn').style.display = 'block';
                document.getElementById('showIsomersBtn').onclick = () => showIUPACIsomersModal(compoundName, isomersData);
            }
            modal.style.display = 'none';
        });
        
        isomersList.appendChild(card);
    });
    
    modal.style.display = 'block';
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
    
    // Function to normalize Romanian diacritics
    function normalizeDiacritics(text) {
        const diacriticsMap = {
            'ă': 'a', 'Ă': 'A',
            'â': 'a', 'Â': 'A',
            'î': 'i', 'Î': 'I',
            'ș': 's', 'Ș': 'S',
            'ț': 't', 'Ț': 'T'
        };
        
        return text.replace(/[ăâîșțĂÂÎȘȚ]/g, char => diacriticsMap[char] || char);
    }
    
    // IUPAC search functionality
    document.getElementById('searchBtn').addEventListener('click', () => {
        sounds.click();
        const input = document.getElementById('iupacSearch').value;
        const errorElement = document.getElementById('searchError');
        
        try {
            errorElement.textContent = '';
            // Normalize Romanian diacritics before parsing
            const normalizedInput = normalizeDiacritics(input);
            const parsed = iupacParser.parse(normalizedInput);
            const moleculeData = iupacParser.buildMolecule(parsed);
            
            // Play success sound
            sounds.success();
            
            // Reset parent compound when generating a new IUPAC structure
            parentCompound = null;
            
            // Create molecule from parsed data
            createMolecule(moleculeData);
            
            // Build description
            let description = `Lanț principal: ${parsed.chainLength} atomi de carbon`;
            
            if (parsed.doubleBonds.length > 0) {
                description += `\nLegături duble la poziția: ${parsed.doubleBonds.join(', ')}`;
            }
            
            if (parsed.tripleBonds.length > 0) {
                description += `\nLegături triple la poziția: ${parsed.tripleBonds.join(', ')}`;
            }
            
            if (parsed.substituents.length > 0) {
                const subList = parsed.substituents.map(s => `${s.type} la C-${s.position}`).join(', ');
                description += `\nSubstituenți: ${subList}`;
            }
            
            if (parsed.isomer) {
                description += `\nIzomer geometric: ${parsed.isomer}`;
            }
            
            // Update info panel
            const compoundName = input.charAt(0).toUpperCase() + input.slice(1);
            document.getElementById('moleculeName').textContent = compoundName;
            document.getElementById('moleculeFormula').textContent = 'Compus organic generat din nume IUPAC';
            document.getElementById('moleculeDescription').textContent = description;
            
            // Hide back button for new IUPAC search
            document.getElementById('backToParentBtn').style.display = 'none';
            
            // Generate and show isomers for IUPAC compounds
            const generatedIsomers = generateIUPACIsomers(parsed, moleculeData, compoundName);
            const isomersBtn = document.getElementById('showIsomersBtn');
            
            if (generatedIsomers) {
                // Store generated isomers temporarily
                window.currentIUPACIsomers = generatedIsomers;
                isomersBtn.style.display = 'block';
                isomersBtn.onclick = () => showIUPACIsomersModal(compoundName, generatedIsomers);
            } else {
                isomersBtn.style.display = 'none';
            }
            
            // Clear active buttons
            document.querySelectorAll('.molecule-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        } catch (error) {
            sounds.error();
            errorElement.textContent = 'Eroare: ' + error.message;
            console.error('Eroare la parsare:', error);
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
        btn.addEventListener('mouseenter', () => {
            sounds.hover();
        });
        
        btn.addEventListener('click', (e) => {
            sounds.click();
            const moleculeName = btn.getAttribute('data-molecule');
            loadMolecule(moleculeName);
            sounds.success();
        });
    });
    
    // Show labels toggle
    document.getElementById('showLabels').addEventListener('change', (e) => {
        sounds.click();
        if (molecule) {
            const currentMolecule = document.querySelector('.molecule-btn.active');
            if (currentMolecule) {
                loadMolecule(currentMolecule.getAttribute('data-molecule'));
            }
        }
    });
    
    // Auto-rotate toggle
    document.getElementById('rotate').addEventListener('change', (e) => {
        sounds.click();
        isRotating = e.target.checked;
    });
    
    // Sound toggle
    document.getElementById('soundToggle').addEventListener('change', (e) => {
        soundEnabled = e.target.checked;
        if (soundEnabled) {
            sounds.click(); // Play a sound to confirm it's enabled
        }
    });
    
    // Display style buttons
    document.getElementById('ballStick').addEventListener('mouseenter', () => sounds.hover());
    document.getElementById('ballStick').addEventListener('click', () => {
        sounds.click();
        currentStyle = 'ballStick';
        document.getElementById('ballStick').classList.add('active');
        document.getElementById('spaceFill').classList.remove('active');
        const currentMolecule = document.querySelector('.molecule-btn.active');
        if (currentMolecule) {
            loadMolecule(currentMolecule.getAttribute('data-molecule'));
        }
    });
    
    document.getElementById('spaceFill').addEventListener('mouseenter', () => sounds.hover());
    document.getElementById('spaceFill').addEventListener('click', () => {
        sounds.click();
        currentStyle = 'spaceFill';
        document.getElementById('spaceFill').classList.add('active');
        document.getElementById('ballStick').classList.remove('active');
        const currentMolecule = document.querySelector('.molecule-btn.active');
        if (currentMolecule) {
            loadMolecule(currentMolecule.getAttribute('data-molecule'));
        }
    });
    
    // Modal controls
    const modal = document.getElementById('isomersModal');
    const closeBtn = document.querySelector('.close-modal');
    
    closeBtn.addEventListener('click', () => {
        sounds.click();
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            sounds.click();
            modal.style.display = 'none';
        }
    });
    
    // Back to parent compound button
    document.getElementById('backToParentBtn').addEventListener('click', () => {
        sounds.click();
        
        if (parentCompound) {
            if (parentCompound.isIUPAC) {
                // For IUPAC compounds, load the first isomer (original)
                const firstIsomer = parentCompound.isomersData.isomers[0];
                createMolecule(firstIsomer);
                document.getElementById('moleculeName').textContent = firstIsomer.name;
                document.getElementById('moleculeFormula').textContent = parentCompound.formula;
                document.getElementById('moleculeDescription').textContent = firstIsomer.description;
                
                // Hide back button, show isomers button
                document.getElementById('backToParentBtn').style.display = 'none';
                document.getElementById('showIsomersBtn').style.display = 'block';
                document.getElementById('showIsomersBtn').onclick = () => 
                    showIUPACIsomersModal(parentCompound.compoundName, parentCompound.isomersData);
            } else {
                // For predefined molecules
                loadMolecule(parentCompound.moleculeName);
                
                // Hide back button
                document.getElementById('backToParentBtn').style.display = 'none';
            }
            
            sounds.success();
        }
    });
    
    // Theme Toggle Functionality
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // Load saved theme preference or use dark mode as default
    const savedTheme = localStorage.getItem('theme') || 'dark-mode';
    body.classList.remove('dark-mode', 'light-mode');
    body.classList.add(savedTheme);
    
    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
        if (body.classList.contains('dark-mode')) {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            localStorage.setItem('theme', 'light-mode');
        } else {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark-mode');
        }
        sounds.click();
    });
    
    // Load default molecule
    loadMolecule('methane');
});
