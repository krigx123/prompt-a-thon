function initGame() {
    player1 = new Player(1);
    player2 = new Player(2);
    clouds = [];
    particles = [];
    state.frames = 0;
    state.currentSpeed = CONFIG.baseSpeed;
    state.score = 0;
    state.coins = 0;
    state.time = 400;
    state.lastTimeMillis = Date.now();
    platforms = [];
    items = [];
    enemies = [];
    projectiles = [];
    
    // Initial ground block to spawn on
    platforms.push(new Platform(0, canvas.height - CONFIG.groundHeight, canvas.width * 1.5, CONFIG.groundHeight + 200, 'ground'));
    
    player1.x = 80;
    player1.y = canvas.height - CONFIG.groundHeight - player1.height;
    
    player2.x = 140;
    player2.y = canvas.height - CONFIG.groundHeight - player2.height;
    player2.dead = true; // Coop off by default
    state.coopMode = false;
    state.wasCPressed = false;

    for(let i=0; i<3; i++) {
        let cloud = new Cloud();
        cloud.x = Math.random() * canvas.width;
        clouds.push(cloud);
    }
}

let lastFrameTime = 0;
const fpsInterval = 1000 / 60;

function animate(time) {
    requestAnimationFrame(animate);
    
    if (!time) time = performance.now();
    let elapsed = time - lastFrameTime;
    if (elapsed < fpsInterval) return;
    lastFrameTime = time - (elapsed % fpsInterval);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const now = Date.now();

    switch(state.current) {
        case GAME_STATE.MENU:
            drawMenu(ctx, canvas);
            break;
            
        case GAME_STATE.PLAYING:
            drawEnvironment(ctx, canvas);
            handleEntities();
            particles.forEach(p => p.draw(ctx));
            if (keys.KeyC && !state.wasCPressed) {
                state.coopMode = !state.coopMode;
                if (state.coopMode) {
                    player2.dead = false;
                    player2.x = player1.x + 30;
                    player2.y = player1.y - 20;
                    player2.vy = -10; // Pop out
                    player2.invulnerableTimer = 60;
                    for(let i=0; i<15; i++) particles.push(new Particle(player2.x, player2.y, (Math.random()-0.5)*10, (Math.random()-0.5)*10, 4, '#ff9f43'));
                } else {
                    player2.dead = true;
                    // spawn particles on removal
                    for(let i=0; i<15; i++) particles.push(new Particle(player2.x, player2.y, (Math.random()-0.5)*10, (Math.random()-0.5)*10, 4, '#e74c3c'));
                }
            }
            state.wasCPressed = keys.KeyC;

            player1.update();
            if (state.coopMode) player2.update();
            
            let p2Blocked = state.coopMode && player2.blocked;
            let p2Dead = state.coopMode && player2.dead;
            
            // Reconcile speed if either is blocked/dead
            if (player1.dead || p2Dead || player1.blocked || p2Blocked) {
                state.currentSpeed = 0;
            } else {
                state.currentSpeed = CONFIG.baseSpeed;
            }
            
            player1.draw(ctx);
            if (state.coopMode) player2.draw(ctx);
            
            drawHUD(ctx, canvas);
            drawMobileControls(ctx, canvas);
            
            state.distance += state.currentSpeed;
            
            // Time logic
            if (now - state.lastTimeMillis > 1000) {
                state.time--;
                state.lastTimeMillis = now;
                if (state.time <= 0) {
                    state.current = GAME_STATE.GAME_OVER;
                }
            }
            state.frames++;

            // Triggers death if player falls off the screen
            if (player1.y > canvas.height + 50 && !player1.dead) {
                player1.die();
            }
            if (state.coopMode && player2.y > canvas.height + 50 && !player2.dead) {
                player2.die();
            }
            break;
            
        case GAME_STATE.GAME_OVER:
            drawGameOver(ctx, canvas);
            break;
    }
}

// ==========================================
// INPUT HANDLING
// ==========================================

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
    
    if (e.code === 'Enter' || e.code === 'Space') {
        if (state.current === GAME_STATE.MENU || state.current === GAME_STATE.GAME_OVER) {
            initGame();
            state.current = GAME_STATE.PLAYING;
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

window.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    
    if (state.current === GAME_STATE.MENU || state.current === GAME_STATE.GAME_OVER) {
        initGame();
        state.current = GAME_STATE.PLAYING;
        return;
    }

    for(let i=0; i<e.changedTouches.length; i++) {
        let x = e.changedTouches[i].clientX;
        let y = e.changedTouches[i].clientY;
        
        if (y > canvas.height - 90) { 
            if (x < 95) keys.ArrowLeft = true;
            else if (x >= 95 && x <= 180) keys.ArrowRight = true;
            else if (x > canvas.width - 100) keys.Space = true;
        } else {
            keys.Space = true;
        }
    }
}, {passive: false});

window.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (e.touches.length === 0) {
        keys.ArrowLeft = false;
        keys.ArrowRight = false;
        keys.Space = false;
    }
}, {passive: false});

// Start the game loop
initGame();
state.current = GAME_STATE.MENU; 
animate();
