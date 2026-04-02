function initGame() {
    player = new Player();
    clouds = [];
    particles = [];
    state.frames = 0;
    state.currentSpeed = CONFIG.baseSpeed;
    state.score = 0;
    state.coins = 0;
    state.time = 400;
    state.lastTimeMillis = Date.now();
    
    for(let i=0; i<3; i++) {
        let cloud = new Cloud();
        cloud.x = Math.random() * canvas.width;
        clouds.push(cloud);
    }
}

function animate() {
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
            player.update();
            player.draw(ctx);
            drawHUD(ctx, canvas);
            drawMobileControls(ctx, canvas);
            
            // Time logic
            if (now - state.lastTimeMillis > 1000) {
                state.time--;
                state.lastTimeMillis = now;
                if (state.time <= 0) {
                    state.current = GAME_STATE.GAME_OVER;
                }
            }
            state.frames++;

            // Triggers game over if player falls off the screen
            if (player.y > canvas.height) {
                state.current = GAME_STATE.GAME_OVER;
            }
            break;
            
        case GAME_STATE.GAME_OVER:
            drawGameOver(ctx, canvas);
            break;
    }

    requestAnimationFrame(animate);
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
