// ==========================================
// DRAWING ROUTINES
// ==========================================

function handleEntities() {
    if (state.frames % 350 === 0) clouds.push(new Cloud());

    clouds.forEach(cloud => cloud.update());
    clouds = clouds.filter(cloud => !cloud.markedForDeletion);
    
    particles.forEach(p => p.update());
    particles = particles.filter(p => !p.markedForDeletion);
    
    if (typeof platforms !== 'undefined') {
        platforms.forEach(p => p.update());
        platforms = platforms.filter(p => !p.markedForDeletion);
        
        // Procedural Generation
        let maxPlatX = 0;
        platforms.forEach(p => {
            if (p.type === 'ground' && p.x + p.width > maxPlatX) {
                maxPlatX = p.x + p.width;
            }
        });
        
        while (maxPlatX < canvas.width + 1200 && state.current === GAME_STATE.PLAYING) {
            let gap = Math.random() < 0.35 ? 120 + Math.random() * 120 : 0;
            gap = Math.round(gap / 32) * 32; // Align to 32px
            
            if (maxPlatX === 0) gap = 0; // fallback if empty
            
            let groundW = 350 + Math.random() * 600;
            groundW = Math.round(groundW / 32) * 32; // Align to 32px
            
            let groundY = canvas.height - CONFIG.groundHeight;
            let newX = maxPlatX + gap;
            
            platforms.push(new Platform(newX, groundY, groundW, CONFIG.groundHeight + 200, 'ground'));
            
            // Random obstacles
            if (maxPlatX > 0 && Math.random() < 0.6 && groundW > 350) {
                let choice = Math.random();
                let obX = newX + 150 + Math.random()*(groundW - 300);
                
                if (choice < 0.3) {
                    // Pipe
                    let pipeH = 60 + Math.random() * 40;
                    platforms.push(new Platform(obX, groundY - pipeH, 60, pipeH, 'pipe'));
                } else if (choice < 0.6) {
                    // Brick and mystery Block cluster
                    platforms.push(new Platform(obX, groundY - 140, 40, 40, 'mystery'));
                    platforms.push(new Platform(obX - 40, groundY - 140, 40, 40, 'brick'));
                    platforms.push(new Platform(obX + 40, groundY - 140, 40, 40, 'brick'));
                    if (Math.random() < 0.5) enemies.push(new Enemy(obX, groundY - 40, state.moonMode ? 'mine' : 'bug'));
                } else {
                    // Floating ledge / Double jump requirement
                    platforms.push(new Platform(obX, groundY - 160, 180, 32, 'brick'));
                    if (Math.random() < 0.5) {
                         platforms.push(new Platform(obX + 60, groundY - 280, 40, 40, 'mystery'));
                    }
                    if (Math.random() < 0.6) {
                        let enemyY = state.moonMode ? groundY - 250 : groundY - 200;
                        enemies.push(new Enemy(obX + 40, enemyY, state.moonMode ? 'ufo' : 'fast'));
                    }
                }
            } else if (maxPlatX > 0 && Math.random() < 0.3 && groundW > 250) {
                let enemyType = state.moonMode ? (Math.random() < 0.6 ? 'ufo' : 'mine') : (Math.random() < 0.7 ? 'bug' : 'fast');
                let enemyY = state.moonMode ? groundY - (Math.random() * 200 + 40) : groundY - 40;
                enemies.push(new Enemy(newX + 100 + Math.random()*(groundW - 150), enemyY, enemyType));
            }
            maxPlatX = newX + groundW;
        }
    }

    if (typeof items !== 'undefined') {
        items.forEach(i => i.update());
        items = items.filter(i => !i.markedForDeletion);
    }
    
    if (typeof enemies !== 'undefined') {
        enemies.forEach(e => e.update());
        enemies = enemies.filter(e => !e.markedForDeletion);
    }
    
    if (typeof projectiles !== 'undefined') {
        projectiles.forEach(p => p.update());
        projectiles = projectiles.filter(p => !p.markedForDeletion);
    }
}

