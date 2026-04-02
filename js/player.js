class Player {
    constructor() {
        this.width = 30;
        this.height = 40;
        this.x = Math.min(100, canvas.width * 0.1);
        this.y = canvas.height - CONFIG.groundHeight - this.height;
        this.vx = 0;
        this.vy = 0; 
        this.isGrounded = true;
        this.dead = false;
        this.jumpTimer = 0;
        this.doubleJumpAvailable = false;
        this.health = 3;
        this.invulnerableTimer = 0;
        this.wasSpacePressed = false;
    }

    update() {
        if (this.dead) return;

        if (this.invulnerableTimer > 0) this.invulnerableTimer--;

        // Vertical physics
        this.vy += CONFIG.gravity;

        // Variable Jump & Double Jump logic
        const jumpPressed = keys.Space || keys.ArrowUp;
        
        if (jumpPressed && !this.wasSpacePressed) {
            if (this.isGrounded) {
                this.vy = CONFIG.jumpForce;
                this.isGrounded = false;
                this.jumpTimer = CONFIG.jumpHoldFrames;
                this.doubleJumpAvailable = true;
                this.spawnParticles(this.x + this.width/2, this.y + this.height, 6);
            } else if (this.doubleJumpAvailable) {
                this.vy = CONFIG.jumpForce;
                this.doubleJumpAvailable = false;
                this.jumpTimer = Math.floor(CONFIG.jumpHoldFrames * 0.7);
                this.spawnParticles(this.x + this.width/2, this.y + this.height, 8, '#fdf104'); 
            }
        } else if (jumpPressed && this.jumpTimer > 0) {
            this.vy -= (CONFIG.gravity * 0.8);
            this.jumpTimer--;
        } else {
            this.jumpTimer = 0;
        }
        
        this.wasSpacePressed = jumpPressed;
        this.y += this.vy;

        // Horizontal physics
        let moving = false;
        if (keys.ArrowLeft) {
            this.vx -= CONFIG.playerAccel;
            moving = true;
        }
        if (keys.ArrowRight) {
            this.vx += CONFIG.playerAccel;
            moving = true;
        }

        if (!moving) {
            this.vx *= this.isGrounded ? CONFIG.playerFriction : CONFIG.playerAirFriction;
        }
        
        // Limit horizontal speed
        if (this.vx > CONFIG.playerMaxSpeed) this.vx = CONFIG.playerMaxSpeed;
        if (this.vx < -CONFIG.playerMaxSpeed) this.vx = -CONFIG.playerMaxSpeed;
        
        this.x += this.vx;

        // Ground Collision
        const groundY = canvas.height - CONFIG.groundHeight;
        if (this.y + this.height >= groundY) {
            if (!this.isGrounded && this.vy > 0) {
                this.spawnParticles(this.x + this.width/2, groundY, 8);
            }
            this.y = groundY - this.height;
            this.vy = 0;
            this.isGrounded = true;
            this.doubleJumpAvailable = false;
        } else {
            this.isGrounded = false;
        }

        // Running particles
        if (this.isGrounded && Math.abs(this.vx) > 2 && state.frames % 8 === 0) {
            this.spawnParticles(this.x + (this.vx > 0 ? 0 : this.width), groundY, 1);
        }

        // Screen limits
        if (this.x < 0) { this.x = 0; this.vx = 0; }
        if (this.x + this.width > CONFIG.playerLimitX) {
            this.x = CONFIG.playerLimitX - this.width;
            this.vx = 0;
        }
    }

    spawnParticles(x, y, count, color = 'rgba(236, 240, 241, 0.6)') {
        for(let i=0; i<count; i++) {
            particles.push(new Particle(
                x + (Math.random()*16-8),
                y,
                -Math.random()*2 - 1,
                -Math.random()*2 - 0.5,
                Math.random()*3 + 2,
                color
            ));
        }
    }

    draw(ctx) {
        if (this.dead) return;
        
        if (this.invulnerableTimer > 0 && Math.floor(state.frames / 5) % 2 === 0) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);

        let scaleX = 1;
        let scaleY = 1;
        if (!this.isGrounded) {
            let stretch = Math.min(Math.abs(this.vy) * 0.02, 0.3);
            scaleY = 1 + stretch;
            scaleX = 1 - (stretch * 0.5);
        }
        
        ctx.translate(this.width/2, this.height);
        ctx.scale(scaleX, scaleY);
        ctx.translate(-this.width/2, -this.height);

        let bounceY = (this.isGrounded && Math.abs(this.vx) > 1) ? Math.abs(Math.sin(state.frames * 0.3)) * 3 : 0;
        ctx.translate(0, -bounceY);

        const u = this.width / 12; 
        const v = this.height / 16;
        
        const R = '#e52521'; 
        const BL = '#0043bb'; 
        const P = '#ffcca6'; 
        const BR = '#5c3a21'; 
        const Y = '#fdf104'; 

        // Hat
        ctx.fillStyle = R;
        ctx.fillRect(3*u, 0*v, 5*u, 2*v);
        ctx.fillRect(2*u, 2*v, 9*u, 1*v); 
        
        // Head
        ctx.fillStyle = BR;
        ctx.fillRect(2*u, 3*v, 3*u, 3*v); 
        ctx.fillRect(1*u, 4*v, 1*u, 3*v); 
        
        ctx.fillStyle = P;
        ctx.fillRect(5*u, 3*v, 4*u, 4*v); 
        ctx.fillRect(9*u, 4*v, 2*u, 2*v); 
        ctx.fillRect(3*u, 6*v, 6*u, 1*v); 
        
        ctx.fillStyle = BR;
        ctx.fillRect(7*u, 3*v, 1*u, 2*v); 
        ctx.fillRect(7*u, 5*v, 4*u, 1*v); 
        
        // Body
        ctx.fillStyle = R;
        ctx.fillRect(2*u, 7*v, 3*u, 4*v); 
        ctx.fillRect(7*u, 7*v, 3*u, 4*v); 
        ctx.fillRect(4*u, 7*v, 4*u, 2*v); 

        ctx.fillStyle = BL;
        ctx.fillRect(4*u, 9*v, 4*u, 4*v); 
        ctx.fillRect(3*u, 8*v, 1*u, 3*v); 
        ctx.fillRect(8*u, 8*v, 1*u, 3*v); 

        ctx.fillStyle = Y;
        ctx.fillRect(3*u, 10*v, 1*u, 1*v); 
        ctx.fillRect(8*u, 10*v, 1*u, 1*v); 

        // Hands
        ctx.fillStyle = P;
        ctx.fillRect(1*u, 9*v, 2*u, 2*v); 
        ctx.fillRect(9*u, 9*v, 2*u, 2*v); 

        // Legs
        ctx.fillStyle = BR;
        let stride = 0;
        if (this.isGrounded && Math.abs(this.vx) > 0.5) stride = Math.sin(state.frames * 0.4) * 3;
        else if (!this.isGrounded) stride = 2; // Jump pose
        
        ctx.fillRect((3 - stride)*u, 13*v, 3*u, 2*v); 
        ctx.fillRect((6 + stride)*u, 13*v, 3*u, 2*v); 
        
        ctx.restore();
    }
}
