// Three.js scene setup
let scene, camera, renderer, molecule, controls;
let isRotating = true;
let animationPaused = false;
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
        properties: {
            physical: 'Punct de fierbere: 78.4°C | Punct de topire: -114.1°C | Densitate: 0.789 g/cm³ | Solubilitate: completă în apă',
            chemical: 'Alcool primar. Oxidare la acetaldehidă, apoi la acid acetic. Reacții de esterificare, deshidratare la etenă.',
            uses: 'Utilizări: băuturi alcoolice, combustibil (bioetanol), dezinfectant, solvent în parfumuri și medicamente, sinteza organică'
        },
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
    propanol: {
        name: 'Propan-1-ol',
        formula: 'C₃H₇OH',
        description: 'Un alcool cu trei carboni, utilizat ca solvent și în sinteze organice.',
        properties: {
            physical: 'Punct de fierbere: 97°C | Punct de topire: -126°C | Densitate: 0.804 g/cm³ | Solubilitate: completă în apă',
            chemical: 'Alcool primar (-OH legat de carbon primar). Oxidare la propanal (aldehidă), apoi la acid propanoic. Reacții de esterificare.',
            uses: 'Utilizări: solvent pentru rășini și celuloid, intermediar în sinteza organică, producerea propionatului de etil (arome), dezinfectant'
        },
        atoms: [
            { element: 'C', x: -1.91, y: 0, z: 0 },
            { element: 'C', x: -0.64, y: 0, z: 0 },
            { element: 'C', x: 0.64, y: 0, z: 0 },
            { element: 'O', x: 1.78, y: 0, z: 0 },
            { element: 'H', x: -2.31, y: 0.89, z: 0.51 },
            { element: 'H', x: -2.31, y: -0.89, z: 0.51 },
            { element: 'H', x: -2.31, y: 0, z: -1.03 },
            { element: 'H', x: -0.64, y: 0.89, z: -0.51 },
            { element: 'H', x: -0.64, y: -0.89, z: 0.51 },
            { element: 'H', x: 0.64, y: 0.89, z: -0.51 },
            { element: 'H', x: 0.64, y: -0.89, z: 0.51 },
            { element: 'H', x: 2.38, y: 0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [2,3], [0,4], [0,5], [0,6], [1,7], [1,8], [2,9], [2,10], [3,11]]
    },
    butanol: {
        name: 'Butan-1-ol',
        formula: 'C₄H₉OH',
        description: 'Un alcool cu patru carboni, utilizat ca solvent industrial.',
        properties: {
            physical: 'Punct de fierbere: 117.7°C | Punct de topire: -89.8°C | Densitate: 0.810 g/cm³ | Solubilitate: 7.7 g/100mL apă',
            chemical: 'Alcool primar. Oxidare la butanal, apoi la acid butanoic. Reacții de esterificare pentru producerea aromelor.',
            uses: 'Utilizări: solvent în lacuri și vopsele, producerea acrilatului de butil, plastifiant, extractant în parfumerie, intermediar chimic'
        },
        atoms: [
            { element: 'C', x: -2.54, y: 0, z: 0 },
            { element: 'C', x: -1.27, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.27, y: 0, z: 0 },
            { element: 'O', x: 2.41, y: 0, z: 0 },
            { element: 'H', x: -2.94, y: 0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: -0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: 0, z: -1.03 },
            { element: 'H', x: -1.27, y: 0.89, z: -0.51 },
            { element: 'H', x: -1.27, y: -0.89, z: 0.51 },
            { element: 'H', x: 0, y: 0.89, z: 0.51 },
            { element: 'H', x: 0, y: -0.89, z: -0.51 },
            { element: 'H', x: 1.27, y: 0.89, z: -0.51 },
            { element: 'H', x: 1.27, y: -0.89, z: 0.51 },
            { element: 'H', x: 3.01, y: 0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,4], [0,5], [0,6], [0,7], [1,8], [1,9], [2,10], [2,11], [3,12], [3,13], [4,14]]
    },
    pentanol: {
        name: 'Pentan-1-ol',
        formula: 'C₅H₁₁OH',
        description: 'Un alcool cu cinci carboni, utilizat ca solvent și în sinteze organice.',
        properties: {
            physical: 'Punct de fierbere: 138°C | Punct de topire: -78°C | Densitate: 0.814 g/cm³ | Solubilitate: 2.2 g/100mL apă',
            chemical: 'Alcool primar. Oxidare la pentanal, apoi la acid pentanoic. Reacții de esterificare.',
            uses: 'Utilizări: solvent pentru lacuri și rășini, aditiv în lubrifianți, intermediar în sinteza esterilor pentru arome (banană, măr), extractant'
        },
        atoms: [
            { element: 'C', x: -3.18, y: 0, z: 0 },
            { element: 'C', x: -1.91, y: 0, z: 0 },
            { element: 'C', x: -0.64, y: 0, z: 0 },
            { element: 'C', x: 0.64, y: 0, z: 0 },
            { element: 'C', x: 1.91, y: 0, z: 0 },
            { element: 'O', x: 3.05, y: 0, z: 0 },
            { element: 'H', x: -3.58, y: 0.89, z: 0.51 },
            { element: 'H', x: -3.58, y: -0.89, z: 0.51 },
            { element: 'H', x: -3.58, y: 0, z: -1.03 },
            { element: 'H', x: -1.91, y: 0.89, z: -0.51 },
            { element: 'H', x: -1.91, y: -0.89, z: 0.51 },
            { element: 'H', x: -0.64, y: 0.89, z: 0.51 },
            { element: 'H', x: -0.64, y: -0.89, z: -0.51 },
            { element: 'H', x: 0.64, y: 0.89, z: -0.51 },
            { element: 'H', x: 0.64, y: -0.89, z: 0.51 },
            { element: 'H', x: 1.91, y: 0.89, z: -0.51 },
            { element: 'H', x: 1.91, y: -0.89, z: 0.51 },
            { element: 'H', x: 3.65, y: 0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [0,6], [0,7], [0,8], [1,9], [1,10], [2,11], [2,12], [3,13], [3,14], [4,15], [4,16], [5,17]]
    },
    hexanol: {
        name: 'Hexan-1-ol',
        formula: 'C₆H₁₃OH',
        description: 'Un alcool cu șase carboni, utilizat în parfumerie și ca intermediar chimic.',
        properties: {
            physical: 'Punct de fierbere: 157°C | Punct de topire: -47°C | Densitate: 0.814 g/cm³ | Solubilitate în apă: 5.9 g/L',
            chemical: 'Alcool primar (-OH legat de carbon primar). Reacționează cu acizi formând esteri. Oxidare la hexanal (aldehidă), apoi la acid hexanoic.',
            uses: 'Utilizări: parfumerie (note florale), sinteza plastifianților, solvent pentru rășini și lacuri, intermediar în producerea detergenților'
        },
        atoms: [
            { element: 'C', x: -3.81, y: 0, z: 0 },
            { element: 'C', x: -2.54, y: 0, z: 0 },
            { element: 'C', x: -1.27, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.27, y: 0, z: 0 },
            { element: 'C', x: 2.54, y: 0, z: 0 },
            { element: 'O', x: 3.68, y: 0, z: 0 },
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
            { element: 'H', x: 4.28, y: 0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [0,7], [0,8], [0,9], [1,10], [1,11], [2,12], [2,13], [3,14], [3,15], [4,16], [4,17], [5,18], [5,19], [6,20]]
    },
    // Propanol isomers (C3H8O)
    'propan-2-ol': {
        name: 'Propan-2-ol (Izopropanol)',
        formula: 'C₃H₇OH',
        description: 'Alcool secundar cu grupa -OH pe al doilea carbon. Izomer de poziție al propan-1-ol.',
        properties: {
            physical: 'Punct de fierbere: 82.6°C | Punct de topire: -89°C | Densitate: 0.786 g/cm³ | Solubilitate: completă în apă',
            chemical: 'Alcool secundar. Oxidare la acetonă (cetonă). Mai volatil decât propan-1-ol. Reacții de esterificare și deshidratare.',
            uses: 'Utilizări: dezinfectant (70% soluție), solvent pentru rășini și lacuri, antigel, producerea acetonei, curățarea electronică'
        },
        atoms: [
            { element: 'C', x: -1.27, y: 0.73, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.27, y: 0.73, z: 0 },
            { element: 'O', x: 0, y: -1.4, z: 0 },
            { element: 'H', x: -1.67, y: 0.73, z: 1.03 },
            { element: 'H', x: -2.14, y: 0.22, z: -0.51 },
            { element: 'H', x: -1.27, y: 1.78, z: -0.51 },
            { element: 'H', x: 0, y: 0.51, z: -1.03 },
            { element: 'H', x: 1.67, y: 0.73, z: 1.03 },
            { element: 'H', x: 2.14, y: 0.22, z: -0.51 },
            { element: 'H', x: 1.27, y: 1.78, z: -0.51 },
            { element: 'H', x: 0, y: -2.0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [1,3], [0,4], [0,5], [0,6], [1,7], [2,8], [2,9], [2,10], [3,11]]
    },
    // Butanol isomers (C4H10O)
    'butan-2-ol': {
        name: 'Butan-2-ol',
        formula: 'C₄H₉OH',
        description: 'Alcool secundar cu grupa -OH pe al doilea carbon. Izomer de poziție al butan-1-ol.',
        properties: {
            physical: 'Punct de fierbere: 99.5°C | Punct de topire: -115°C | Densitate: 0.806 g/cm³ | Solubilitate: 29 g/100mL apă',
            chemical: 'Alcool secundar. Oxidare la butan-2-onă (metil etil cetonă). Centru chiral - există în forme enantiomerice (R și S).',
            uses: 'Utilizări: solvent pentru rășini, lacuri, vopsele, extractant în industria farmaceutică, intermediar organic'
        },
        atoms: [
            { element: 'C', x: -1.91, y: 0, z: 0 },
            { element: 'C', x: -0.64, y: 0, z: 0 },
            { element: 'C', x: 0.64, y: 0, z: 0 },
            { element: 'C', x: 1.91, y: 0, z: 0 },
            { element: 'O', x: -0.64, y: 1.4, z: 0 },
            { element: 'H', x: -2.31, y: 0.89, z: 0.51 },
            { element: 'H', x: -2.31, y: -0.89, z: 0.51 },
            { element: 'H', x: -2.31, y: 0, z: -1.03 },
            { element: 'H', x: -0.64, y: -0.51, z: -1.03 },
            { element: 'H', x: 0.64, y: 0.89, z: -0.51 },
            { element: 'H', x: 0.64, y: -0.89, z: 0.51 },
            { element: 'H', x: 2.31, y: 0.89, z: 0.51 },
            { element: 'H', x: 2.31, y: -0.89, z: 0.51 },
            { element: 'H', x: 2.31, y: 0, z: -1.03 },
            { element: 'H', x: -0.64, y: 2.0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [2,3], [1,4], [0,5], [0,6], [0,7], [1,8], [2,9], [2,10], [3,11], [3,12], [3,13], [4,14]]
    },
    '2-metilpropan-1-ol': {
        name: '2-Metilpropan-1-ol (Izobutanol)',
        formula: 'C₄H₉OH',
        description: 'Alcool primar ramificat. Izomer de catenă al butan-1-ol.',
        properties: {
            physical: 'Punct de fierbere: 108°C | Punct de topire: -108°C | Densitate: 0.802 g/cm³ | Solubilitate: 8.5 g/100mL apă',
            chemical: 'Alcool primar ramificat. Oxidare la izobutanal, apoi acid izobutanoic. Reacții de esterificare.',
            uses: 'Utilizări: producerea esterilor pentru arome și parfumuri, solvent în lacuri și vopsele, intermediar în sinteza organică'
        },
        atoms: [
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: -1.27, y: 0.73, z: 0 },
            { element: 'C', x: 1.27, y: 0.73, z: 0 },
            { element: 'C', x: 0, y: -1.52, z: 0 },
            { element: 'O', x: 0, y: -2.66, z: 0 },
            { element: 'H', x: 0.51, y: 0, z: 1.03 },
            { element: 'H', x: -1.67, y: 0.73, z: 1.03 },
            { element: 'H', x: -2.14, y: 0.22, z: -0.51 },
            { element: 'H', x: -1.27, y: 1.78, z: -0.51 },
            { element: 'H', x: 1.67, y: 0.73, z: 1.03 },
            { element: 'H', x: 2.14, y: 0.22, z: -0.51 },
            { element: 'H', x: 1.27, y: 1.78, z: -0.51 },
            { element: 'H', x: 0.87, y: -1.52, z: -0.51 },
            { element: 'H', x: -0.87, y: -1.52, z: -0.51 },
            { element: 'H', x: 0, y: -3.26, z: 0 }
        ],
        bonds: [[0,1], [0,2], [0,3], [3,4], [0,5], [1,6], [1,7], [1,8], [2,9], [2,10], [2,11], [3,12], [3,13], [4,14]]
    },
    '2-metilpropan-2-ol': {
        name: '2-Metilpropan-2-ol (Terc-butanol)',
        formula: 'C₄H₉OH',
        description: 'Alcool terțiar - grupa -OH legată de carbon terțiar. Izomer de poziție și catenă.',
        properties: {
            physical: 'Punct de fierbere: 82.4°C | Punct de topire: 25.5°C | Densitate: 0.789 g/cm³ | Solubilitate: completă în apă',
            chemical: 'Alcool terțiar - nu se oxidează ușor. Deshidratare foarte ușoară la izobutenă. Nucleofil slab.',
            uses: 'Utilizări: solvent polar aprotic, intermediar chimic, octane booster pentru benzină, producerea MTBE (metil terc-butil eter)'
        },
        atoms: [
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: -1.27, y: 0.73, z: 0 },
            { element: 'C', x: 1.27, y: 0.73, z: 0 },
            { element: 'C', x: 0, y: -1.03, z: 0.73 },
            { element: 'O', x: 0, y: -0.51, z: -1.27 },
            { element: 'H', x: -1.67, y: 0.73, z: 1.03 },
            { element: 'H', x: -2.14, y: 0.22, z: -0.51 },
            { element: 'H', x: -1.27, y: 1.78, z: -0.51 },
            { element: 'H', x: 1.67, y: 0.73, z: 1.03 },
            { element: 'H', x: 2.14, y: 0.22, z: -0.51 },
            { element: 'H', x: 1.27, y: 1.78, z: -0.51 },
            { element: 'H', x: 0, y: -2.08, z: 0.73 },
            { element: 'H', x: 0.89, y: -0.73, z: 1.27 },
            { element: 'H', x: -0.89, y: -0.73, z: 1.27 },
            { element: 'H', x: 0, y: -0.51, z: -1.87 }
        ],
        bonds: [[0,1], [0,2], [0,3], [0,4], [1,5], [1,6], [1,7], [2,8], [2,9], [2,10], [3,11], [3,12], [3,13], [4,14]]
    },
    // Pentanol isomers (C5H12O) 
    'pentan-2-ol': {
        name: 'Pentan-2-ol',
        formula: 'C₅H₁₁OH',
        description: 'Alcool secundar cu grupa -OH pe al doilea carbon.',
        properties: {
            physical: 'Punct de fierbere: 119°C | Punct de topire: -50°C | Densitate: 0.809 g/cm³ | Solubilitate: 4.5 g/100mL apă',
            chemical: 'Alcool secundar chiral. Oxidare la pentan-2-onă. Centru stereogenic - există forme enantiomerice.',
            uses: 'Utilizări: solvent, intermediar în sinteza organică, producerea aromelor și parfumurilor'
        },
        atoms: [
            { element: 'C', x: -2.54, y: 0, z: 0 },
            { element: 'C', x: -1.27, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.27, y: 0, z: 0 },
            { element: 'C', x: 2.54, y: 0, z: 0 },
            { element: 'O', x: -1.27, y: 1.4, z: 0 },
            { element: 'H', x: -2.94, y: 0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: -0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: 0, z: -1.03 },
            { element: 'H', x: -1.27, y: -0.51, z: -1.03 },
            { element: 'H', x: 0, y: 0.89, z: -0.51 },
            { element: 'H', x: 0, y: -0.89, z: 0.51 },
            { element: 'H', x: 1.27, y: 0.89, z: 0.51 },
            { element: 'H', x: 1.27, y: -0.89, z: -0.51 },
            { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
            { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
            { element: 'H', x: 2.94, y: 0, z: -1.03 },
            { element: 'H', x: -1.27, y: 2.0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,4], [1,5], [0,6], [0,7], [0,8], [1,9], [2,10], [2,11], [3,12], [3,13], [4,14], [4,15], [4,16], [5,17]]
    },
    'pentan-3-ol': {
        name: 'Pentan-3-ol',
        formula: 'C₅H₁₁OH',
        description: 'Alcool secundar simetric cu grupa -OH pe al treilea carbon.',
        properties: {
            physical: 'Punct de fierbere: 116°C | Punct de topire: -69°C | Densitate: 0.815 g/cm³ | Solubilitate: 5.9 g/100mL apă',
            chemical: 'Alcool secundar. Oxidare la pentan-3-onă (dietil cetonă). Moleculă achiralăcăa datorită simetriei.',
            uses: 'Utilizări: solvent pentru rășini și lacuri, intermediar în sinteza farmaceutică, extractant'
        },
        atoms: [
            { element: 'C', x: -2.54, y: 0, z: 0 },
            { element: 'C', x: -1.27, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.27, y: 0, z: 0 },
            { element: 'C', x: 2.54, y: 0, z: 0 },
            { element: 'O', x: 0, y: 1.4, z: 0 },
            { element: 'H', x: -2.94, y: 0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: -0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: 0, z: -1.03 },
            { element: 'H', x: -1.27, y: 0.89, z: -0.51 },
            { element: 'H', x: -1.27, y: -0.89, z: 0.51 },
            { element: 'H', x: 0, y: -0.51, z: -1.03 },
            { element: 'H', x: 1.27, y: 0.89, z: 0.51 },
            { element: 'H', x: 1.27, y: -0.89, z: -0.51 },
            { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
            { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
            { element: 'H', x: 2.94, y: 0, z: -1.03 },
            { element: 'H', x: 0, y: 2.0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,4], [2,5], [0,6], [0,7], [0,8], [1,9], [1,10], [2,11], [3,12], [3,13], [4,14], [4,15], [4,16], [5,17]]
    },
    '2-metilbutan-1-ol': {
        name: '2-Metilbutan-1-ol',
        formula: 'C₅H₁₁OH',
        description: 'Alcool primar ramificat. Izomer de catenă al pentan-1-ol.',
        properties: {
            physical: 'Punct de fierbere: 128°C | Punct de topire: -70°C | Densitate: 0.815 g/cm³ | Solubilitate: 3 g/100mL apă',
            chemical: 'Alcool primar ramificat chiral. Oxidare la 2-metilbutanal. Reacții de esterificare.',
            uses: 'Utilizări: solvent organic, producerea esterilor pentru arome (mere, fructe), intermediar farmaceutic'
        },
        atoms: [
            { element: 'C', x: -1.91, y: 0, z: 0 },
            { element: 'C', x: -0.64, y: 0, z: 0 },
            { element: 'C', x: 0.64, y: 0, z: 0 },
            { element: 'C', x: 1.91, y: 0, z: 0 },
            { element: 'C', x: -0.64, y: 1.52, z: 0 },
            { element: 'O', x: 3.05, y: 0, z: 0 },
            { element: 'H', x: -2.31, y: 0.89, z: 0.51 },
            { element: 'H', x: -2.31, y: -0.89, z: 0.51 },
            { element: 'H', x: -2.31, y: 0, z: -1.03 },
            { element: 'H', x: -0.64, y: -0.51, z: -1.03 },
            { element: 'H', x: 0.64, y: 0.89, z: -0.51 },
            { element: 'H', x: 0.64, y: -0.89, z: 0.51 },
            { element: 'H', x: 1.91, y: 0.89, z: -0.51 },
            { element: 'H', x: 1.91, y: -0.89, z: 0.51 },
            { element: 'H', x: -1.51, y: 1.91, z: 0.51 },
            { element: 'H', x: 0.23, y: 1.91, z: 0.51 },
            { element: 'H', x: -0.64, y: 1.91, z: -1.03 },
            { element: 'H', x: 3.65, y: 0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,5], [1,4], [0,6], [0,7], [0,8], [1,9], [2,10], [2,11], [3,12], [3,13], [4,14], [4,15], [4,16], [5,17]]
    },
    // Hexanol isomers (C6H14O)
    'hexan-2-ol': {
        name: 'Hexan-2-ol',
        formula: 'C₆H₁₃OH',
        description: 'Alcool secundar cu grupa -OH pe al doilea carbon.',
        properties: {
            physical: 'Punct de fierbere: 140°C | Punct de topire: -46°C | Densitate: 0.815 g/cm³ | Solubilitate: 1.4 g/100mL apă',
            chemical: 'Alcool secundar chiral. Oxidare la hexan-2-onă. Centru stereogenic.',
            uses: 'Utilizări: solvent pentru lacuri, arome fructate (prune), intermediar în sinteza organică'
        },
        atoms: [
            { element: 'C', x: -3.18, y: 0, z: 0 },
            { element: 'C', x: -1.91, y: 0, z: 0 },
            { element: 'C', x: -0.64, y: 0, z: 0 },
            { element: 'C', x: 0.64, y: 0, z: 0 },
            { element: 'C', x: 1.91, y: 0, z: 0 },
            { element: 'C', x: 3.18, y: 0, z: 0 },
            { element: 'O', x: -1.91, y: 1.4, z: 0 },
            { element: 'H', x: -3.58, y: 0.89, z: 0.51 },
            { element: 'H', x: -3.58, y: -0.89, z: 0.51 },
            { element: 'H', x: -3.58, y: 0, z: -1.03 },
            { element: 'H', x: -1.91, y: -0.51, z: -1.03 },
            { element: 'H', x: -0.64, y: 0.89, z: -0.51 },
            { element: 'H', x: -0.64, y: -0.89, z: 0.51 },
            { element: 'H', x: 0.64, y: 0.89, z: 0.51 },
            { element: 'H', x: 0.64, y: -0.89, z: -0.51 },
            { element: 'H', x: 1.91, y: 0.89, z: -0.51 },
            { element: 'H', x: 1.91, y: -0.89, z: 0.51 },
            { element: 'H', x: 3.58, y: 0.89, z: 0.51 },
            { element: 'H', x: 3.58, y: -0.89, z: 0.51 },
            { element: 'H', x: 3.58, y: 0, z: -1.03 },
            { element: 'H', x: -1.91, y: 2.0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [1,6], [0,7], [0,8], [0,9], [1,10], [2,11], [2,12], [3,13], [3,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20]]
    },
    'hexan-3-ol': {
        name: 'Hexan-3-ol',
        formula: 'C₆H₁₃OH',
        description: 'Alcool secundar cu grupa -OH pe al treilea carbon.',
        properties: {
            physical: 'Punct de fierbere: 135°C | Punct de topire: -42°C | Densitate: 0.818 g/cm³ | Solubilitate: 1.6 g/100mL apă',
            chemical: 'Alcool secundar chiral. Oxidare la hexan-3-onă (etil propil cetonă).',
            uses: 'Utilizări: solvent industrial, producerea aromelor, intermediar chimic'
        },
        atoms: [
            { element: 'C', x: -3.18, y: 0, z: 0 },
            { element: 'C', x: -1.91, y: 0, z: 0 },
            { element: 'C', x: -0.64, y: 0, z: 0 },
            { element: 'C', x: 0.64, y: 0, z: 0 },
            { element: 'C', x: 1.91, y: 0, z: 0 },
            { element: 'C', x: 3.18, y: 0, z: 0 },
            { element: 'O', x: -0.64, y: 1.4, z: 0 },
            { element: 'H', x: -3.58, y: 0.89, z: 0.51 },
            { element: 'H', x: -3.58, y: -0.89, z: 0.51 },
            { element: 'H', x: -3.58, y: 0, z: -1.03 },
            { element: 'H', x: -1.91, y: 0.89, z: -0.51 },
            { element: 'H', x: -1.91, y: -0.89, z: 0.51 },
            { element: 'H', x: -0.64, y: -0.51, z: -1.03 },
            { element: 'H', x: 0.64, y: 0.89, z: 0.51 },
            { element: 'H', x: 0.64, y: -0.89, z: -0.51 },
            { element: 'H', x: 1.91, y: 0.89, z: -0.51 },
            { element: 'H', x: 1.91, y: -0.89, z: 0.51 },
            { element: 'H', x: 3.58, y: 0.89, z: 0.51 },
            { element: 'H', x: 3.58, y: -0.89, z: 0.51 },
            { element: 'H', x: 3.58, y: 0, z: -1.03 },
            { element: 'H', x: -0.64, y: 2.0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [2,6], [0,7], [0,8], [0,9], [1,10], [1,11], [2,12], [3,13], [3,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20]]
    },
    '2-metilpentan-1-ol': {
        name: '2-Metilpentan-1-ol',
        formula: 'C₆H₁₃OH',
        description: 'Alcool primar ramificat. Izomer de catenă al hexan-1-ol.',
        properties: {
            physical: 'Punct de fierbere: 148°C | Punct de topire: -90°C | Densitate: 0.826 g/cm³ | Solubilitate: 1.5 g/100mL apă',
            chemical: 'Alcool primar ramificat chiral. Oxidare la 2-metilpentanal. Reacții de esterificare.',
            uses: 'Utilizări: solvent pentru rășini, producerea plastifianților, intermediar în sinteza organică'
        },
        atoms: [
            { element: 'C', x: -2.54, y: 0, z: 0 },
            { element: 'C', x: -1.27, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.27, y: 0, z: 0 },
            { element: 'C', x: 2.54, y: 0, z: 0 },
            { element: 'C', x: -1.27, y: 1.52, z: 0 },
            { element: 'O', x: 3.68, y: 0, z: 0 },
            { element: 'H', x: -2.94, y: 0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: -0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: 0, z: -1.03 },
            { element: 'H', x: -1.27, y: -0.51, z: -1.03 },
            { element: 'H', x: 0, y: 0.89, z: -0.51 },
            { element: 'H', x: 0, y: -0.89, z: 0.51 },
            { element: 'H', x: 1.27, y: 0.89, z: 0.51 },
            { element: 'H', x: 1.27, y: -0.89, z: -0.51 },
            { element: 'H', x: 2.54, y: 0.89, z: -0.51 },
            { element: 'H', x: 2.54, y: -0.89, z: 0.51 },
            { element: 'H', x: -2.14, y: 1.91, z: 0.51 },
            { element: 'H', x: -0.40, y: 1.91, z: 0.51 },
            { element: 'H', x: -1.27, y: 1.91, z: -1.03 },
            { element: 'H', x: 4.28, y: 0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,4], [4,6], [1,5], [0,7], [0,8], [0,9], [1,10], [2,11], [2,12], [3,13], [3,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20]]
    },
    '3-metilbutan-2-ol': {
        name: '3-Metilbutan-2-ol',
        formula: 'C₅H₁₁OH',
        description: 'Alcool secundar ramificat. Izomer de catenă al pentan-2-ol.',
        properties: {
            physical: 'Punct de fierbere: 112°C | Punct de topire: -117°C | Densitate: 0.818 g/cm³ | Solubilitate: 5.5 g/100mL apă',
            chemical: 'Alcool secundar chiral. Oxidare la 3-metilbutan-2-onă. Centru stereogenic.',
            uses: 'Utilizări: solvent, intermediar în sinteza organică, producerea esterilor'
        },
        atoms: [
            { element: 'C', x: -1.91, y: 0, z: 0 },
            { element: 'C', x: -0.64, y: 0, z: 0 },
            { element: 'C', x: 0.64, y: 0.73, z: 0 },
            { element: 'C', x: 0.64, y: 2.19, z: 0 },
            { element: 'C', x: 1.91, y: 0, z: 0 },
            { element: 'O', x: -0.64, y: -1.4, z: 0 },
            { element: 'H', x: -2.31, y: 0.89, z: 0.51 },
            { element: 'H', x: -2.31, y: -0.89, z: 0.51 },
            { element: 'H', x: -2.31, y: 0, z: -1.03 },
            { element: 'H', x: -0.64, y: 0.51, z: 1.03 },
            { element: 'H', x: 0.64, y: 0.73, z: 1.03 },
            { element: 'H', x: 1.04, y: 2.70, z: 0.89 },
            { element: 'H', x: -0.23, y: 2.70, z: 0.51 },
            { element: 'H', x: 1.04, y: 2.70, z: -0.89 },
            { element: 'H', x: 2.31, y: 0.89, z: 0.51 },
            { element: 'H', x: 2.31, y: -0.89, z: 0.51 },
            { element: 'H', x: 2.31, y: 0, z: -1.03 },
            { element: 'H', x: -0.64, y: -2.0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [2,3], [2,4], [1,5], [0,6], [0,7], [0,8], [1,9], [2,10], [3,11], [3,12], [3,13], [4,14], [4,15], [4,16], [5,17]]
    },
    '2,2-dimetilpropan-1-ol': {
        name: '2,2-Dimetilpropan-1-ol (Neopentil alcool)',
        formula: 'C₅H₁₁OH',
        description: 'Alcool primar foarte ramificat. Izomer de catenă al pentan-1-ol.',
        properties: {
            physical: 'Punct de fierbere: 113°C | Punct de topire: 53°C | Densitate: 0.812 g/cm³ | Solubilitate: 3.3 g/100mL apă',
            chemical: 'Alcool primar compact cu impiedicare sterică. Reactivitate redusă în esterificări datorită efectului steric.',
            uses: 'Utilizări: intermediar în sinteza organică, producerea poliolilor, agent de blocare steric'
        },
        atoms: [
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: -1.27, y: 0.73, z: 0 },
            { element: 'C', x: 1.27, y: 0.73, z: 0 },
            { element: 'C', x: 0, y: -0.73, z: 1.27 },
            { element: 'C', x: 0, y: -0.73, z: -1.27 },
            { element: 'O', x: 0, y: -1.87, z: -1.87 },
            { element: 'H', x: -1.67, y: 0.73, z: 1.03 },
            { element: 'H', x: -2.14, y: 0.22, z: -0.51 },
            { element: 'H', x: -1.27, y: 1.78, z: -0.51 },
            { element: 'H', x: 1.67, y: 0.73, z: 1.03 },
            { element: 'H', x: 2.14, y: 0.22, z: -0.51 },
            { element: 'H', x: 1.27, y: 1.78, z: -0.51 },
            { element: 'H', x: 0.89, y: -0.22, z: 1.67 },
            { element: 'H', x: -0.89, y: -0.22, z: 1.67 },
            { element: 'H', x: 0, y: -1.78, z: 1.67 },
            { element: 'H', x: 0.87, y: -0.22, z: -1.67 },
            { element: 'H', x: -0.87, y: -0.22, z: -1.67 },
            { element: 'H', x: 0, y: -2.47, z: -2.47 }
        ],
        bonds: [[0,1], [0,2], [0,3], [0,4], [4,5], [1,6], [1,7], [1,8], [2,9], [2,10], [2,11], [3,12], [3,13], [3,14], [4,15], [4,16], [5,17]]
    },
    '3-metilpentan-2-ol': {
        name: '3-Metilpentan-2-ol',
        formula: 'C₆H₁₃OH',
        description: 'Alcool secundar ramificat. Izomer de catenă al hexan-2-ol.',
        properties: {
            physical: 'Punct de fierbere: 134°C | Punct de topire: -103°C | Densitate: 0.824 g/cm³ | Solubilitate: 2.0 g/100mL apă',
            chemical: 'Alcool secundar chiral cu ramificație. Oxidare la 3-metilpentan-2-onă. Are doi centri stereogenici.',
            uses: 'Utilizări: solvent, intermediar chimic, producerea aromelor'
        },
        atoms: [
            { element: 'C', x: -2.54, y: 0, z: 0 },
            { element: 'C', x: -1.27, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0.73, z: 0 },
            { element: 'C', x: 0, y: 2.19, z: 0 },
            { element: 'C', x: 1.27, y: 0, z: 0 },
            { element: 'C', x: 2.54, y: 0, z: 0 },
            { element: 'O', x: -1.27, y: -1.4, z: 0 },
            { element: 'H', x: -2.94, y: 0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: -0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: 0, z: -1.03 },
            { element: 'H', x: -1.27, y: 0.51, z: 1.03 },
            { element: 'H', x: 0, y: 0.73, z: 1.03 },
            { element: 'H', x: 0.4, y: 2.70, z: 0.89 },
            { element: 'H', x: -0.87, y: 2.70, z: 0.51 },
            { element: 'H', x: 0.4, y: 2.70, z: -0.89 },
            { element: 'H', x: 1.27, y: 0.89, z: -0.51 },
            { element: 'H', x: 1.27, y: -0.89, z: 0.51 },
            { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
            { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
            { element: 'H', x: 2.94, y: 0, z: -1.03 },
            { element: 'H', x: -1.27, y: -2.0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [2,3], [2,4], [4,5], [1,6], [0,7], [0,8], [0,9], [1,10], [2,11], [3,12], [3,13], [3,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20]]
    },
    '3-metilpentan-3-ol': {
        name: '3-Metilpentan-3-ol',
        formula: 'C₆H₁₃OH',
        description: 'Alcool terțiar ramificat. Izomer de catenă al hexan-3-ol.',
        properties: {
            physical: 'Punct de fierbere: 123°C | Punct de topire: -23°C | Densitate: 0.828 g/cm³ | Solubilitate: 4.9 g/100mL apă',
            chemical: 'Alcool terțiar - nu se oxidează. Deshidratare ușoară la alchenă. Moleculă simetrică.',
            uses: 'Utilizări: solvent, intermediar în sinteza organică, agent de deshidratare'
        },
        atoms: [
            { element: 'C', x: -2.54, y: 0, z: 0 },
            { element: 'C', x: -1.27, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.27, y: 0, z: 0 },
            { element: 'C', x: 2.54, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 1.52 },
            { element: 'O', x: 0, y: 1.4, z: -0.6 },
            { element: 'H', x: -2.94, y: 0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: -0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: 0, z: -1.03 },
            { element: 'H', x: -1.27, y: 0.89, z: -0.51 },
            { element: 'H', x: -1.27, y: -0.89, z: 0.51 },
            { element: 'H', x: 1.27, y: 0.89, z: 0.51 },
            { element: 'H', x: 1.27, y: -0.89, z: -0.51 },
            { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
            { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
            { element: 'H', x: 2.94, y: 0, z: -1.03 },
            { element: 'H', x: 0.87, y: -0.51, z: 1.92 },
            { element: 'H', x: -0.87, y: -0.51, z: 1.92 },
            { element: 'H', x: 0, y: 1.03, z: 1.92 },
            { element: 'H', x: 0, y: 2.0, z: -1.2 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,4], [2,5], [2,6], [0,7], [0,8], [0,9], [1,10], [1,11], [3,12], [3,13], [4,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20]]
    },
    '4-metilpentan-1-ol': {
        name: '4-Metilpentan-1-ol (Izohexanol)',
        formula: 'C₆H₁₃OH',
        description: 'Alcool primar ramificat. Izomer de catenă al hexan-1-ol.',
        properties: {
            physical: 'Punct de fierbere: 151°C | Punct de topire: -90°C | Densitate: 0.813 g/cm³ | Solubilitate: 1.5 g/100mL apă',
            chemical: 'Alcool primar ramificat. Oxidare la 4-metilpentanal. Reacții de esterificare.',
            uses: 'Utilizări: solvent pentru rășini, producerea plastifianților și aromelor, intermediar chimic'
        },
        atoms: [
            { element: 'C', x: -2.54, y: 0, z: 0 },
            { element: 'C', x: -1.27, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.27, y: 0.73, z: 0 },
            { element: 'C', x: 1.27, y: 2.19, z: 0 },
            { element: 'C', x: 2.54, y: 0, z: 0 },
            { element: 'O', x: 3.68, y: 0, z: 0 },
            { element: 'H', x: -2.94, y: 0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: -0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: 0, z: -1.03 },
            { element: 'H', x: -1.27, y: 0.89, z: -0.51 },
            { element: 'H', x: -1.27, y: -0.89, z: 0.51 },
            { element: 'H', x: 0, y: 0.89, z: -0.51 },
            { element: 'H', x: 0, y: -0.89, z: 0.51 },
            { element: 'H', x: 1.27, y: 0.73, z: 1.03 },
            { element: 'H', x: 1.67, y: 2.70, z: 0.89 },
            { element: 'H', x: 0.4, y: 2.70, z: 0.51 },
            { element: 'H', x: 1.67, y: 2.70, z: -0.89 },
            { element: 'H', x: 2.54, y: 0.89, z: -0.51 },
            { element: 'H', x: 2.54, y: -0.89, z: 0.51 },
            { element: 'H', x: 4.28, y: 0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,4], [3,5], [5,6], [0,7], [0,8], [0,9], [1,10], [1,11], [2,12], [2,13], [3,14], [4,15], [4,16], [4,17], [5,18], [5,19], [6,20]]
    },
    '4-metilpentan-2-ol': {
        name: '4-Metilpentan-2-ol',
        formula: 'C₆H₁₃OH',
        description: 'Alcool secundar ramificat. Izomer de catenă al hexan-2-ol.',
        properties: {
            physical: 'Punct de fierbere: 131°C | Punct de topire: -90°C | Densitate: 0.807 g/cm³ | Solubilitate: 2.3 g/100mL apă',
            chemical: 'Alcool secundar chiral. Oxidare la 4-metilpentan-2-onă (metil izobutil cetonă, MIBK).',
            uses: 'Utilizări: solvent, intermediar pentru producerea MIBK (solvent important industrial)'
        },
        atoms: [
            { element: 'C', x: -2.54, y: 0, z: 0 },
            { element: 'C', x: -1.27, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.27, y: 0.73, z: 0 },
            { element: 'C', x: 1.27, y: 2.19, z: 0 },
            { element: 'C', x: 2.54, y: 0, z: 0 },
            { element: 'O', x: -1.27, y: -1.4, z: 0 },
            { element: 'H', x: -2.94, y: 0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: -0.89, z: 0.51 },
            { element: 'H', x: -2.94, y: 0, z: -1.03 },
            { element: 'H', x: -1.27, y: 0.51, z: 1.03 },
            { element: 'H', x: 0, y: 0.89, z: -0.51 },
            { element: 'H', x: 0, y: -0.89, z: 0.51 },
            { element: 'H', x: 1.27, y: 0.73, z: 1.03 },
            { element: 'H', x: 1.67, y: 2.70, z: 0.89 },
            { element: 'H', x: 0.4, y: 2.70, z: 0.51 },
            { element: 'H', x: 1.67, y: 2.70, z: -0.89 },
            { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
            { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
            { element: 'H', x: 2.94, y: 0, z: -1.03 },
            { element: 'H', x: -1.27, y: -2.0, z: 0 }
        ],
        bonds: [[0,1], [1,2], [2,3], [3,4], [3,5], [1,6], [0,7], [0,8], [0,9], [1,10], [2,11], [2,12], [3,13], [4,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20]]
    },
    '2,3-dimetilbutan-2-ol': {
        name: '2,3-Dimetilbutan-2-ol',
        formula: 'C₆H₁₃OH',
        description: 'Alcool terțiar ramificat. Izomer de catenă al hexan-2-ol.',
        properties: {
            physical: 'Punct de fierbere: 119°C | Punct de topire: -13°C | Densitate: 0.823 g/cm³ | Solubilitate: 9 g/100mL apă',
            chemical: 'Alcool terțiar - nu se oxidează. Deshidratare ușoară datorită stabilității carbocationului terțiar.',
            uses: 'Utilizări: solvent, intermediar chimic, agent de deshidratare'
        },
        atoms: [
            { element: 'C', x: -1.27, y: 0.73, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.27, y: 0.73, z: 0 },
            { element: 'C', x: 1.27, y: 2.19, z: 0 },
            { element: 'C', x: 2.54, y: 0, z: 0 },
            { element: 'C', x: 0, y: -0.73, z: 1.27 },
            { element: 'O', x: 0, y: -0.73, z: -1.27 },
            { element: 'H', x: -1.67, y: 0.73, z: 1.03 },
            { element: 'H', x: -2.14, y: 0.22, z: -0.51 },
            { element: 'H', x: -1.27, y: 1.78, z: -0.51 },
            { element: 'H', x: 1.27, y: 0.73, z: 1.03 },
            { element: 'H', x: 1.67, y: 2.70, z: 0.89 },
            { element: 'H', x: 0.4, y: 2.70, z: 0.51 },
            { element: 'H', x: 1.67, y: 2.70, z: -0.89 },
            { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
            { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
            { element: 'H', x: 2.94, y: 0, z: -1.03 },
            { element: 'H', x: 0.87, y: -0.22, z: 1.67 },
            { element: 'H', x: -0.87, y: -0.22, z: 1.67 },
            { element: 'H', x: 0, y: -1.78, z: 1.67 },
            { element: 'H', x: 0, y: -1.33, z: -1.87 }
        ],
        bonds: [[0,1], [1,2], [2,3], [2,4], [1,5], [1,6], [0,7], [0,8], [0,9], [2,10], [3,11], [3,12], [3,13], [4,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20]]
    },
    '2,2-dimetilbutan-1-ol': {
        name: '2,2-Dimetilbutan-1-ol',
        formula: 'C₆H₁₃OH',
        description: 'Alcool primar foarte ramificat. Izomer de catenă al hexan-1-ol.',
        properties: {
            physical: 'Punct de fierbere: 136°C | Punct de topire: -15°C | Densitate: 0.828 g/cm³ | Solubilitate: 2.0 g/100mL apă',
            chemical: 'Alcool primar cu impiedicare sterică mare. Reactivitate redusă în reacții de substituție și esterificare.',
            uses: 'Utilizări: intermediar în sinteza organică, producerea poliolilor, agent de blocare steric'
        },
        atoms: [
            { element: 'C', x: -1.27, y: 0.73, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.27, y: 0.73, z: 0 },
            { element: 'C', x: 2.54, y: 0, z: 0 },
            { element: 'C', x: 0, y: -0.73, z: 1.27 },
            { element: 'C', x: 0, y: -0.73, z: -1.27 },
            { element: 'O', x: 0, y: -1.87, z: -1.87 },
            { element: 'H', x: -1.67, y: 0.73, z: 1.03 },
            { element: 'H', x: -2.14, y: 0.22, z: -0.51 },
            { element: 'H', x: -1.27, y: 1.78, z: -0.51 },
            { element: 'H', x: 1.27, y: 0.73, z: 1.03 },
            { element: 'H', x: 1.27, y: 1.78, z: -0.51 },
            { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
            { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
            { element: 'H', x: 2.94, y: 0, z: -1.03 },
            { element: 'H', x: 0.87, y: -0.22, z: 1.67 },
            { element: 'H', x: -0.87, y: -0.22, z: 1.67 },
            { element: 'H', x: 0, y: -1.78, z: 1.67 },
            { element: 'H', x: 0.87, y: -0.22, z: -1.67 },
            { element: 'H', x: -0.87, y: -0.22, z: -1.67 },
            { element: 'H', x: 0, y: -2.47, z: -2.47 }
        ],
        bonds: [[0,1], [1,2], [2,3], [1,4], [1,5], [5,6], [0,7], [0,8], [0,9], [2,10], [2,11], [3,12], [3,13], [3,14], [4,15], [4,16], [4,17], [5,18], [5,19], [6,20]]
    },
    acetone: {
        name: 'Acetonă',
        formula: 'C₃H₆O',
        description: 'O cetonă cu o grupă carbonil, utilizată pe scară largă ca solvent.',
        atoms: [
            { element: 'C', x: -1.27, y: 0, z: 0 },
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'O', x: 0.6, y: 1.04, z: 0 },
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
    methane: {
        formula: 'CH₄',
        isomers: [
            {
                name: 'Metan',
                type: 'Singur izomer',
                description: 'Cel mai simplu alcan, nu are alți izomeri structurali',
                data: 'methane'
            }
        ]
    },
    ethane: {
        formula: 'C₂H₆',
        isomers: [
            {
                name: 'Etan',
                type: 'Singur izomer',
                description: 'Nu există alți izomeri structurali pentru C₂H₆',
                data: 'ethane'
            }
        ]
    },
    propane: {
        formula: 'C₃H₈',
        isomers: [
            {
                name: 'Propan',
                type: 'Singur izomer',
                description: 'Nu există alți izomeri structurali pentru C₃H₈',
                data: 'propane'
            }
        ]
    },
    ethene: {
        formula: 'C₂H₄',
        isomers: [
            {
                name: 'Etenă (etilenă)',
                type: 'Singur izomer',
                description: 'Nu există alți izomeri structurali pentru C₂H₄',
                data: 'ethene'
            }
        ]
    },
    ethyne: {
        formula: 'C₂H₂',
        isomers: [
            {
                name: 'Etină (acetilenă)',
                type: 'Singur izomer',
                description: 'Nu există alți izomeri structurali pentru C₂H₂',
                data: 'ethyne'
            }
        ]
    },
    propyne: {
        formula: 'C₃H₄',
        isomers: [
            {
                name: 'Propină',
                type: 'Izomerie de funcțiune',
                description: 'Alchină cu legătură triplă terminală',
                data: 'propyne'
            },
            {
                name: 'Propadienă (alenă)',
                type: 'Izomerie de funcțiune',
                description: 'Două legături duble cumulate (C=C=C)',
                atoms: [
                    { element: 'C', x: -1.27, y: 0, z: 0 },
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 1.27, y: 0, z: 0 },
                    { element: 'H', x: -1.67, y: 0.89, z: 0.51 },
                    { element: 'H', x: -1.67, y: -0.89, z: 0.51 },
                    { element: 'H', x: 1.67, y: 0.51, z: 0.89 },
                    { element: 'H', x: 1.67, y: 0.51, z: -0.89 }
                ],
                bonds: [[0,1,'double'], [1,2,'double'], [0,3], [0,4], [2,5], [2,6]]
            }
        ]
    },
    cyclopropane: {
        formula: 'C₃H₆',
        isomers: [
            {
                name: 'Ciclopropan',
                type: 'Izomerie de funcțiune',
                description: 'Compus ciclic cu legături simple',
                data: 'cyclopropane'
            },
            {
                name: 'Propenă',
                type: 'Izomerie de funcțiune',
                description: 'Alchenă cu dubla legătură',
                data: 'propene'
            }
        ]
    },
    cyclohexane: {
        formula: 'C₆H₁₂',
        isomers: [
            {
                name: 'Ciclohexan',
                type: 'Izomerie de catenă',
                description: 'Ciclu de 6 carboni',
                data: 'cyclohexane'
            },
            {
                name: 'Metilciclopentan',
                type: 'Izomerie de catenă',
                description: 'Ciclu de 5 carboni cu grup metil',
                atoms: [
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: -0.95, y: 0.95, z: 0 },
                    { element: 'C', x: -0.59, y: 2.35, z: 0 },
                    { element: 'C', x: 0.88, y: 2.35, z: 0 },
                    { element: 'C', x: 1.24, y: 0.95, z: 0 },
                    { element: 'C', x: 0.14, y: -1.46, z: 0 },
                    { element: 'H', x: -0.64, y: 0, z: 0.89 },
                    { element: 'H', x: -1.98, y: 0.95, z: 0.51 },
                    { element: 'H', x: -0.95, y: 0.95, z: -1.03 },
                    { element: 'H', x: -1.19, y: 2.95, z: 0.89 },
                    { element: 'H', x: -0.59, y: 2.86, z: -0.89 },
                    { element: 'H', x: 1.48, y: 2.95, z: 0.89 },
                    { element: 'H', x: 0.88, y: 2.86, z: -0.89 },
                    { element: 'H', x: 2.27, y: 0.95, z: 0.51 },
                    { element: 'H', x: 1.24, y: 0.95, z: -1.03 },
                    { element: 'H', x: 1.01, y: -1.97, z: 0.51 },
                    { element: 'H', x: -0.73, y: -1.97, z: 0.51 },
                    { element: 'H', x: 0.14, y: -1.97, z: -1.03 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [4,0], [0,5], [0,6], [1,7], [1,8], [2,9], [2,10], [3,11], [3,12], [4,13], [4,14], [5,15], [5,16], [5,17]]
            },
            {
                name: 'Etilciclobutan',
                type: 'Izomerie de catenă',
                description: 'Ciclu de 4 carboni cu grup etil',
                atoms: [
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: 1.27, z: 0 },
                    { element: 'C', x: 0, y: 1.27, z: 0 },
                    { element: 'C', x: 0.64, y: -0.73, z: 1.27 },
                    { element: 'C', x: 1.27, y: -1.46, z: 2.19 },
                    { element: 'H', x: 0, y: 0, z: -1.03 },
                    { element: 'H', x: -1.67, y: 0, z: 1.03 },
                    { element: 'H', x: -1.67, y: 0, z: -1.03 },
                    { element: 'H', x: -1.67, y: 1.27, z: 1.03 },
                    { element: 'H', x: -1.67, y: 1.27, z: -1.03 },
                    { element: 'H', x: 0, y: 1.27, z: 1.03 },
                    { element: 'H', x: 0, y: 1.67, z: -0.51 },
                    { element: 'H', x: -0.23, y: -0.22, z: 1.67 },
                    { element: 'H', x: 1.51, y: -0.22, z: 1.67 },
                    { element: 'H', x: 1.67, y: -1.97, z: 3.03 },
                    { element: 'H', x: 0.40, y: -1.97, z: 2.59 },
                    { element: 'H', x: 2.14, y: -1.97, z: 1.68 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,0], [0,4], [4,5], [0,6], [1,7], [1,8], [2,9], [2,10], [3,11], [3,12], [4,13], [4,14], [5,15], [5,16], [5,17]]
            }
        ]
    },
    benzene: {
        formula: 'C₆H₆',
        isomers: [
            {
                name: 'Benzen',
                type: 'Singur izomer aromatic',
                description: 'Structură aromatică unică, nu are alți izomeri structurali stabili',
                data: 'benzene'
            }
        ]
    },
    methylamine: {
        formula: 'CH₅N',
        isomers: [
            {
                name: 'Metilamină',
                type: 'Singur izomer',
                description: 'Cea mai simplă amină primară, nu are alți izomeri structurali',
                data: 'methylamine'
            }
        ]
    },
    aceticacid: {
        formula: 'C₂H₄O₂',
        isomers: [
            {
                name: 'Acid acetic',
                type: 'Izomerie de funcțiune',
                description: 'Acid carboxilic cu grupă -COOH',
                data: 'aceticacid'
            },
            {
                name: 'Metil format',
                type: 'Izomerie de funcțiune',
                description: 'Ester rezultat din acid formic și metanol',
                atoms: [
                    { element: 'C', x: -1.27, y: 0, z: 0 },
                    { element: 'H', x: -1.67, y: 0.89, z: 0.51 },
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'O', x: 0.64, y: 0, z: 1.14 },
                    { element: 'O', x: 0.64, y: 0, z: -1.14 },
                    { element: 'H', x: -1.67, y: -0.89, z: 0.51 },
                    { element: 'H', x: -1.67, y: 0, z: -1.03 },
                    { element: 'H', x: 0, y: 0.89, z: 0.51 }
                ],
                bonds: [[0,2], [2,3,'double'], [2,4], [0,1], [0,5], [0,6], [2,7]]
            }
        ]
    },
    acetone: {
        formula: 'C₃H₆O',
        isomers: [
            {
                name: 'Acetonă (propanona)',
                type: 'Izomerie de funcțiune',
                description: 'Cetonă cu grupă C=O',
                data: 'acetone'
            },
            {
                name: 'Propanal',
                type: 'Izomerie de funcțiune',
                description: 'Aldehidă cu grupă -CHO terminală',
                atoms: [
                    { element: 'C', x: -1.27, y: 0, z: 0 },
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 1.27, y: 0, z: 0 },
                    { element: 'O', x: 1.91, y: 0, z: 1.14 },
                    { element: 'H', x: -1.67, y: 0.89, z: 0.51 },
                    { element: 'H', x: -1.67, y: -0.89, z: 0.51 },
                    { element: 'H', x: -1.67, y: 0, z: -1.03 },
                    { element: 'H', x: 0, y: 0.89, z: -0.51 },
                    { element: 'H', x: 0, y: -0.89, z: 0.51 },
                    { element: 'H', x: 1.27, y: 0.89, z: -0.51 }
                ],
                bonds: [[0,1], [1,2], [2,3,'double'], [0,4], [0,5], [0,6], [1,7], [1,8], [2,9]]
            },
            {
                name: 'Metil vinil eter',
                type: 'Izomerie de funcțiune',
                description: 'Eter nesaturat cu dubla legătură',
                atoms: [
                    { element: 'C', x: -1.91, y: 0, z: 0 },
                    { element: 'O', x: -0.64, y: 0, z: 0 },
                    { element: 'C', x: 0.64, y: 0, z: 0 },
                    { element: 'C', x: 1.27, y: 0, z: 1.14 },
                    { element: 'H', x: -2.31, y: 0.89, z: 0.51 },
                    { element: 'H', x: -2.31, y: -0.89, z: 0.51 },
                    { element: 'H', x: -2.31, y: 0, z: -1.03 },
                    { element: 'H', x: 0.64, y: 0.89, z: -0.51 },
                    { element: 'H', x: 0.87, y: 0.89, z: 1.67 },
                    { element: 'H', x: 1.67, y: -0.89, z: 1.67 }
                ],
                bonds: [[0,1], [1,2], [2,3,'double'], [0,4], [0,5], [0,6], [2,7], [3,8], [3,9]]
            }
        ]
    },
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
    },
    hexane: {
        formula: 'C₆H₁₄',
        isomers: [
            {
                name: 'n-Hexan',
                type: 'Izomerie de catenă',
                description: 'Lanț liniar de 6 atomi de carbon',
                data: 'hexane'
            },
            {
                name: '2-Metilpentan',
                type: 'Izomerie de catenă',
                description: 'Lanț de 5 carboni cu grup metil pe C2',
                atoms: [
                    { element: 'C', x: -2.54, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 1.27, y: 0, z: 0 },
                    { element: 'C', x: 2.54, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: 2.19, z: 0 },
                    { element: 'H', x: -2.94, y: 0.89, z: 0.51 },
                    { element: 'H', x: -2.94, y: -0.89, z: 0.51 },
                    { element: 'H', x: -2.94, y: 0, z: -1.03 },
                    { element: 'H', x: -1.27, y: 0.73, z: 1.03 },
                    { element: 'H', x: 0, y: 0.89, z: -0.51 },
                    { element: 'H', x: 0, y: -0.89, z: 0.51 },
                    { element: 'H', x: 1.27, y: 0.89, z: 0.51 },
                    { element: 'H', x: 1.27, y: -0.89, z: -0.51 },
                    { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: 0, z: -1.03 },
                    { element: 'H', x: -1.67, y: 2.70, z: 1.03 },
                    { element: 'H', x: -2.14, y: 2.70, z: -0.51 },
                    { element: 'H', x: -0.40, y: 2.70, z: -0.51 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [1,5], [0,6], [0,7], [0,8], [1,9], [2,10], [2,11], [3,12], [3,13], [4,14], [4,15], [4,16], [5,17], [5,18], [5,19]]
            },
            {
                name: '3-Metilpentan',
                type: 'Izomerie de catenă',
                description: 'Lanț de 5 carboni cu grup metil pe C3',
                atoms: [
                    { element: 'C', x: -2.54, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: 0, z: 0 },
                    { element: 'C', x: 0, y: 0.73, z: 0 },
                    { element: 'C', x: 1.27, y: 0, z: 0 },
                    { element: 'C', x: 2.54, y: 0, z: 0 },
                    { element: 'C', x: 0, y: 2.19, z: 0 },
                    { element: 'H', x: -2.94, y: 0.89, z: 0.51 },
                    { element: 'H', x: -2.94, y: -0.89, z: 0.51 },
                    { element: 'H', x: -2.94, y: 0, z: -1.03 },
                    { element: 'H', x: -1.27, y: 0.89, z: -0.51 },
                    { element: 'H', x: -1.27, y: -0.89, z: 0.51 },
                    { element: 'H', x: 0, y: 0.73, z: 1.03 },
                    { element: 'H', x: 1.27, y: 0.89, z: -0.51 },
                    { element: 'H', x: 1.27, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: 0, z: -1.03 },
                    { element: 'H', x: 0.4, y: 2.70, z: 1.03 },
                    { element: 'H', x: -0.87, y: 2.70, z: 0.51 },
                    { element: 'H', x: 0.4, y: 2.70, z: -0.89 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [2,5], [0,6], [0,7], [0,8], [1,9], [1,10], [2,11], [3,12], [3,13], [4,14], [4,15], [4,16], [5,17], [5,18], [5,19]]
            },
            {
                name: '2,2-Dimetilbutan',
                type: 'Izomerie de catenă',
                description: 'Lanț de 4 carboni cu două grupuri metil pe C2',
                atoms: [
                    { element: 'C', x: -1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 1.27, y: 0, z: 0 },
                    { element: 'C', x: 2.54, y: 0, z: 0 },
                    { element: 'C', x: 0, y: -0.73, z: 1.27 },
                    { element: 'C', x: 0, y: -0.73, z: -1.27 },
                    { element: 'H', x: -1.67, y: 0.73, z: 1.03 },
                    { element: 'H', x: -2.14, y: 0.22, z: -0.51 },
                    { element: 'H', x: -1.27, y: 1.78, z: -0.51 },
                    { element: 'H', x: 1.27, y: 0.89, z: -0.51 },
                    { element: 'H', x: 1.27, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: 0, z: -1.03 },
                    { element: 'H', x: 0.87, y: -0.22, z: 1.67 },
                    { element: 'H', x: -0.87, y: -0.22, z: 1.67 },
                    { element: 'H', x: 0, y: -1.78, z: 1.67 },
                    { element: 'H', x: 0.87, y: -0.22, z: -1.67 },
                    { element: 'H', x: -0.87, y: -0.22, z: -1.67 },
                    { element: 'H', x: 0, y: -1.78, z: -1.67 }
                ],
                bonds: [[0,1], [1,2], [2,3], [1,4], [1,5], [0,6], [0,7], [0,8], [2,9], [2,10], [3,11], [3,12], [3,13], [4,14], [4,15], [4,16], [5,17], [5,18], [5,19]]
            },
            {
                name: '2,3-Dimetilbutan',
                type: 'Izomerie de catenă',
                description: 'Lanț de 4 carboni cu grupuri metil pe C2 și C3',
                atoms: [
                    { element: 'C', x: -1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 2.54, y: 0, z: 0 },
                    { element: 'C', x: 0, y: -1.46, z: 0 },
                    { element: 'C', x: 1.27, y: 2.19, z: 0 },
                    { element: 'H', x: -1.67, y: 0.73, z: 1.03 },
                    { element: 'H', x: -2.14, y: 0.22, z: -0.51 },
                    { element: 'H', x: -1.27, y: 1.78, z: -0.51 },
                    { element: 'H', x: 0, y: 0.51, z: 1.03 },
                    { element: 'H', x: 1.27, y: 0.73, z: 1.03 },
                    { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: 0, z: -1.03 },
                    { element: 'H', x: 0.4, y: -1.97, z: 1.03 },
                    { element: 'H', x: -0.87, y: -1.97, z: 0.51 },
                    { element: 'H', x: 0.4, y: -1.97, z: -0.89 },
                    { element: 'H', x: 1.67, y: 2.70, z: 1.03 },
                    { element: 'H', x: 0.40, y: 2.70, z: 0.51 },
                    { element: 'H', x: 2.14, y: 2.70, z: -0.51 }
                ],
                bonds: [[0,1], [1,2], [2,3], [1,4], [2,5], [0,6], [0,7], [0,8], [1,9], [2,10], [3,11], [3,12], [3,13], [4,14], [4,15], [4,16], [5,17], [5,18], [5,19]]
            }
        ]
    },
    heptane: {
        formula: 'C₇H₁₆',
        isomers: [
            {
                name: 'n-Heptan',
                type: 'Izomerie de catenă',
                description: 'Lanț liniar de 7 atomi de carbon',
                data: 'heptane'
            },
            {
                name: '2-Metilhexan',
                type: 'Izomerie de catenă',
                description: 'Lanț de 6 carboni cu grup metil pe C2',
                atoms: [
                    { element: 'C', x: -3.18, y: 0, z: 0 },
                    { element: 'C', x: -1.91, y: 0.73, z: 0 },
                    { element: 'C', x: -0.64, y: 0, z: 0 },
                    { element: 'C', x: 0.64, y: 0, z: 0 },
                    { element: 'C', x: 1.91, y: 0, z: 0 },
                    { element: 'C', x: 3.18, y: 0, z: 0 },
                    { element: 'C', x: -1.91, y: 2.19, z: 0 },
                    { element: 'H', x: -3.58, y: 0.89, z: 0.51 },
                    { element: 'H', x: -3.58, y: -0.89, z: 0.51 },
                    { element: 'H', x: -3.58, y: 0, z: -1.03 },
                    { element: 'H', x: -1.91, y: 0.73, z: 1.03 },
                    { element: 'H', x: -0.64, y: 0.89, z: -0.51 },
                    { element: 'H', x: -0.64, y: -0.89, z: 0.51 },
                    { element: 'H', x: 0.64, y: 0.89, z: 0.51 },
                    { element: 'H', x: 0.64, y: -0.89, z: -0.51 },
                    { element: 'H', x: 1.91, y: 0.89, z: -0.51 },
                    { element: 'H', x: 1.91, y: -0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: 0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: -0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: 0, z: -1.03 },
                    { element: 'H', x: -2.31, y: 2.70, z: 1.03 },
                    { element: 'H', x: -2.78, y: 2.70, z: -0.51 },
                    { element: 'H', x: -1.04, y: 2.70, z: -0.51 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [1,6], [0,7], [0,8], [0,9], [1,10], [2,11], [2,12], [3,13], [3,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20], [6,21], [6,22]]
            },
            {
                name: '3-Metilhexan',
                type: 'Izomerie de catenă',
                description: 'Lanț de 6 carboni cu grup metil pe C3',
                atoms: [
                    { element: 'C', x: -3.18, y: 0, z: 0 },
                    { element: 'C', x: -1.91, y: 0, z: 0 },
                    { element: 'C', x: -0.64, y: 0.73, z: 0 },
                    { element: 'C', x: 0.64, y: 0, z: 0 },
                    { element: 'C', x: 1.91, y: 0, z: 0 },
                    { element: 'C', x: 3.18, y: 0, z: 0 },
                    { element: 'C', x: -0.64, y: 2.19, z: 0 },
                    { element: 'H', x: -3.58, y: 0.89, z: 0.51 },
                    { element: 'H', x: -3.58, y: -0.89, z: 0.51 },
                    { element: 'H', x: -3.58, y: 0, z: -1.03 },
                    { element: 'H', x: -1.91, y: 0.89, z: -0.51 },
                    { element: 'H', x: -1.91, y: -0.89, z: 0.51 },
                    { element: 'H', x: -0.64, y: 0.73, z: 1.03 },
                    { element: 'H', x: 0.64, y: 0.89, z: -0.51 },
                    { element: 'H', x: 0.64, y: -0.89, z: 0.51 },
                    { element: 'H', x: 1.91, y: 0.89, z: 0.51 },
                    { element: 'H', x: 1.91, y: -0.89, z: -0.51 },
                    { element: 'H', x: 3.58, y: 0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: -0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: 0, z: -1.03 },
                    { element: 'H', x: -0.24, y: 2.70, z: 1.03 },
                    { element: 'H', x: -1.51, y: 2.70, z: 0.51 },
                    { element: 'H', x: -0.24, y: 2.70, z: -0.89 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [2,6], [0,7], [0,8], [0,9], [1,10], [1,11], [2,12], [3,13], [3,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20], [6,21], [6,22]]
            },
            {
                name: '2,2-Dimetilpentan',
                type: 'Izomerie de catenă',
                description: 'Lanț de 5 carboni cu două grupuri metil pe C2',
                atoms: [
                    { element: 'C', x: -1.91, y: 0.73, z: 0 },
                    { element: 'C', x: -0.64, y: 0, z: 0 },
                    { element: 'C', x: 0.64, y: 0, z: 0 },
                    { element: 'C', x: 1.91, y: 0, z: 0 },
                    { element: 'C', x: 3.18, y: 0, z: 0 },
                    { element: 'C', x: -0.64, y: -0.73, z: 1.27 },
                    { element: 'C', x: -0.64, y: -0.73, z: -1.27 },
                    { element: 'H', x: -2.31, y: 0.73, z: 1.03 },
                    { element: 'H', x: -2.78, y: 0.22, z: -0.51 },
                    { element: 'H', x: -1.91, y: 1.78, z: -0.51 },
                    { element: 'H', x: 0.64, y: 0.89, z: -0.51 },
                    { element: 'H', x: 0.64, y: -0.89, z: 0.51 },
                    { element: 'H', x: 1.91, y: 0.89, z: 0.51 },
                    { element: 'H', x: 1.91, y: -0.89, z: -0.51 },
                    { element: 'H', x: 3.58, y: 0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: -0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: 0, z: -1.03 },
                    { element: 'H', x: 0.23, y: -0.22, z: 1.67 },
                    { element: 'H', x: -1.51, y: -0.22, z: 1.67 },
                    { element: 'H', x: -0.64, y: -1.78, z: 1.67 },
                    { element: 'H', x: 0.23, y: -0.22, z: -1.67 },
                    { element: 'H', x: -1.51, y: -0.22, z: -1.67 },
                    { element: 'H', x: -0.64, y: -1.78, z: -1.67 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [1,5], [1,6], [0,7], [0,8], [0,9], [2,10], [2,11], [3,12], [3,13], [4,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20], [6,21], [6,22]]
            },
            {
                name: '2,3-Dimetilpentan',
                type: 'Izomerie de catenă',
                description: 'Lanț de 5 carboni cu grupuri metil pe C2 și C3',
                atoms: [
                    { element: 'C', x: -1.91, y: 0.73, z: 0 },
                    { element: 'C', x: -0.64, y: 0, z: 0 },
                    { element: 'C', x: 0.64, y: 0.73, z: 0 },
                    { element: 'C', x: 1.91, y: 0, z: 0 },
                    { element: 'C', x: 3.18, y: 0, z: 0 },
                    { element: 'C', x: -0.64, y: -1.46, z: 0 },
                    { element: 'C', x: 0.64, y: 2.19, z: 0 },
                    { element: 'H', x: -2.31, y: 0.73, z: 1.03 },
                    { element: 'H', x: -2.78, y: 0.22, z: -0.51 },
                    { element: 'H', x: -1.91, y: 1.78, z: -0.51 },
                    { element: 'H', x: -0.64, y: 0.51, z: 1.03 },
                    { element: 'H', x: 0.64, y: 0.73, z: 1.03 },
                    { element: 'H', x: 1.91, y: 0.89, z: -0.51 },
                    { element: 'H', x: 1.91, y: -0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: 0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: -0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: 0, z: -1.03 },
                    { element: 'H', x: -0.24, y: -1.97, z: 1.03 },
                    { element: 'H', x: -1.51, y: -1.97, z: 0.51 },
                    { element: 'H', x: -0.24, y: -1.97, z: -0.89 },
                    { element: 'H', x: 1.04, y: 2.70, z: 1.03 },
                    { element: 'H', x: -0.23, y: 2.70, z: 0.51 },
                    { element: 'H', x: 1.04, y: 2.70, z: -0.89 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [1,5], [2,6], [0,7], [0,8], [0,9], [1,10], [2,11], [3,12], [3,13], [4,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20], [6,21], [6,22]]
            },
            {
                name: '2,4-Dimetilpentan',
                type: 'Izomerie de catenă',
                description: 'Lanț de 5 carboni cu grupuri metil pe C2 și C4',
                atoms: [
                    { element: 'C', x: -2.54, y: 0.73, z: 0 },
                    { element: 'C', x: -1.27, y: 0, z: 0 },
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 2.54, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: -1.46, z: 0 },
                    { element: 'C', x: 1.27, y: 2.19, z: 0 },
                    { element: 'H', x: -2.94, y: 0.73, z: 1.03 },
                    { element: 'H', x: -3.41, y: 0.22, z: -0.51 },
                    { element: 'H', x: -2.54, y: 1.78, z: -0.51 },
                    { element: 'H', x: -1.27, y: 0.51, z: 1.03 },
                    { element: 'H', x: 0, y: 0.89, z: -0.51 },
                    { element: 'H', x: 0, y: -0.89, z: 0.51 },
                    { element: 'H', x: 1.27, y: 0.73, z: 1.03 },
                    { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: 0, z: -1.03 },
                    { element: 'H', x: -0.87, y: -1.97, z: 1.03 },
                    { element: 'H', x: -2.14, y: -1.97, z: 0.51 },
                    { element: 'H', x: -0.87, y: -1.97, z: -0.89 },
                    { element: 'H', x: 1.67, y: 2.70, z: 1.03 },
                    { element: 'H', x: 0.40, y: 2.70, z: 0.51 },
                    { element: 'H', x: 2.14, y: 2.70, z: -0.51 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [1,5], [3,6], [0,7], [0,8], [0,9], [1,10], [2,11], [2,12], [3,13], [4,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20], [6,21], [6,22]]
            },
            {
                name: '3,3-Dimetilpentan',
                type: 'Izomerie de catenă',
                description: 'Lanț de 5 carboni cu două grupuri metil pe C3',
                atoms: [
                    { element: 'C', x: -2.54, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: 0, z: 0 },
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 1.27, y: 0, z: 0 },
                    { element: 'C', x: 2.54, y: 0, z: 0 },
                    { element: 'C', x: 0, y: 0.73, z: 1.27 },
                    { element: 'C', x: 0, y: 0.73, z: -1.27 },
                    { element: 'H', x: -2.94, y: 0.89, z: 0.51 },
                    { element: 'H', x: -2.94, y: -0.89, z: 0.51 },
                    { element: 'H', x: -2.94, y: 0, z: -1.03 },
                    { element: 'H', x: -1.27, y: 0.89, z: -0.51 },
                    { element: 'H', x: -1.27, y: -0.89, z: 0.51 },
                    { element: 'H', x: 1.27, y: 0.89, z: 0.51 },
                    { element: 'H', x: 1.27, y: -0.89, z: -0.51 },
                    { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: 0, z: -1.03 },
                    { element: 'H', x: 0.87, y: 0.22, z: 1.67 },
                    { element: 'H', x: -0.87, y: 0.22, z: 1.67 },
                    { element: 'H', x: 0, y: 1.78, z: 1.67 },
                    { element: 'H', x: 0.87, y: 0.22, z: -1.67 },
                    { element: 'H', x: -0.87, y: 0.22, z: -1.67 },
                    { element: 'H', x: 0, y: 1.78, z: -1.67 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [2,5], [2,6], [0,7], [0,8], [0,9], [1,10], [1,11], [3,12], [3,13], [4,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20], [6,21], [6,22]]
            }
        ]
    },
    octane: {
        formula: 'C₈H₁₈',
        isomers: [
            {
                name: 'n-Octan',
                type: 'Izomerie de catenă',
                description: 'Lanț liniar de 8 atomi de carbon',
                data: 'octane'
            },
            {
                name: '2-Metilheptan',
                type: 'Izomerie de catenă',
                description: 'Lanț de 7 carboni cu grup metil pe C2',
                atoms: [
                    { element: 'C', x: -3.81, y: 0, z: 0 },
                    { element: 'C', x: -2.54, y: 0.73, z: 0 },
                    { element: 'C', x: -1.27, y: 0, z: 0 },
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 1.27, y: 0, z: 0 },
                    { element: 'C', x: 2.54, y: 0, z: 0 },
                    { element: 'C', x: 3.81, y: 0, z: 0 },
                    { element: 'C', x: -2.54, y: 2.19, z: 0 },
                    { element: 'H', x: -4.21, y: 0.89, z: 0.51 },
                    { element: 'H', x: -4.21, y: -0.89, z: 0.51 },
                    { element: 'H', x: -4.21, y: 0, z: -1.03 },
                    { element: 'H', x: -2.54, y: 0.73, z: 1.03 },
                    { element: 'H', x: -1.27, y: 0.89, z: -0.51 },
                    { element: 'H', x: -1.27, y: -0.89, z: 0.51 },
                    { element: 'H', x: 0, y: 0.89, z: 0.51 },
                    { element: 'H', x: 0, y: -0.89, z: -0.51 },
                    { element: 'H', x: 1.27, y: 0.89, z: -0.51 },
                    { element: 'H', x: 1.27, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.54, y: 0.89, z: 0.51 },
                    { element: 'H', x: 2.54, y: -0.89, z: -0.51 },
                    { element: 'H', x: 4.21, y: 0.89, z: 0.51 },
                    { element: 'H', x: 4.21, y: -0.89, z: 0.51 },
                    { element: 'H', x: 4.21, y: 0, z: -1.03 },
                    { element: 'H', x: -2.94, y: 2.70, z: 1.03 },
                    { element: 'H', x: -3.41, y: 2.70, z: -0.51 },
                    { element: 'H', x: -1.67, y: 2.70, z: -0.51 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [1,7], [0,8], [0,9], [0,10], [1,11], [2,12], [2,13], [3,14], [3,15], [4,16], [4,17], [5,18], [5,19], [6,20], [6,21], [6,22], [7,23], [7,24], [7,25]]
            },
            {
                name: '3-Metilheptan',
                type: 'Izomerie de catenă',
                description: 'Lanț de 7 carboni cu grup metil pe C3',
                atoms: [
                    { element: 'C', x: -3.81, y: 0, z: 0 },
                    { element: 'C', x: -2.54, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 1.27, y: 0, z: 0 },
                    { element: 'C', x: 2.54, y: 0, z: 0 },
                    { element: 'C', x: 3.81, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: 2.19, z: 0 },
                    { element: 'H', x: -4.21, y: 0.89, z: 0.51 },
                    { element: 'H', x: -4.21, y: -0.89, z: 0.51 },
                    { element: 'H', x: -4.21, y: 0, z: -1.03 },
                    { element: 'H', x: -2.54, y: 0.89, z: -0.51 },
                    { element: 'H', x: -2.54, y: -0.89, z: 0.51 },
                    { element: 'H', x: -1.27, y: 0.73, z: 1.03 },
                    { element: 'H', x: 0, y: 0.89, z: -0.51 },
                    { element: 'H', x: 0, y: -0.89, z: 0.51 },
                    { element: 'H', x: 1.27, y: 0.89, z: 0.51 },
                    { element: 'H', x: 1.27, y: -0.89, z: -0.51 },
                    { element: 'H', x: 2.54, y: 0.89, z: -0.51 },
                    { element: 'H', x: 2.54, y: -0.89, z: 0.51 },
                    { element: 'H', x: 4.21, y: 0.89, z: 0.51 },
                    { element: 'H', x: 4.21, y: -0.89, z: 0.51 },
                    { element: 'H', x: 4.21, y: 0, z: -1.03 },
                    { element: 'H', x: -0.87, y: 2.70, z: 1.03 },
                    { element: 'H', x: -2.14, y: 2.70, z: 0.51 },
                    { element: 'H', x: -0.87, y: 2.70, z: -0.89 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6], [2,7], [0,8], [0,9], [0,10], [1,11], [1,12], [2,13], [3,14], [3,15], [4,16], [4,17], [5,18], [5,19], [6,20], [6,21], [6,22], [7,23], [7,24], [7,25]]
            },
            {
                name: '2,2-Dimetilhexan',
                type: 'Izomerie de catenă',
                description: 'Lanț de 6 carboni cu două grupuri metil pe C2',
                atoms: [
                    { element: 'C', x: -2.54, y: 0.73, z: 0 },
                    { element: 'C', x: -1.27, y: 0, z: 0 },
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 1.27, y: 0, z: 0 },
                    { element: 'C', x: 2.54, y: 0, z: 0 },
                    { element: 'C', x: 3.81, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: -0.73, z: 1.27 },
                    { element: 'C', x: -1.27, y: -0.73, z: -1.27 },
                    { element: 'H', x: -2.94, y: 0.73, z: 1.03 },
                    { element: 'H', x: -3.41, y: 0.22, z: -0.51 },
                    { element: 'H', x: -2.54, y: 1.78, z: -0.51 },
                    { element: 'H', x: 0, y: 0.89, z: -0.51 },
                    { element: 'H', x: 0, y: -0.89, z: 0.51 },
                    { element: 'H', x: 1.27, y: 0.89, z: 0.51 },
                    { element: 'H', x: 1.27, y: -0.89, z: -0.51 },
                    { element: 'H', x: 2.54, y: 0.89, z: -0.51 },
                    { element: 'H', x: 2.54, y: -0.89, z: 0.51 },
                    { element: 'H', x: 4.21, y: 0.89, z: 0.51 },
                    { element: 'H', x: 4.21, y: -0.89, z: 0.51 },
                    { element: 'H', x: 4.21, y: 0, z: -1.03 },
                    { element: 'H', x: -0.40, y: -0.22, z: 1.67 },
                    { element: 'H', x: -2.14, y: -0.22, z: 1.67 },
                    { element: 'H', x: -1.27, y: -1.78, z: 1.67 },
                    { element: 'H', x: -0.40, y: -0.22, z: -1.67 },
                    { element: 'H', x: -2.14, y: -0.22, z: -1.67 },
                    { element: 'H', x: -1.27, y: -1.78, z: -1.67 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [1,6], [1,7], [0,8], [0,9], [0,10], [2,11], [2,12], [3,13], [3,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20], [6,21], [6,22], [7,23], [7,24], [7,25]]
            },
            {
                name: '2,3-Dimetilhexan',
                type: 'Izomerie de catenă',
                description: 'Lanț de 6 carboni cu grupuri metil pe C2 și C3',
                atoms: [
                    { element: 'C', x: -2.54, y: 0.73, z: 0 },
                    { element: 'C', x: -1.27, y: 0, z: 0 },
                    { element: 'C', x: 0, y: 0.73, z: 0 },
                    { element: 'C', x: 1.27, y: 0, z: 0 },
                    { element: 'C', x: 2.54, y: 0, z: 0 },
                    { element: 'C', x: 3.81, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: -1.46, z: 0 },
                    { element: 'C', x: 0, y: 2.19, z: 0 },
                    { element: 'H', x: -2.94, y: 0.73, z: 1.03 },
                    { element: 'H', x: -3.41, y: 0.22, z: -0.51 },
                    { element: 'H', x: -2.54, y: 1.78, z: -0.51 },
                    { element: 'H', x: -1.27, y: 0.51, z: 1.03 },
                    { element: 'H', x: 0, y: 0.73, z: 1.03 },
                    { element: 'H', x: 1.27, y: 0.89, z: -0.51 },
                    { element: 'H', x: 1.27, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.54, y: 0.89, z: 0.51 },
                    { element: 'H', x: 2.54, y: -0.89, z: -0.51 },
                    { element: 'H', x: 4.21, y: 0.89, z: 0.51 },
                    { element: 'H', x: 4.21, y: -0.89, z: 0.51 },
                    { element: 'H', x: 4.21, y: 0, z: -1.03 },
                    { element: 'H', x: -0.87, y: -1.97, z: 1.03 },
                    { element: 'H', x: -2.14, y: -1.97, z: 0.51 },
                    { element: 'H', x: -0.87, y: -1.97, z: -0.89 },
                    { element: 'H', x: 0.4, y: 2.70, z: 1.03 },
                    { element: 'H', x: -0.87, y: 2.70, z: 0.51 },
                    { element: 'H', x: 0.4, y: 2.70, z: -0.89 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [1,6], [2,7], [0,8], [0,9], [0,10], [1,11], [2,12], [3,13], [3,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20], [6,21], [6,22], [7,23], [7,24], [7,25]]
            },
            {
                name: '2,5-Dimetilhexan',
                type: 'Izomerie de catenă',
                description: 'Lanț de 6 carboni cu grupuri metil pe C2 și C5',
                atoms: [
                    { element: 'C', x: -3.18, y: 0.73, z: 0 },
                    { element: 'C', x: -1.91, y: 0, z: 0 },
                    { element: 'C', x: -0.64, y: 0, z: 0 },
                    { element: 'C', x: 0.64, y: 0, z: 0 },
                    { element: 'C', x: 1.91, y: 0.73, z: 0 },
                    { element: 'C', x: 3.18, y: 0, z: 0 },
                    { element: 'C', x: -1.91, y: -1.46, z: 0 },
                    { element: 'C', x: 1.91, y: 2.19, z: 0 },
                    { element: 'H', x: -3.58, y: 0.73, z: 1.03 },
                    { element: 'H', x: -4.05, y: 0.22, z: -0.51 },
                    { element: 'H', x: -3.18, y: 1.78, z: -0.51 },
                    { element: 'H', x: -1.91, y: 0.51, z: 1.03 },
                    { element: 'H', x: -0.64, y: 0.89, z: -0.51 },
                    { element: 'H', x: -0.64, y: -0.89, z: 0.51 },
                    { element: 'H', x: 0.64, y: 0.89, z: 0.51 },
                    { element: 'H', x: 0.64, y: -0.89, z: -0.51 },
                    { element: 'H', x: 1.91, y: 0.73, z: 1.03 },
                    { element: 'H', x: 3.58, y: 0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: -0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: 0, z: -1.03 },
                    { element: 'H', x: -1.51, y: -1.97, z: 1.03 },
                    { element: 'H', x: -2.78, y: -1.97, z: 0.51 },
                    { element: 'H', x: -1.51, y: -1.97, z: -0.89 },
                    { element: 'H', x: 2.31, y: 2.70, z: 1.03 },
                    { element: 'H', x: 1.04, y: 2.70, z: 0.51 },
                    { element: 'H', x: 2.78, y: 2.70, z: -0.51 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [1,6], [4,7], [0,8], [0,9], [0,10], [1,11], [2,12], [2,13], [3,14], [3,15], [4,16], [5,17], [5,18], [5,19], [6,20], [6,21], [6,22], [7,23], [7,24], [7,25]]
            }
        ]
    },
    propanol: {
        formula: 'C₃H₈O',
        isomers: [
            {
                name: 'Propan-1-ol',
                type: 'Izomerie de poziție',
                description: 'Alcool primar cu -OH pe C1',
                data: 'propanol'
            },
            {
                name: 'Propan-2-ol (izopropanol)',
                type: 'Izomerie de poziție',
                description: 'Alcool secundar cu -OH pe C2',
                atoms: [
                    { element: 'C', x: -1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 1.27, y: 0.73, z: 0 },
                    { element: 'O', x: 0, y: -1.4, z: 0 },
                    { element: 'H', x: -1.67, y: 0.73, z: 1.03 },
                    { element: 'H', x: -2.14, y: 0.22, z: -0.51 },
                    { element: 'H', x: -1.27, y: 1.78, z: -0.51 },
                    { element: 'H', x: 0, y: 0.51, z: 1.03 },
                    { element: 'H', x: 1.67, y: 0.73, z: 1.03 },
                    { element: 'H', x: 2.14, y: 0.22, z: -0.51 },
                    { element: 'H', x: 1.27, y: 1.78, z: -0.51 },
                    { element: 'H', x: 0, y: -2.0, z: 0 }
                ],
                bonds: [[0,1], [1,2], [1,3], [0,4], [0,5], [0,6], [1,7], [2,8], [2,9], [2,10], [3,11]]
            }
        ]
    },
    butanol: {
        formula: 'C₄H₁₀O',
        isomers: [
            {
                name: 'Butan-1-ol',
                type: 'Izomerie de poziție',
                description: 'Alcool primar cu -OH pe C1',
                data: 'butanol'
            },
            {
                name: 'Butan-2-ol',
                type: 'Izomerie de poziție',
                description: 'Alcool secundar cu -OH pe C2',
                atoms: [
                    { element: 'C', x: -1.91, y: 0, z: 0 },
                    { element: 'C', x: -0.64, y: 0, z: 0 },
                    { element: 'C', x: 0.64, y: 0.73, z: 0 },
                    { element: 'C', x: 1.91, y: 0, z: 0 },
                    { element: 'O', x: -0.64, y: -1.4, z: 0 },
                    { element: 'H', x: -2.31, y: 0.89, z: 0.51 },
                    { element: 'H', x: -2.31, y: -0.89, z: 0.51 },
                    { element: 'H', x: -2.31, y: 0, z: -1.03 },
                    { element: 'H', x: -0.64, y: 0.51, z: 1.03 },
                    { element: 'H', x: 0.64, y: 0.73, z: 1.03 },
                    { element: 'H', x: 0.64, y: 1.78, z: -0.51 },
                    { element: 'H', x: 2.31, y: 0.89, z: 0.51 },
                    { element: 'H', x: 2.31, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.31, y: 0, z: -1.03 },
                    { element: 'H', x: -0.64, y: -2.0, z: 0 }
                ],
                bonds: [[0,1], [1,2], [2,3], [1,4], [0,5], [0,6], [0,7], [1,8], [2,9], [2,10], [3,11], [3,12], [3,13], [4,14]]
            },
            {
                name: '2-Metilpropan-1-ol (izobutanol)',
                type: 'Izomerie de catenă',
                description: 'Alcool primar cu lanț ramificat',
                atoms: [
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 0, y: -1.52, z: 0 },
                    { element: 'O', x: 0, y: -2.66, z: 0 },
                    { element: 'H', x: 0, y: 0.51, z: 1.03 },
                    { element: 'H', x: -1.67, y: 0.73, z: 1.03 },
                    { element: 'H', x: -2.14, y: 0.22, z: -0.51 },
                    { element: 'H', x: -1.27, y: 1.78, z: -0.51 },
                    { element: 'H', x: 1.67, y: 0.73, z: 1.03 },
                    { element: 'H', x: 2.14, y: 0.22, z: -0.51 },
                    { element: 'H', x: 1.27, y: 1.78, z: -0.51 },
                    { element: 'H', x: 0.87, y: -1.93, z: -0.51 },
                    { element: 'H', x: -0.87, y: -1.93, z: -0.51 },
                    { element: 'H', x: 0, y: -3.26, z: 0 }
                ],
                bonds: [[0,1], [0,2], [0,3], [3,4], [0,5], [1,6], [1,7], [1,8], [2,9], [2,10], [2,11], [3,12], [3,13], [4,14]]
            },
            {
                name: '2-Metilpropan-2-ol (tert-butanol)',
                type: 'Izomerie de catenă',
                description: 'Alcool terțiar cu carbon central',
                atoms: [
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 0, y: -0.73, z: 1.27 },
                    { element: 'O', x: 0, y: -0.73, z: -1.27 },
                    { element: 'H', x: -1.67, y: 0.73, z: 1.03 },
                    { element: 'H', x: -2.14, y: 0.22, z: -0.51 },
                    { element: 'H', x: -1.27, y: 1.78, z: -0.51 },
                    { element: 'H', x: 1.67, y: 0.73, z: 1.03 },
                    { element: 'H', x: 2.14, y: 0.22, z: -0.51 },
                    { element: 'H', x: 1.27, y: 1.78, z: -0.51 },
                    { element: 'H', x: 0.87, y: -0.22, z: 1.67 },
                    { element: 'H', x: -0.87, y: -0.22, z: 1.67 },
                    { element: 'H', x: 0, y: -1.78, z: 1.67 },
                    { element: 'H', x: 0, y: -1.33, z: -1.87 }
                ],
                bonds: [[0,1], [0,2], [0,3], [0,4], [1,5], [1,6], [1,7], [2,8], [2,9], [2,10], [3,11], [3,12], [3,13], [4,14]]
            }
        ]
    },
    pentanol: {
        formula: 'C₅H₁₂O',
        isomers: [
            {
                name: 'Pentan-1-ol',
                type: 'Izomerie de poziție',
                description: 'Alcool primar cu -OH pe C1',
                data: 'pentanol'
            },
            {
                name: 'Pentan-2-ol',
                type: 'Izomerie de poziție',
                description: 'Alcool secundar cu -OH pe C2',
                atoms: [
                    { element: 'C', x: -2.54, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: 0, z: 0 },
                    { element: 'C', x: 0, y: 0.73, z: 0 },
                    { element: 'C', x: 1.27, y: 0, z: 0 },
                    { element: 'C', x: 2.54, y: 0, z: 0 },
                    { element: 'O', x: -1.27, y: -1.4, z: 0 },
                    { element: 'H', x: -2.94, y: 0.89, z: 0.51 },
                    { element: 'H', x: -2.94, y: -0.89, z: 0.51 },
                    { element: 'H', x: -2.94, y: 0, z: -1.03 },
                    { element: 'H', x: -1.27, y: 0.51, z: 1.03 },
                    { element: 'H', x: 0, y: 0.73, z: 1.03 },
                    { element: 'H', x: 0, y: 1.78, z: -0.51 },
                    { element: 'H', x: 1.27, y: 0.89, z: -0.51 },
                    { element: 'H', x: 1.27, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: 0, z: -1.03 },
                    { element: 'H', x: -1.27, y: -2.0, z: 0 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [1,5], [0,6], [0,7], [0,8], [1,9], [2,10], [2,11], [3,12], [3,13], [4,14], [4,15], [4,16], [5,17]]
            },
            {
                name: 'Pentan-3-ol',
                type: 'Izomerie de poziție',
                description: 'Alcool secundar cu -OH pe C3 (carbon central)',
                atoms: [
                    { element: 'C', x: -2.54, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 2.54, y: 0, z: 0 },
                    { element: 'O', x: 0, y: -1.4, z: 0 },
                    { element: 'H', x: -2.94, y: 0.89, z: 0.51 },
                    { element: 'H', x: -2.94, y: -0.89, z: 0.51 },
                    { element: 'H', x: -2.94, y: 0, z: -1.03 },
                    { element: 'H', x: -1.27, y: 0.73, z: 1.03 },
                    { element: 'H', x: -1.27, y: 1.78, z: -0.51 },
                    { element: 'H', x: 0, y: 0.51, z: 1.03 },
                    { element: 'H', x: 1.27, y: 0.73, z: 1.03 },
                    { element: 'H', x: 1.27, y: 1.78, z: -0.51 },
                    { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: 0, z: -1.03 },
                    { element: 'H', x: 0, y: -2.0, z: 0 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [2,5], [0,6], [0,7], [0,8], [1,9], [1,10], [2,11], [3,12], [3,13], [4,14], [4,15], [4,16], [5,17]]
            },
            {
                name: '2-Metilbutan-1-ol',
                type: 'Izomerie de catenă',
                description: 'Alcool primar cu ramificație pe C2',
                atoms: [
                    { element: 'C', x: -1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 2.54, y: 0, z: 0 },
                    { element: 'C', x: 0, y: -1.52, z: 0 },
                    { element: 'O', x: 0, y: -2.66, z: 0 },
                    { element: 'H', x: -1.67, y: 0.73, z: 1.03 },
                    { element: 'H', x: -2.14, y: 0.22, z: -0.51 },
                    { element: 'H', x: -1.27, y: 1.78, z: -0.51 },
                    { element: 'H', x: 0, y: 0.51, z: 1.03 },
                    { element: 'H', x: 1.27, y: 0.73, z: 1.03 },
                    { element: 'H', x: 1.27, y: 1.78, z: -0.51 },
                    { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: 0, z: -1.03 },
                    { element: 'H', x: 0.87, y: -1.93, z: -0.51 },
                    { element: 'H', x: -0.87, y: -1.93, z: -0.51 },
                    { element: 'H', x: 0, y: -3.26, z: 0 }
                ],
                bonds: [[0,1], [1,2], [2,3], [1,4], [4,5], [0,6], [0,7], [0,8], [1,9], [2,10], [2,11], [3,12], [3,13], [3,14], [4,15], [4,16], [5,17]]
            },
            {
                name: '3-Metilbutan-1-ol',
                type: 'Izomerie de catenă',
                description: 'Alcool primar cu ramificație pe C3',
                atoms: [
                    { element: 'C', x: -1.91, y: 0, z: 0 },
                    { element: 'C', x: -0.64, y: 0, z: 0 },
                    { element: 'C', x: 0.64, y: 0.73, z: 0 },
                    { element: 'C', x: 0.64, y: 2.19, z: 0 },
                    { element: 'C', x: 1.91, y: 0, z: 0 },
                    { element: 'O', x: 3.05, y: 0, z: 0 },
                    { element: 'H', x: -2.31, y: 0.89, z: 0.51 },
                    { element: 'H', x: -2.31, y: -0.89, z: 0.51 },
                    { element: 'H', x: -2.31, y: 0, z: -1.03 },
                    { element: 'H', x: -0.64, y: 0.89, z: -0.51 },
                    { element: 'H', x: -0.64, y: -0.89, z: 0.51 },
                    { element: 'H', x: 0.64, y: 0.73, z: 1.03 },
                    { element: 'H', x: 1.04, y: 2.70, z: 0.89 },
                    { element: 'H', x: -0.23, y: 2.70, z: 0.51 },
                    { element: 'H', x: 1.04, y: 2.70, z: -0.89 },
                    { element: 'H', x: 1.91, y: 0.89, z: -0.51 },
                    { element: 'H', x: 1.91, y: -0.89, z: 0.51 },
                    { element: 'H', x: 3.65, y: 0, z: 0 }
                ],
                bonds: [[0,1], [1,2], [2,3], [2,4], [4,5], [0,6], [0,7], [0,8], [1,9], [1,10], [2,11], [3,12], [3,13], [3,14], [4,15], [4,16], [5,17]]
            },
            {
                name: '2-Metilbutan-2-ol',
                type: 'Izomerie de catenă',
                description: 'Alcool terțiar cu ramificație',
                atoms: [
                    { element: 'C', x: -1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 0, y: 0, z: 0 },
                    { element: 'C', x: 1.27, y: 0.73, z: 0 },
                    { element: 'C', x: 2.54, y: 0, z: 0 },
                    { element: 'C', x: 0, y: -0.73, z: 1.27 },
                    { element: 'O', x: 0, y: -0.73, z: -1.27 },
                    { element: 'H', x: -1.67, y: 0.73, z: 1.03 },
                    { element: 'H', x: -2.14, y: 0.22, z: -0.51 },
                    { element: 'H', x: -1.27, y: 1.78, z: -0.51 },
                    { element: 'H', x: 1.27, y: 0.73, z: 1.03 },
                    { element: 'H', x: 1.27, y: 1.78, z: -0.51 },
                    { element: 'H', x: 2.94, y: 0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.94, y: 0, z: -1.03 },
                    { element: 'H', x: 0.87, y: -0.22, z: 1.67 },
                    { element: 'H', x: -0.87, y: -0.22, z: 1.67 },
                    { element: 'H', x: 0, y: -1.78, z: 1.67 },
                    { element: 'H', x: 0, y: -1.33, z: -1.87 }
                ],
                bonds: [[0,1], [1,2], [2,3], [1,4], [1,5], [0,6], [0,7], [0,8], [2,9], [2,10], [3,11], [3,12], [3,13], [4,14], [4,15], [4,16], [5,17]]
            },
            {
                name: '3-Metilbutan-2-ol',
                type: 'Izomerie de catenă',
                description: 'Alcool secundar ramificat chiral',
                data: '3-metilbutan-2-ol'
            },
            {
                name: '2,2-Dimetilpropan-1-ol',
                type: 'Izomerie de catenă',
                description: 'Alcool primar foarte ramificat (neopentil alcool)',
                data: '2,2-dimetilpropan-1-ol'
            }
        ]
    },
    hexanol: {
        formula: 'C₆H₁₄O',
        isomers: [
            {
                name: 'Hexan-1-ol',
                type: 'Izomerie de poziție',
                description: 'Alcool primar cu -OH pe C1',
                data: 'hexanol'
            },
            {
                name: 'Hexan-2-ol',
                type: 'Izomerie de poziție',
                description: 'Alcool secundar cu -OH pe C2',
                atoms: [
                    { element: 'C', x: -3.18, y: 0, z: 0 },
                    { element: 'C', x: -1.91, y: 0, z: 0 },
                    { element: 'C', x: -0.64, y: 0.73, z: 0 },
                    { element: 'C', x: 0.64, y: 0, z: 0 },
                    { element: 'C', x: 1.91, y: 0, z: 0 },
                    { element: 'C', x: 3.18, y: 0, z: 0 },
                    { element: 'O', x: -1.91, y: -1.4, z: 0 },
                    { element: 'H', x: -3.58, y: 0.89, z: 0.51 },
                    { element: 'H', x: -3.58, y: -0.89, z: 0.51 },
                    { element: 'H', x: -3.58, y: 0, z: -1.03 },
                    { element: 'H', x: -1.91, y: 0.51, z: 1.03 },
                    { element: 'H', x: -0.64, y: 0.73, z: 1.03 },
                    { element: 'H', x: -0.64, y: 1.78, z: -0.51 },
                    { element: 'H', x: 0.64, y: 0.89, z: -0.51 },
                    { element: 'H', x: 0.64, y: -0.89, z: 0.51 },
                    { element: 'H', x: 1.91, y: 0.89, z: 0.51 },
                    { element: 'H', x: 1.91, y: -0.89, z: -0.51 },
                    { element: 'H', x: 3.58, y: 0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: -0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: 0, z: -1.03 },
                    { element: 'H', x: -1.91, y: -2.0, z: 0 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [1,6], [0,7], [0,8], [0,9], [1,10], [2,11], [2,12], [3,13], [3,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20]]
            },
            {
                name: 'Hexan-3-ol',
                type: 'Izomerie de poziție',
                description: 'Alcool secundar cu -OH pe C3',
                atoms: [
                    { element: 'C', x: -3.18, y: 0, z: 0 },
                    { element: 'C', x: -1.91, y: 0.73, z: 0 },
                    { element: 'C', x: -0.64, y: 0, z: 0 },
                    { element: 'C', x: 0.64, y: 0.73, z: 0 },
                    { element: 'C', x: 1.91, y: 0, z: 0 },
                    { element: 'C', x: 3.18, y: 0, z: 0 },
                    { element: 'O', x: -0.64, y: -1.4, z: 0 },
                    { element: 'H', x: -3.58, y: 0.89, z: 0.51 },
                    { element: 'H', x: -3.58, y: -0.89, z: 0.51 },
                    { element: 'H', x: -3.58, y: 0, z: -1.03 },
                    { element: 'H', x: -1.91, y: 0.73, z: 1.03 },
                    { element: 'H', x: -1.91, y: 1.78, z: -0.51 },
                    { element: 'H', x: -0.64, y: 0.51, z: 1.03 },
                    { element: 'H', x: 0.64, y: 0.73, z: 1.03 },
                    { element: 'H', x: 0.64, y: 1.78, z: -0.51 },
                    { element: 'H', x: 1.91, y: 0.89, z: -0.51 },
                    { element: 'H', x: 1.91, y: -0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: 0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: -0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: 0, z: -1.03 },
                    { element: 'H', x: -0.64, y: -2.0, z: 0 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [4,5], [2,6], [0,7], [0,8], [0,9], [1,10], [1,11], [2,12], [3,13], [3,14], [4,15], [4,16], [5,17], [5,18], [5,19], [6,20]]
            },
            {
                name: '2-Metilpentan-1-ol',
                type: 'Izomerie de catenă',
                description: 'Alcool primar cu ramificație pe C2',
                atoms: [
                    { element: 'C', x: -1.91, y: 0.73, z: 0 },
                    { element: 'C', x: -0.64, y: 0, z: 0 },
                    { element: 'C', x: 0.64, y: 0.73, z: 0 },
                    { element: 'C', x: 1.91, y: 0, z: 0 },
                    { element: 'C', x: 3.18, y: 0, z: 0 },
                    { element: 'C', x: -0.64, y: -1.52, z: 0 },
                    { element: 'O', x: -0.64, y: -2.66, z: 0 },
                    { element: 'H', x: -2.31, y: 0.73, z: 1.03 },
                    { element: 'H', x: -2.78, y: 0.22, z: -0.51 },
                    { element: 'H', x: -1.91, y: 1.78, z: -0.51 },
                    { element: 'H', x: -0.64, y: 0.51, z: 1.03 },
                    { element: 'H', x: 0.64, y: 0.73, z: 1.03 },
                    { element: 'H', x: 0.64, y: 1.78, z: -0.51 },
                    { element: 'H', x: 1.91, y: 0.89, z: -0.51 },
                    { element: 'H', x: 1.91, y: -0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: 0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: -0.89, z: 0.51 },
                    { element: 'H', x: 3.58, y: 0, z: -1.03 },
                    { element: 'H', x: 0.23, y: -1.93, z: -0.51 },
                    { element: 'H', x: -1.51, y: -1.93, z: -0.51 },
                    { element: 'H', x: -0.64, y: -3.26, z: 0 }
                ],
                bonds: [[0,1], [1,2], [2,3], [3,4], [1,5], [5,6], [0,7], [0,8], [0,9], [1,10], [2,11], [2,12], [3,13], [3,14], [4,15], [4,16], [4,17], [5,18], [5,19], [6,20]]
            },
            {
                name: '3-Metilpentan-1-ol',
                type: 'Izomerie de catenă',
                description: 'Alcool primar cu ramificație pe C3',
                atoms: [
                    { element: 'C', x: -2.54, y: 0, z: 0 },
                    { element: 'C', x: -1.27, y: 0, z: 0 },
                    { element: 'C', x: 0, y: 0.73, z: 0 },
                    { element: 'C', x: 0, y: 2.19, z: 0 },
                    { element: 'C', x: 1.27, y: 0, z: 0 },
                    { element: 'C', x: 2.54, y: 0, z: 0 },
                    { element: 'O', x: 3.68, y: 0, z: 0 },
                    { element: 'H', x: -2.94, y: 0.89, z: 0.51 },
                    { element: 'H', x: -2.94, y: -0.89, z: 0.51 },
                    { element: 'H', x: -2.94, y: 0, z: -1.03 },
                    { element: 'H', x: -1.27, y: 0.89, z: -0.51 },
                    { element: 'H', x: -1.27, y: -0.89, z: 0.51 },
                    { element: 'H', x: 0, y: 0.73, z: 1.03 },
                    { element: 'H', x: 0.4, y: 2.70, z: 0.89 },
                    { element: 'H', x: -0.87, y: 2.70, z: 0.51 },
                    { element: 'H', x: 0.4, y: 2.70, z: -0.89 },
                    { element: 'H', x: 1.27, y: 0.89, z: -0.51 },
                    { element: 'H', x: 1.27, y: -0.89, z: 0.51 },
                    { element: 'H', x: 2.54, y: 0.89, z: -0.51 },
                    { element: 'H', x: 2.54, y: -0.89, z: 0.51 },
                    { element: 'H', x: 4.28, y: 0, z: 0 }
                ],
                bonds: [[0,1], [1,2], [2,3], [2,4], [4,5], [5,6], [0,7], [0,8], [0,9], [1,10], [1,11], [2,12], [3,13], [3,14], [3,15], [4,16], [4,17], [5,18], [5,19], [6,20]]
            },
            {
                name: '2,3-Dimetilbutan-1-ol',
                type: 'Izomerie de catenă',
                description: 'Alcool primar cu două ramificații metil',
                atoms: [
                    { element: 'C', x: 0, y: 2.19, z: 0 },
                    { element: 'C', x: 0, y: 0.73, z: 0 },
                    { element: 'C', x: 1.27, y: 0, z: 0 },
                    { element: 'C', x: 1.27, y: -1.46, z: 0 },
                    { element: 'C', x: 2.54, y: 0.73, z: 0 },
                    { element: 'C', x: -1.27, y: 0, z: 0 },
                    { element: 'O', x: -2.41, y: 0, z: 0 },
                    { element: 'H', x: 0.4, y: 2.70, z: 0.89 },
                    { element: 'H', x: -0.87, y: 2.70, z: 0.51 },
                    { element: 'H', x: 0.4, y: 2.70, z: -0.89 },
                    { element: 'H', x: 0, y: 0.73, z: 1.03 },
                    { element: 'H', x: 1.27, y: 0.51, z: 1.03 },
                    { element: 'H', x: 1.67, y: -1.97, z: 0.89 },
                    { element: 'H', x: 0.4, y: -1.97, z: 0.51 },
                    { element: 'H', x: 1.67, y: -1.97, z: -0.89 },
                    { element: 'H', x: 2.94, y: 0.22, z: 0.51 },
                    { element: 'H', x: 2.94, y: 0.73, z: -1.03 },
                    { element: 'H', x: 2.54, y: 1.78, z: 0.51 },
                    { element: 'H', x: -1.27, y: 0.89, z: -0.51 },
                    { element: 'H', x: -1.27, y: -0.89, z: 0.51 },
                    { element: 'H', x: -3.01, y: 0, z: 0 }
                ],
                bonds: [[0,1], [1,2], [2,3], [2,4], [1,5], [5,6], [0,7], [0,8], [0,9], [1,10], [2,11], [3,12], [3,13], [3,14], [4,15], [4,16], [4,17], [5,18], [5,19], [6,20]]
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
            alcohol: null,  // Position of -OH group
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
        
        // Check for alcohol (-ol)
        let alcoholMatch = null;
        if (name.includes('-ol')) {
            // Pattern: butan-1-ol, propan-2-ol, 2-metilpropan-1-ol
            alcoholMatch = name.match(/-(\d+)-ol$/);
            if (alcoholMatch) {
                result.alcohol = parseInt(alcoholMatch[1]);
            } else {
                // Simple pattern: propanol (assume -1-ol)
                result.alcohol = 1;
            }
        }
        
        // Parse substituents (e.g., "2,3-dimetil", "2-etil")
        const substituentRegex = /(\d+(?:,\d+)*)-([a-z]+)/g;
        let match;
        let nameWithoutSubstituents = name;
        
        while ((match = substituentRegex.exec(name)) !== null) {
            const positions = match[1].split(',').map(Number);
            const substituentName = match[2];
            
            // Skip if this is the main chain (ends with -an, -ena, -ina, -diena, -ol)
            if (substituentName.endsWith('an') || 
                substituentName.endsWith('ena') || 
                substituentName.endsWith('ina') ||
                substituentName.endsWith('diena') ||
                substituentName.endsWith('ol')) {
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
        // Examples: "hexan", "but-1-ena", "but-1,3-diena", "but-1-ina", "butan-1-ol"
        
        // Remove -ol suffix for chain parsing
        if (nameWithoutSubstituents.includes('-ol')) {
            nameWithoutSubstituents = nameWithoutSubstituents.replace(/-\d+-ol$/, 'an').replace(/-ol$/, 'an');
        }
        
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
            throw new Error('Nu s-a putut determina lungimea lanțului. Exemple valide: "hexan", "but-1-ena", "2,3-dimetil-hexan", "propan-2-ol"');
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
        const alcoholPosition = parsed.alcohol;
        
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
        
        // Add alcohol group (-OH) if present
        if (alcoholPosition !== null && alcoholPosition > 0 && alcoholPosition <= chainLength) {
            const carbonIndex = alcoholPosition - 1;
            const availablePositions = this.getAvailableTetrahedralPositions(
                atoms[carbonIndex], 
                occupiedPositions[carbonIndex],
                carbonIndex,
                chainLength
            );
            
            if (availablePositions.length > 0) {
                const position = availablePositions[0];
                
                // Add oxygen atom
                const oxygenAtom = {
                    element: 'O',
                    x: atoms[carbonIndex].x + position.x * spacing * 0.75,
                    y: atoms[carbonIndex].y + position.y * spacing * 0.75,
                    z: atoms[carbonIndex].z + position.z * spacing * 0.75
                };
                const oxygenIndex = atoms.length;
                atoms.push(oxygenAtom);
                bonds.push([carbonIndex, oxygenIndex]);
                
                // Add hydrogen to oxygen
                const hydrogenAtom = {
                    element: 'H',
                    x: oxygenAtom.x + position.x * 0.96,
                    y: oxygenAtom.y + position.y * 0.96,
                    z: oxygenAtom.z + position.z * 0.96
                };
                atoms.push(hydrogenAtom);
                bonds.push([oxygenIndex, atoms.length - 1]);
                
                occupiedPositions[carbonIndex].push(position.name);
            }
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

// Alkane Isomer Generator - generates all possible structural isomers
class AlkaneIsomerGenerator {
    constructor() {
        this.MAX_ISOMERS = 25;
        this.generatedStructures = new Set();
    }
    
    // Generate all isomers for a given carbon count
    generateAllIsomers(carbonCount) {
        this.generatedStructures.clear();
        const isomers = [];
        
        // Generate all possible carbon skeletons
        const skeletons = this.generateCarbonSkeletons(carbonCount);
        
        // Convert each skeleton to 3D structure
        for (const skeleton of skeletons) {
            if (isomers.length >= this.MAX_ISOMERS) break;
            
            const canonical = this.getCanonicalForm(skeleton);
            if (!this.generatedStructures.has(canonical)) {
                this.generatedStructures.add(canonical);
                const structure = this.skeletonTo3D(skeleton, carbonCount);
                if (structure) {
                    isomers.push(structure);
                }
            }
        }
        
        return isomers;
    }
    
    // Generate all possible carbon skeletons recursively
    generateCarbonSkeletons(n, current = [0], used = new Set([0]), startFrom = 0) {
        if (current.length === n) {
            return [current.slice()];
        }
        
        const results = [];
        
        // Try attaching to each existing carbon
        for (let i = startFrom; i < current.length; i++) {
            const carbonIndex = current[i];
            const connections = current.filter(c => c === carbonIndex).length;
            
            // Carbon can have max 4 bonds (including to other carbons)
            if (connections < 4) {
                const newCarbon = current.length;
                const newSkeleton = [...current, carbonIndex];
                const subResults = this.generateCarbonSkeletons(n, newSkeleton, used, i);
                results.push(...subResults);
            }
        }
        
        return results;
    }
    
    // Convert skeleton array to canonical string for duplicate detection
    getCanonicalForm(skeleton) {
        const adjacencyList = {};
        
        skeleton.forEach((parent, child) => {
            if (child === 0) return;
            if (!adjacencyList[parent]) adjacencyList[parent] = [];
            if (!adjacencyList[child]) adjacencyList[child] = [];
            adjacencyList[parent].push(child);
            adjacencyList[child].push(parent);
        });
        
        // Create a canonical string representation
        const visited = new Set();
        const dfs = (node) => {
            visited.add(node);
            const neighbors = (adjacencyList[node] || []).filter(n => !visited.has(n));
            if (neighbors.length === 0) return '()';
            
            const childStrings = neighbors.map(n => dfs(n)).sort();
            return '(' + childStrings.join('') + ')';
        };
        
        return dfs(0);
    }
    
    // Convert skeleton to 3D coordinates
    skeletonTo3D(skeleton, carbonCount) {
        const atoms = [];
        const bonds = [];
        const positions = {};
        const adjacencyList = {};
        
        // Build adjacency list
        skeleton.forEach((parent, child) => {
            if (!adjacencyList[parent]) adjacencyList[parent] = [];
            if (!adjacencyList[child]) adjacencyList[child] = [];
            if (child > 0) {
                adjacencyList[parent].push(child);
                adjacencyList[child].push(parent);
            }
        });
        
        // Position carbons using BFS for better spatial distribution
        const queue = [0];
        const visited = new Set([0]);
        positions[0] = { x: 0, y: 0, z: 0 };
        
        const bondLength = 1.27;
        const angleOffset = Math.PI * 2 / 3; // 120 degrees
        
        while (queue.length > 0) {
            const current = queue.shift();
            const currentPos = positions[current];
            const neighbors = adjacencyList[current] || [];
            const unvisitedNeighbors = neighbors.filter(n => !visited.has(n));
            
            unvisitedNeighbors.forEach((neighbor, index) => {
                visited.add(neighbor);
                queue.push(neighbor);
                
                // Position in a tetrahedral-like arrangement
                const angle = angleOffset * index + Math.random() * 0.3;
                const verticalOffset = (index % 2 === 0 ? 0.5 : -0.5) * bondLength;
                
                positions[neighbor] = {
                    x: currentPos.x + Math.cos(angle) * bondLength,
                    y: currentPos.y + verticalOffset,
                    z: currentPos.z + Math.sin(angle) * bondLength
                };
            });
        }
        
        // Add carbon atoms
        for (let i = 0; i < carbonCount; i++) {
            const pos = positions[i] || { x: i * 1.27, y: 0, z: 0 };
            atoms.push({
                element: 'C',
                x: pos.x,
                y: pos.y,
                z: pos.z
            });
        }
        
        // Add bonds between carbons
        skeleton.forEach((parent, child) => {
            if (child > 0) {
                bonds.push([parent, child]);
            }
        });
        
        // Add hydrogens
        for (let i = 0; i < carbonCount; i++) {
            const connections = (adjacencyList[i] || []).length;
            const hydrogenCount = 4 - connections;
            this.addHydrogens(atoms, bonds, i, hydrogenCount);
        }
        
        // Generate IUPAC name
        const name = this.generateName(skeleton, carbonCount);
        
        return {
            name: name,
            type: 'Izomerie de catenă',
            description: this.generateDescription(skeleton, carbonCount),
            atoms: atoms,
            bonds: bonds
        };
    }
    
    // Add hydrogen atoms
    addHydrogens(atoms, bonds, carbonIndex, count) {
        const carbon = atoms[carbonIndex];
        const bondLength = 1.09;
        
        const tetrahedralAngles = [
            { x: 1, y: 1, z: 1 },
            { x: -1, y: -1, z: 1 },
            { x: -1, y: 1, z: -1 },
            { x: 1, y: -1, z: -1 }
        ];
        
        for (let i = 0; i < count && i < tetrahedralAngles.length; i++) {
            const angle = tetrahedralAngles[i];
            const len = Math.sqrt(angle.x**2 + angle.y**2 + angle.z**2);
            
            atoms.push({
                element: 'H',
                x: carbon.x + (angle.x / len) * bondLength,
                y: carbon.y + (angle.y / len) * bondLength,
                z: carbon.z + (angle.z / len) * bondLength
            });
            bonds.push([carbonIndex, atoms.length - 1]);
        }
    }
    
    // Generate IUPAC name from skeleton
    generateName(skeleton, carbonCount) {
        const prefixes = ['', 'metan', 'etan', 'propan', 'butan', 'pentan', 'hexan', 'heptan', 'octan', 'nonan', 'decan'];
        
        // Find longest chain
        const longestChain = this.findLongestChain(skeleton, carbonCount);
        const mainChainLength = longestChain.length;
        
        // If it's a straight chain
        if (mainChainLength === carbonCount) {
            return 'n-' + prefixes[carbonCount].charAt(0).toUpperCase() + prefixes[carbonCount].slice(1);
        }
        
        // Find substituents
        const substituents = this.findSubstituents(skeleton, longestChain, carbonCount);
        
        if (substituents.length === 0) {
            return prefixes[mainChainLength].charAt(0).toUpperCase() + prefixes[mainChainLength].slice(1);
        }
        
        // Build name with substituents
        const substituentCounts = {};
        substituents.forEach(s => {
            const key = s.position + '-' + s.name;
            substituentCounts[key] = (substituentCounts[key] || 0) + 1;
        });
        
        const multipliers = ['', '', 'di', 'tri', 'tetra', 'penta'];
        let nameParts = [];
        
        Object.entries(substituentCounts).forEach(([key, count]) => {
            const [pos, name] = key.split('-');
            const prefix = count > 1 ? multipliers[count] : '';
            nameParts.push(pos + '-' + prefix + name);
        });
        
        return nameParts.join(',') + '-' + prefixes[mainChainLength];
    }
    
    // Find longest carbon chain
    findLongestChain(skeleton, carbonCount) {
        const adjacencyList = {};
        skeleton.forEach((parent, child) => {
            if (child > 0) {
                if (!adjacencyList[parent]) adjacencyList[parent] = [];
                if (!adjacencyList[child]) adjacencyList[child] = [];
                adjacencyList[parent].push(child);
                adjacencyList[child].push(parent);
            }
        });
        
        let longest = [0];
        
        const dfs = (node, path, visited) => {
            if (path.length > longest.length) {
                longest = [...path];
            }
            
            const neighbors = adjacencyList[node] || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    dfs(neighbor, [...path, neighbor], visited);
                    visited.delete(neighbor);
                }
            }
        };
        
        dfs(0, [0], new Set([0]));
        return longest;
    }
    
    // Find substituents on main chain
    findSubstituents(skeleton, mainChain, carbonCount) {
        const substituents = [];
        const mainChainSet = new Set(mainChain);
        
        skeleton.forEach((parent, child) => {
            if (child > 0 && mainChainSet.has(parent) && !mainChainSet.has(child)) {
                const position = mainChain.indexOf(parent) + 1;
                substituents.push({ position, name: 'metil' });
            }
        });
        
        return substituents;
    }
    
    // Generate description
    generateDescription(skeleton, carbonCount) {
        const longestChain = this.findLongestChain(skeleton, carbonCount);
        const substituents = this.findSubstituents(skeleton, longestChain, carbonCount);
        
        let desc = `Lanț principal: ${longestChain.length} atomi de carbon`;
        if (substituents.length > 0) {
            desc += `\nRamificații: ${substituents.length} grup(uri) metil`;
        }
        return desc;
    }
}

const alkaneIsomerGenerator = new AlkaneIsomerGenerator();

// Store parent compound information
let parentCompound = null;

// Function to generate alcohol isomers (isomers with same number of oxygen atoms)
function generateAlcoholIsomers(parsed, isomers, currentName) {
    const chainLen = parsed.chainLength;
    
    // Generate positional isomers - move -OH to different positions
    for (let pos = 1; pos <= chainLen; pos++) {
        if (pos !== parsed.alcohol) {
            try {
                const newParsed = {
                    ...parsed,
                    alcohol: pos,
                    substituents: [...parsed.substituents]
                };
                const newMolecule = iupacParser.buildMolecule(newParsed);
                const newName = generateFullIUPACName(newParsed);
                
                // Skip if this is the same as current structure
                if (newName !== currentName) {
                    isomers.push({
                        name: newName,
                        type: 'Izomerie de poziție (alcool)',
                        description: buildDetailedDescription(newParsed) + '\nGrupa -OH la poziția ' + pos,
                        atoms: newMolecule.atoms,
                        bonds: newMolecule.bonds
                    });
                }
            } catch (e) {
                console.log('Skipped invalid alcohol isomer:', e.message);
            }
        }
    }
    
    // Generate chain isomers - move substituents while keeping -OH
    if (parsed.substituents.length > 0 && chainLen >= 4) {
        // Try different substituent positions
        for (let newPos = 2; newPos <= Math.floor(chainLen / 2) + 1; newPos++) {
            try {
                // Create a variant with substituent at different position
                const modifiedSubstituents = parsed.substituents.map(sub => ({
                    ...sub,
                    position: newPos
                }));
                
                const newParsed = {
                    ...parsed,
                    substituents: modifiedSubstituents,
                    alcohol: parsed.alcohol
                };
                
                const newMolecule = iupacParser.buildMolecule(newParsed);
                const newName = generateFullIUPACName(newParsed);
                
                if (newName !== currentName && !isomers.some(iso => iso.name === newName)) {
                    isomers.push({
                        name: newName,
                        type: 'Izomerie de catenă (alcool)',
                        description: buildDetailedDescription(newParsed),
                        atoms: newMolecule.atoms,
                        bonds: newMolecule.bonds
                    });
                }
            } catch (e) {
                // Skip invalid structures
            }
        }
    }
    
    // Generate ether isomers (functional group isomers) - for alcohols with 2+ carbons
    // Ethers have the same formula CnH(2n+2)O but different structure (R-O-R instead of R-OH)
    if (chainLen >= 2) {
        try {
            // For example, C2H6O: ethanol <-> dimethyl ether
            // C3H8O: propanol <-> ethyl methyl eter
            // C4H10O: butanol <-> diethyl eter, methyl propyl eter
            // C5H12O: pentanol <-> methyl butyl eter, ethyl propyl eter
            
            const etherIsomers = generateEtherIsomersForAlcohol(chainLen);
            etherIsomers.forEach(ether => {
                if (!isomers.some(iso => iso.name === ether.name)) {
                    isomers.push(ether);
                }
            });
        } catch (e) {
            console.log('Error generating ether isomers:', e.message);
        }
    }
}

// Generate ether isomers for a given carbon count (functional group isomers of alcohols)
function generateEtherIsomersForAlcohol(carbonCount) {
    const ethers = [];
    
    // Generate all possible combinations of R-O-R where R1 + R2 = carbonCount
    for (let r1 = 1; r1 < carbonCount; r1++) {
        const r2 = carbonCount - r1;
        
        // Only generate if r1 <= r2 to avoid duplicates (methyl ethyl = ethyl methyl)
        if (r1 <= r2) {
            try {
                const etherName = generateEtherName(r1, r2);
                const etherStructure = buildEtherStructure(r1, r2);
                
                if (etherStructure) {
                    ethers.push({
                        name: etherName,
                        type: 'Izomerie de funcțiune (eter)',
                        description: `Eter cu ${r1} și ${r2} atomi de carbon legați la oxigen`,
                        atoms: etherStructure.atoms,
                        bonds: etherStructure.bonds
                    });
                }
            } catch (e) {
                // Skip invalid ether structures
            }
        }
    }
    
    return ethers;
}

// Generate IUPAC name for ether
function generateEtherName(r1, r2) {
    const alkylNames = ['', 'metil', 'etil', 'propil', 'butil', 'pentil', 'hexil'];
    
    if (r1 === r2) {
        return `di${alkylNames[r1]} eter`;
    } else {
        return `${alkylNames[r1]} ${alkylNames[r2]} eter`;
    }
}

// Build 3D structure for an ether R1-O-R2
function buildEtherStructure(r1, r2) {
    const atoms = [];
    const bonds = [];
    const spacing = 1.27;
    
    // Build R1 chain (left side)
    for (let i = 0; i < r1; i++) {
        atoms.push({
            element: 'C',
            x: -spacing * (r1 - i),
            y: 0,
            z: 0
        });
    }
    
    // Add oxygen atom
    const oxygenIndex = atoms.length;
    atoms.push({
        element: 'O',
        x: 0,
        y: 0,
        z: 0
    });
    
    // Build R2 chain (right side)
    for (let i = 0; i < r2; i++) {
        atoms.push({
            element: 'C',
            x: spacing * (i + 1),
            y: 0,
            z: 0
        });
    }
    
    // Add bonds for R1 chain to oxygen
    for (let i = 0; i < r1 - 1; i++) {
        bonds.push([i, i + 1]);
    }
    if (r1 > 0) {
        bonds.push([r1 - 1, oxygenIndex]);
    }
    
    // Add bonds for R2 chain from oxygen
    if (r2 > 0) {
        bonds.push([oxygenIndex, oxygenIndex + 1]);
        for (let i = oxygenIndex + 1; i < oxygenIndex + r2; i++) {
            bonds.push([i, i + 1]);
        }
    }
    
    // Add hydrogens to all carbons
    const carbonIndices = [];
    for (let i = 0; i < atoms.length; i++) {
        if (atoms[i].element === 'C') {
            carbonIndices.push(i);
        }
    }
    
    carbonIndices.forEach((carbonIdx, arrayIdx) => {
        // Count carbon bonds
        let carbonBonds = 0;
        bonds.forEach(bond => {
            if (bond[0] === carbonIdx || bond[1] === carbonIdx) {
                carbonBonds++;
            }
        });
        
        const hydrogensNeeded = 4 - carbonBonds;
        
        // Add hydrogens with tetrahedral geometry
        for (let h = 0; h < hydrogensNeeded; h++) {
            const angle = (Math.PI * 2 / hydrogensNeeded) * h + Math.PI / 2;
            const hPos = {
                element: 'H',
                x: atoms[carbonIdx].x + Math.cos(angle) * 1.09,
                y: atoms[carbonIdx].y + Math.sin(angle) * 1.09,
                z: atoms[carbonIdx].z + (h % 2 === 0 ? 0.5 : -0.5)
            };
            atoms.push(hPos);
            bonds.push([carbonIdx, atoms.length - 1]);
        }
    });
    
    return { atoms, bonds };
}

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
    
    // Check if molecule has functional groups (alcohol, etc.)
    const hasOxygen = currentMoleculeData.atoms.some(atom => atom.element === 'O');
    const hasNitrogen = currentMoleculeData.atoms.some(atom => atom.element === 'N');
    const hasFunctionalGroup = hasOxygen || hasNitrogen || parsed.alcohol !== null;
    
    // For alkanes (no double/triple bonds and NO functional groups), generate ALL structural isomers automatically
    if (parsed.doubleBonds.length === 0 && parsed.tripleBonds.length === 0 && !hasFunctionalGroup && parsed.chainLength >= 4 && parsed.chainLength <= 10) {
        console.log(`Generare automată izomeri pentru C${parsed.chainLength}...`);
        const generatedIsomers = alkaneIsomerGenerator.generateAllIsomers(parsed.chainLength);
        
        // Add generated isomers (limit to 25 total including current)
        generatedIsomers.forEach(isom => {
            if (isomers.length < 25) {
                // Check if this isomer is different from current structure
                const isDifferent = isom.name !== currentName;
                if (isDifferent) {
                    isomers.push(isom);
                }
            }
        });
        
        console.log(`Au fost găsiți ${isomers.length} izomeri unici`);
    }
    
    // For alcohols (molecules with -OH group), generate alcohol isomers
    if (parsed.alcohol !== null && parsed.chainLength >= 3) {
        console.log(`Generare izomeri de alcool pentru ${currentName}...`);
        generateAlcoholIsomers(parsed, isomers, currentName);
    }
    
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
    
    if (parsed.alcohol !== null) {
        desc += `\nGrupa hidroxil (-OH) la poziția: ${parsed.alcohol}`;
    }
    
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
    
    // Check if it's an alcohol (has -OH group)
    if (parsed.alcohol !== null) {
        mainPart += `an-${parsed.alcohol}-ol`;
    } else if (parsed.doubleBonds.length > 0) {
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
    
    // Build description with properties if available
    let descriptionHTML = data.description;
    if (data.properties) {
        descriptionHTML += '<br><br><strong>📊 Proprietăți Fizice:</strong><br>' + data.properties.physical;
        descriptionHTML += '<br><br><strong>⚗️ Proprietăți Chimice:</strong><br>' + data.properties.chemical;
        descriptionHTML += '<br><br><strong>🏭 Utilizări:</strong><br>' + data.properties.uses;
    }
    document.getElementById('moleculeDescription').innerHTML = descriptionHTML;
    
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
    document.getElementById('isomerFormula').textContent = `${data.formula} (${data.isomers.length} izomeri găsiți)`;
    
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
                
                // Build description with properties if available
                let descriptionHTML = isomer.description;
                if (isomer.properties) {
                    descriptionHTML += '<br><br><strong>📊 Proprietăți Fizice:</strong><br>' + isomer.properties.physical;
                    descriptionHTML += '<br><br><strong>⚗️ Proprietăți Chimice:</strong><br>' + isomer.properties.chemical;
                    descriptionHTML += '<br><br><strong>🏭 Utilizări:</strong><br>' + isomer.properties.uses;
                }
                document.getElementById('moleculeDescription').innerHTML = descriptionHTML;
                
                // Show back button and keep isomers button
                document.getElementById('backToParentBtn').style.display = 'block';
                document.getElementById('showIsomersBtn').style.display = 'block';
                
                // Update isomers button to show parent's isomers
                document.getElementById('showIsomersBtn').onclick = () => showIsomersModal(moleculeName);
            }
            animationPaused = false;
            modal.style.display = 'none';
        });
        
        isomersList.appendChild(card);
    });
    
    animationPaused = true;
    modal.style.display = 'block';
}

function showIUPACIsomersModal(compoundName, isomersData) {
    sounds.click();
    
    const modal = document.getElementById('isomersModal');
    
    document.getElementById('isomerCompoundName').textContent = compoundName;
    document.getElementById('isomerFormula').textContent = `${isomersData.formula} (${isomersData.isomers.length} izomeri găsiți)`;
    
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
                
                // Build description with properties if available
                let descriptionHTML = isomer.description;
                if (isomer.properties) {
                    descriptionHTML += '<br><br><strong>📊 Proprietăți Fizice:</strong><br>' + isomer.properties.physical;
                    descriptionHTML += '<br><br><strong>⚗️ Proprietăți Chimice:</strong><br>' + isomer.properties.chemical;
                    descriptionHTML += '<br><br><strong>🏭 Utilizări:</strong><br>' + isomer.properties.uses;
                }
                document.getElementById('moleculeDescription').innerHTML = descriptionHTML;
                
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
            animationPaused = false;
            modal.style.display = 'none';
        });
        
        isomersList.appendChild(card);
    });
    
    animationPaused = true;
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
    
    // Skip rendering completely when modal is open
    if (animationPaused) return;
    
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
            
            // Check if this compound exists in the predefined list
            const predefinedCompound = molecules[normalizedInput.toLowerCase()];
            if (predefinedCompound) {
                // Use predefined data instead of generating
                sounds.success();
                loadMolecule(normalizedInput.toLowerCase());
                return;
            }
            
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
            
            if (parsed.alcohol !== null) {
                description += `\nGrupă hidroxil (-OH) la poziția: ${parsed.alcohol}`;
                description += `\nTip: ${parsed.alcohol === 1 ? 'Alcool primar' : parsed.alcohol === parsed.chainLength ? 'Alcool primar' : 'Alcool secundar'}`;
            }
            
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
        animationPaused = false;
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            sounds.click();
            animationPaused = false;
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