function drawEnvironment(ctx, canvas) {
    if (state.moonMode) {
        let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#000000'); 
        grad.addColorStop(1, '#1A1A2E');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Procedural Stars
        ctx.fillStyle = '#ffffff';
        for(let i=0; i<50; i++) {
            let sx = ((i * 13579) - state.distance*0.05) % canvas.width;
            if (sx < 0) sx += canvas.width;
            let sy = (i * 8642) % (canvas.height * 0.7);
            ctx.fillRect(sx, sy, (i%2)+1, (i%2)+1);
        }

        // Earth
        ctx.save();
        let scrollEarth = (state.distance * 0.02) % canvas.width;
        ctx.translate(canvas.width*0.7 - scrollEarth, canvas.height*0.3);
        ctx.fillStyle = '#2980b9'; // Ocean
        ctx.beginPath();
        ctx.arc(0, 0, 100, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#27ae60'; // Land
        ctx.beginPath();
        ctx.arc(-20, -30, 30, 0, Math.PI * 2);
        ctx.arc(20, 10, 40, 0, Math.PI * 2);
        ctx.arc(-40, 40, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    } else {
        let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#5A94FF'); 
        grad.addColorStop(1, '#dfe6e9');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    
        // Sun
        ctx.fillStyle = 'rgba(255, 234, 167, 0.9)';
        ctx.beginPath();
        ctx.arc(canvas.width * 0.8, canvas.height * 0.3, 40, 0, Math.PI * 2);
        ctx.fill();
    
        clouds.forEach(c => c.draw(ctx));
    
        // Parallax Backgrounds (City / Circuits)
        ctx.save();
        let scroll1 = (state.distance * 0.2) % canvas.width;
        let groundY = canvas.height - CONFIG.groundHeight;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for(let i=-1; i<2; i++) {
            let bx = i * canvas.width - scroll1;
            // Background buildings / circuits
            ctx.fillRect(bx + 100, groundY - 200, 80, 200);
            ctx.fillRect(bx + 200, groundY - 150, 100, 150);
            ctx.fillRect(bx + 350, groundY - 300, 60, 300);
            ctx.fillRect(bx + 450, groundY - 180, 120, 180);
            ctx.fillRect(bx + 600, groundY - 240, 90, 240);
            ctx.fillRect(bx + 800, groundY - 120, 150, 120);
        }
        ctx.restore();
    }

    // Ensure ground and other platforms are drawn
    if (typeof platforms !== 'undefined') {
        platforms.forEach(p => p.draw(ctx));
    }
    
    if (typeof items !== 'undefined') {
        items.forEach(i => i.draw(ctx));
    }
    
    if (typeof enemies !== 'undefined') {
        enemies.forEach(e => e.draw(ctx));
    }
    
    if (typeof projectiles !== 'undefined') {
        projectiles.forEach(p => p.draw(ctx));
    }

    // Optional player shadow
    if(player && state.current === GAME_STATE.PLAYING && !player.dead) {
        ctx.save();
        let groundY = canvas.height - CONFIG.groundHeight;
        let shadowY = groundY;
        let heightAboveGround = groundY - (player.y + player.height);
        let shadowAlpha = Math.max(0.05, 0.4 - (heightAboveGround * 0.003));
        let shadowWidth = player.width * 0.8 + (player.isGrounded ? Math.sin(state.frames * 0.3) * 5 : 0);
        
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(player.x + player.width/2, shadowY + 8, shadowWidth / 1.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawHUD(ctx, canvas) {
    ctx.save();
    
    // Layout dimensions based on screen size
    const isMobile = window.innerWidth < 600;
    const yOffset = isMobile ? 30 : 40;
    const yValOffset = isMobile ? 55 : 70;
    
    ctx.font = isMobile ? 'bold 24px "VT323", monospace' : 'bold 32px "VT323", monospace';
    ctx.textAlign = 'left';

    // Different colors: Labels are yellow-orange, values are white
    const labelColor = '#FDF104'; 
    const valColor = '#FFFFFF';

    // SCORE
    ctx.fillStyle = labelColor;
    ctx.fillText('SCORE', Math.max(20, canvas.width * 0.05), yOffset);
    ctx.fillStyle = valColor;
    ctx.fillText(state.score.toString().padStart(6, '0'), Math.max(20, canvas.width * 0.05), yValOffset);
    
    // COINS / CHIPS
    const coinsX = canvas.width * 0.35;
    
    ctx.fillStyle = labelColor;
    ctx.textAlign = 'left';
    ctx.fillText('DATA', coinsX, yOffset);
    
    // Draw generic coin representation
    ctx.fillStyle = '#fdf104'; 
    ctx.beginPath();
    ctx.ellipse(coinsX - 15, yValOffset - (isMobile ? 6 : 8), isMobile ? 6 : 8, isMobile ? 10 : 12, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#d35400'; // Coin inner detail
    ctx.fillRect(coinsX - 16, yValOffset - (isMobile ? 10 : 13), 2, isMobile ? 8 : 10);
    
    ctx.fillStyle = valColor;
    ctx.fillText('x' + state.coins.toString().padStart(2, '0'), coinsX, yValOffset);
    
    // WORLD
    ctx.fillStyle = labelColor;
    ctx.textAlign = 'center';
    ctx.fillText('WORLD', canvas.width * 0.65, yOffset);
    ctx.fillStyle = valColor;
    ctx.fillText(state.world, canvas.width * 0.65, yValOffset);
    
    // TIME
    ctx.fillStyle = labelColor;
    ctx.textAlign = 'right';
    ctx.fillText('TIME', canvas.width - Math.max(20, canvas.width * 0.05), yOffset);
    ctx.fillStyle = valColor;
    ctx.fillText(Math.max(0, state.time).toString().padStart(3, '0'), canvas.width - Math.max(20, canvas.width * 0.05), yValOffset);
    
    ctx.restore();
}

function drawMenu(ctx, canvas) {
    drawEnvironment(ctx, canvas);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    
    const isMobile = window.innerWidth < 600;
    ctx.font = `bold ${isMobile ? 40 : 80}px "VT323", monospace`;
    
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    
    ctx.fillText('PIXEL PIONEER', canvas.width/2, canvas.height/3);
    
    ctx.font = `bold ${isMobile ? 24 : 32}px "VT323", monospace`;
    ctx.fillStyle = '#fdf104';
    ctx.fillText('SILICON RUNNER v80.0', canvas.width/2, canvas.height/3 + 40);
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.font = `bold ${isMobile ? 24 : 36}px "VT323", monospace`;
    
    // Blinking effect
    if (Math.floor(Date.now() / 600) % 2 === 0) {
        ctx.fillStyle = '#ffffff';
        let msg = isMobile ? 'TAP TO START' : 'PRESS ENTER TO START';
        ctx.fillText(msg, canvas.width/2, canvas.height * 0.7);
    }
}

function drawGameOver(ctx, canvas) {
    drawEnvironment(ctx, canvas);
    if (player) player.draw(ctx);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ff4757';
    ctx.textAlign = 'center';
    const isMobile = window.innerWidth < 600;
    ctx.font = `bold ${isMobile ? 50 : 80}px "VT323", monospace`;
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/3);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${isMobile ? 30 : 40}px "VT323", monospace`;
    ctx.fillText('SCORE: ' + state.score, canvas.width/2, canvas.height/3 + 60);
    
    if (Math.floor(Date.now() / 600) % 2 === 0) {
        ctx.fillStyle = '#fdf104';
        let msg = isMobile ? 'TAP TO RESTART' : 'PRESS ENTER TO RESTART';
        ctx.fillText(msg, canvas.width/2, canvas.height * 0.7);
    }
}

function drawMobileControls(ctx, canvas) {
    const isMobile = window.innerWidth < 1024;
    if (isMobile && state.current === GAME_STATE.PLAYING) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;

        // Left Arrow
        ctx.beginPath();
        ctx.rect(20, canvas.height - 80, 70, 60);
        if (keys.ArrowLeft) ctx.fill();
        ctx.stroke();

        // Right Arrow
        ctx.beginPath();
        ctx.rect(100, canvas.height - 80, 70, 60);
        if (keys.ArrowRight) ctx.fill();
        ctx.stroke();

        // Jump Button
        ctx.beginPath();
        ctx.rect(canvas.width - 90, canvas.height - 80, 70, 60);
        if (keys.Space) ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(223, 230, 233, 0.8)';
        ctx.font = 'bold 24px "VT323", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('<', 55, canvas.height - 43);
        ctx.fillText('>', 135, canvas.height - 43);
        ctx.font = 'bold 16px "VT323", monospace';
        ctx.fillText('JUMP', canvas.width - 55, canvas.height - 45);

        ctx.restore();
    }
}
