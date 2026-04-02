// ==========================================
// DRAWING ROUTINES
// ==========================================

function handleEntities() {
    if (state.frames % 350 === 0) clouds.push(new Cloud());

    clouds.forEach(cloud => cloud.update());
    clouds = clouds.filter(cloud => !cloud.markedForDeletion);
    
    particles.forEach(p => p.update());
    particles = particles.filter(p => !p.markedForDeletion);
}

function drawEnvironment(ctx, canvas) {
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

    // Ground
    ctx.fillStyle = '#C84C0C'; 
    const groundY = canvas.height - CONFIG.groundHeight;
    ctx.fillRect(0, groundY, canvas.width, CONFIG.groundHeight);
    
    ctx.fillStyle = '#8B2C04';
    ctx.fillRect(0, groundY, canvas.width, 4);

    // Optional player shadow
    if(player && state.current === GAME_STATE.PLAYING && !player.dead) {
        ctx.save();
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
    ctx.fillStyle = '#ffffff';
    // Adding shadow for better visibility
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.font = 'bold 32px "VT323", monospace';
    ctx.textAlign = 'left';
    
    // Layout dimensions based on screen size
    const isMobile = window.innerWidth < 600;
    const yOffset = isMobile ? 30 : 40;
    const yValOffset = isMobile ? 55 : 70;
    
    if (isMobile) {
        ctx.font = 'bold 24px "VT323", monospace';
    }

    // SCORE
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', Math.max(20, canvas.width * 0.05), yOffset);
    ctx.fillText(state.score.toString().padStart(6, '0'), Math.max(20, canvas.width * 0.05), yValOffset);
    
    // COINS / CHIPS
    const coinsX = canvas.width * 0.35;
    ctx.textAlign = 'left';
    ctx.fillText('DATA', coinsX, yOffset);
    ctx.fillStyle = '#fdf104'; 
    ctx.beginPath();
    ctx.ellipse(coinsX - 15, yValOffset - (isMobile ? 6 : 8), isMobile ? 6 : 8, isMobile ? 10 : 12, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('x' + state.coins.toString().padStart(2, '0'), coinsX, yValOffset);
    
    // WORLD
    ctx.textAlign = 'center';
    ctx.fillText('WORLD', canvas.width * 0.65, yOffset);
    ctx.fillText(state.world, canvas.width * 0.65, yValOffset);
    
    // TIME
    ctx.textAlign = 'right';
    ctx.fillText('TIME', canvas.width - Math.max(20, canvas.width * 0.05), yOffset);
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
