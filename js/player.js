class Player {
    constructor() {
        this.width = 30;
        this.height = 40;
        this.x = Math.min(100, canvas.width * 0.1);
        this.y = 0; // Will be set by resolving early collision or spawn location
        this.vx = 0;
        this.vy = 0; 
        this.isGrounded = false;
        this.dead = false;
        this.jumpTimer = 0;
        this.doubleJumpAvailable = false;
        this.health = 3;
        this.invulnerableTimer = 0;
        this.wasSpacePressed = false;
        this.wasFirePressed = false;
        this.powerState = 0; // 0=small, 1=big, 2=fire
    }
    
    setPower(newState) {
        if (newState > this.powerState) {
            if (this.powerState === 0 && newState > 0) {
                this.height = 70;
                this.y -= 30; // Shift up to avoid getting stuck in floor
            }
            this.powerState = newState;
            // Transformation particles
            for(let i=0; i<15; i++) {
                particles.push(new Particle(this.x+15, this.y+20, (Math.random()-0.5)*10, (Math.random()-0.5)*10, 5, '#f1c40f'));
            }
        }
    }
    
    takeDamage() {
        if (this.powerState > 0) {
            this.powerState = 0;
            this.height = 40;
            this.y += 30; // Shrink back down
            this.invulnerableTimer = 60; // 1 sec i-frames
            for(let i=0; i<10; i++) {
                particles.push(new Particle(this.x+15, this.y, (Math.random()-0.5)*10, -Math.random()*5, 4, '#e74c3c'));
            }
        } else {
            this.die();
        }
    }

    die() {
        if (this.dead) return;
        this.dead = true;
        this.vy = -12;
        this.vx = 0;
        this.invulnerableTimer = 0;
        state.currentSpeed = 0; // Stop world scrolling
    }

    update() {
        if (this.dead) {
             this.vy += CONFIG.gravity;
             this.y += this.vy;
             // Delay game over slightly until mario completely falls off 
             if (this.y > canvas.height + 150) {
                 state.current = GAME_STATE.GAME_OVER;
             }
             return;
        }

        if (this.invulnerableTimer > 0) this.invulnerableTimer--;
        
        // Moon Mode Toggle
        const gPressed = keys.KeyG;
        if (gPressed && !state.wasGPressed) {
            state.moonMode = !state.moonMode;
            if (typeof enemies !== 'undefined') {
                for (let e of enemies) {
                    e.markedForDeletion = true;
                    for (let i=0; i<3; i++) particles.push(new Particle(e.x+15, e.y+15, (Math.random()-0.5)*4, (Math.random()-0.5)*4, 3, '#ecf0f1'));
                }
            }
        }
        state.wasGPressed = gPressed;

        // 1. Move Horizontally
        let moving = false;
        if (keys.ArrowLeft || keys.KeyA) {
            this.vx -= CONFIG.playerAccel;
            moving = true;
        }
        if (keys.ArrowRight || keys.KeyD) {
            this.vx += CONFIG.playerAccel;
            moving = true;
        }

        if (!moving) {
            if (state.moonMode) {
                this.vx *= 0.98; // Low friction drift
            } else {
                this.vx *= this.isGrounded ? CONFIG.playerFriction : CONFIG.playerAirFriction;
            }
        }
        
        // Limit horizontal speed
        if (this.vx > CONFIG.playerMaxSpeed) this.vx = CONFIG.playerMaxSpeed;
        if (this.vx < -CONFIG.playerMaxSpeed) this.vx = -CONFIG.playerMaxSpeed;

        this.x += this.vx;

        // Horiz bounds (keep from running off left screen)
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        }
        
        // Limit on right (push world instead ideally, but for now fixed player bounds)
        if (this.x + this.width > CONFIG.playerLimitX) {
            this.x = CONFIG.playerLimitX - this.width;
            this.vx = 0;
        }

        // Horizontal Collision
        for (let plat of platforms) {
            if (this.checkAABB(this, plat)) {
                // If the player is on the left side of the platform
                if (this.x + this.width/2 < plat.x + plat.width/2) {
                    this.x = plat.x - this.width;
                    this.vx = 0;
                } else {
                    this.x = plat.x + plat.width;
                    this.vx = 0;
                }
            }
        }

        // Camera Block / Wait for Jump logic
        let playerBlocked = false;
        for (let plat of platforms) {
            // Check if there is a wall approaching our right side
            if (plat.x <= this.x + this.width + state.currentSpeed && 
                plat.x + plat.width > this.x + this.width &&
                plat.y < this.y + this.height - 2 && 
                plat.y + plat.height > this.y + 2) {
                playerBlocked = true;
                break;
            }
        }
        
        if (playerBlocked && this.x <= 0 && !this.dead) {
            state.currentSpeed = 0;
            // Removed this.x = 0 to prevent artificial overlap
        } else if (!this.dead) {
            state.currentSpeed = CONFIG.baseSpeed;
        }

        // 2. Vertical Movement Logic
        const jumpPressed = keys.Space || keys.ArrowUp || keys.KeyW;
        
        if (state.moonMode) {
            if (jumpPressed) {
                this.vy -= CONFIG.playerAccel * 0.6; // upward thrust
                if (state.frames % 3 === 0) {
                    particles.push(new Particle(this.x + this.width/2 + (Math.random()*10-5), this.y + this.height, (Math.random()-0.5)*2, Math.random()*2+2, 4, '#00ffff'));
                }
            }
            if (keys.ArrowDown || keys.KeyS) {
                this.vy += CONFIG.playerAccel * 0.6; // downward thrust
                if (state.frames % 3 === 0) {
                    particles.push(new Particle(this.x + this.width/2 + (Math.random()*10-5), this.y, (Math.random()-0.5)*2, -Math.random()*2-2, 4, '#00ffff'));
                }
            }
            if (!jumpPressed && !keys.ArrowDown && !keys.KeyS) {
                this.vy *= 0.98; // drift
            }
        } else {
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
                this.vy -= (CONFIG.gravity * 0.6); // Less effective counter-gravity
                this.jumpTimer--;
            } else {
                this.jumpTimer = 0;
            }
        }
        this.wasSpacePressed = jumpPressed;
        
        // Fire Logic
        const firePressed = keys.KeyF;
        if (firePressed && !this.wasFirePressed && this.powerState === 2) {
             projectiles.push(new Projectile(this.x + this.width, this.y + this.height/3, 10));
             for(let i=0; i<3; i++) particles.push(new Particle(this.x+this.width, this.y+this.height/3, Math.random()*2, (Math.random()-0.5)*2, 3, '#e74c3c'));
        }
        this.wasFirePressed = firePressed;

        // 3. Move Vertically
        if (!state.moonMode) {
            this.vy += CONFIG.gravity;
            if (this.vy > 12) this.vy = 12;
        } else {
            if (this.vy > 6) this.vy = 6;
            if (this.vy < -6) this.vy = -6;
        }
        
        this.y += this.vy;

        // Vertical Collision
        this.isGrounded = false;
        for (let plat of platforms) {
            if (this.checkAABB(this, plat)) {
                if (this.vy > 0) { // Falling down (landed)
                    this.y = plat.y - this.height;
                    this.vy = 0;
                    if (!this.isGrounded) {
                        this.spawnParticles(this.x + this.width/2, plat.y, 8);
                    }
                    this.isGrounded = true;
                    this.doubleJumpAvailable = false;
                } else if (this.vy < 0) { // Jumping up (hit ceiling)
                    this.y = plat.y + plat.height;
                    this.vy = 0;
                    this.jumpTimer = 0;
                    if (plat.hitBlock) plat.hitBlock();
                }
            }
        }

        // Running particles
        if (this.isGrounded && Math.abs(this.vx) > 2 && state.frames % 8 === 0) {
            this.spawnParticles(this.x + (this.vx > 0 ? 0 : this.width), this.y + this.height, 1);
        }

        // Collectible Collision
        for (let item of items) {
            if (!item.collected && !item.markedForDeletion && this.checkAABB(this, item)) {
                item.collected = true;
                if (item.type === 'mushroom') {
                    this.setPower(1);
                    state.score += 1000;
                } else if (item.type === 'fireflower') {
                    this.setPower(2);
                    state.score += 1000;
                }
            }
        }
        
        // Enemy Collision
        for (let enemy of enemies) {
            if (!enemy.dead && !enemy.markedForDeletion && !this.dead && this.checkAABB(this, enemy)) {
                // If falling on top of the enemy
                if (this.vy > 0 && this.y + this.height - this.vy <= enemy.y + 12) {
                    if (enemy.type === 'turtle') {
                        if (enemy.state === 'walking') {
                            enemy.state = 'shell';
                            enemy.vx = 0;
                            enemy.y += 10;
                            enemy.height = 22;
                        } else if (enemy.state === 'shell') {
                            enemy.state = 'sliding';
                            enemy.vx = this.x < enemy.x ? 6 : -6;
                        } else if (enemy.state === 'sliding') {
                            enemy.state = 'shell';
                            enemy.vx = 0;
                        }
                    } else {
                        enemy.dead = true;
                    }
                    this.vy = CONFIG.jumpForce * 0.7; // bounce off
                    state.score += 200;
                    
                    // Particles
                    for(let i=0; i<6; i++) {
                        particles.push(new Particle(enemy.x+15, enemy.y+15, (Math.random()-0.5)*8, (Math.random()-0.5)*8, 4, '#ecf0f1'));
                    }
                } else if (this.invulnerableTimer <= 0) {
                    // Touched side or bottom
                    if (enemy.type === 'turtle' && enemy.state === 'shell') {
                        // Kick the shell sideways safely
                        enemy.state = 'sliding';
                        enemy.vx = this.x < enemy.x ? 6 : -6;
                        this.invulnerableTimer = 10; // very brief iframe so sliding shell doesn't instantly snap back and kill player
                    } else {
                        this.takeDamage(); // Health downscale or die
                    }
                }
            }
        }
    }

    checkAABB(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
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
        
        const R = this.powerState === 2 ? '#ecf0f1' : '#e52521'; 
        const BL = this.powerState === 2 ? '#e74c3c' : '#0043bb'; 
        const P = '#ffcca6'; 
        const BR = '#5c3a21'; 
        const Y = '#fdf104'; 
        
        if (state.moonMode) {
            // Astronaut Suit
            ctx.fillStyle = '#ecf0f1'; // White suit
            ctx.fillRect(2*u, 2*v, 8*u, 6*v); // Head
            ctx.fillRect(3*u, 8*v, 6*u, 5*v); // Body
            ctx.fillRect(2*u, 13*v, 3*u, 3*v); // Left Leg
            ctx.fillRect(7*u, 13*v, 3*u, 3*v); // Right Leg
            ctx.fillRect(1*u, 8*v, 2*u, 4*v); // Left Arm
            ctx.fillRect(9*u, 8*v, 2*u, 4*v); // Right Arm
            
            // Cyan Visor
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(4*u, 4*v, 5*u, 3*v);
            
            // Backpack
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(0*u, 7*v, 3*u, 4*v);
            
            if (this.powerState > 0) {
                // Decorate for big/fire
                ctx.fillStyle = this.powerState === 2 ? '#e74c3c' : '#27ae60';
                ctx.fillRect(4*u, 9*v, 4*u, 4*v);
            }
        } else {
            // Normal Mario
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
        }
        
        ctx.restore();
    }
}
