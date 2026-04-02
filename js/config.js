const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CONFIG = {
    gravity: 0.5,
    groundHeight: 0,
    baseSpeed: 5,
    jumpForce: -10,
    jumpHoldFrames: 12,
    playerAccel: 0.8,
    playerFriction: 0.85,
    playerMaxSpeed: 6,
    playerAirFriction: 0.95,
    playerLimitX: 0
};

const GAME_STATE = {
    MENU: 0,
    PLAYING: 1,
    GAME_OVER: 2
};

let state = {
    current: GAME_STATE.MENU,
    frames: 0,
    currentSpeed: CONFIG.baseSpeed,
    score: 0,
    coins: 0,
    world: "1-1",
    time: 400,
    lastTimeMillis: 0,
    distance: 0,
    moonMode: false,
    wasGPressed: false,
    coopMode: false,
    wasCPressed: false
};

const keys = {
    Space: false,
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Enter: false,
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    KeyF: false,
    KeyG: false,
    KeyC: false,
    ShiftLeft: false,
    ShiftRight: false
};

// Global arrays
let player1;
let player2;
let clouds = [];
let particles = [];
let platforms = [];
let items = [];
let enemies = [];
let projectiles = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    CONFIG.groundHeight = canvas.height * 0.22;
    CONFIG.playerLimitX = canvas.width / 2;
    
    if (typeof player1 !== 'undefined' && player1 && player1.isGrounded) {
        player1.y = canvas.height - CONFIG.groundHeight - player1.height;
    }
    if (typeof player2 !== 'undefined' && player2 && player2.isGrounded) {
        player2.y = canvas.height - CONFIG.groundHeight - player2.height;
    }
}

window.addEventListener('resize', resizeCanvas);
// Call it once immediately to set initial dimensions
resizeCanvas();
