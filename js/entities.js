class Particle {
    constructor(x, y, vx, vy, size, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = Math.max(1, size);
        this.color = color;
        this.alpha = 1;
        this.markedForDeletion = false;
    }
    update() {
        this.x += this.vx - state.currentSpeed; 
        this.y += this.vy;
        this.alpha -= 0.04;
        this.size *= 0.95;
        if (this.alpha <= 0 || this.size < 0.2) this.markedForDeletion = true;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Cloud {
    constructor() {
        this.width = 100 + Math.random() * 60;
        this.height = 40 + Math.random() * 20;
        this.x = canvas.width + Math.random() * 100;
        this.y = Math.random() * (canvas.height / 2 - this.height);
        this.speed = (Math.random() * 0.5 + 0.1) * (state.currentSpeed * 0.2);
        this.markedForDeletion = false;
    }

    update() {
        if (state.current !== GAME_STATE.PLAYING) return;
        this.x -= this.speed;
        if (this.x + this.width < -100) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.85; 
        
        ctx.beginPath();
        ctx.arc(this.width * 0.2, this.height * 0.7, this.height * 0.3, Math.PI * 0.5, Math.PI * 1.5);
        ctx.arc(this.width * 0.45, this.height * 0.4, this.height * 0.4, Math.PI, Math.PI * 2);
        ctx.arc(this.width * 0.75, this.height * 0.5, this.height * 0.3, Math.PI, Math.PI * 2);
        ctx.arc(this.width * 0.85, this.height * 0.75, this.height * 0.25, Math.PI * 1.5, Math.PI * 0.5);
        ctx.closePath(); 
        ctx.fill();
        
        ctx.restore();
    }
}

class Platform {
    constructor(x, y, w, h, type = 'ground') {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type; // 'ground', 'brick', 'pipe', 'mystery'
        this.markedForDeletion = false;
        
        this.hit = false;
        this.startY = y;
        this.bumpOffset = 0;
    }

    update() {
        if (state.current !== GAME_STATE.PLAYING) return;
        this.x -= state.currentSpeed;
        
        if (this.bumpOffset > 0) {
            this.bumpOffset -= 2;
        } else if (this.bumpOffset < 0) {
            this.bumpOffset += 2;
        }

        if (this.x + this.width < -100) {
            this.markedForDeletion = true;
        }
    }

    hitBlock() {
        if (this.type === 'mystery' && !this.hit) {
            this.hit = true;
            this.bumpOffset = 10;
            let type = 'chip';
            let r = Math.random();
            if (r < 0.2) type = 'mushroom';
            else if (r < 0.4) type = 'fireflower';
            
            items.push(new Collectible(this.x + this.width/2 - 10, this.y - 10, type));
            if (type === 'chip') state.score += 100;
        } else if (this.type === 'brick') {
            this.bumpOffset = 6;
        }
    }

    draw(ctx) {
        // We will draw ground entirely via entities now!
        ctx.save();
        let drawY = this.y - this.bumpOffset;
        
        if (this.type === 'ground') {
            // Custom ground drawing logic inside the entity
            const brickW = 32;
            const brickH = 32;
            const cols = Math.ceil(this.width / brickW);
            const rows = Math.ceil(this.height / brickH);

            ctx.save();
            ctx.beginPath();
            ctx.rect(this.x, drawY, this.width, this.height);
            ctx.clip(); // Ensure we don't draw outside the AABB

            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x, drawY, this.width, this.height);

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c <= cols; c++) {
                    let cx = this.x + (c * brickW);
                    let cy = drawY + (r * brickH);
                    
                    if (r % 2 !== 0) cx -= brickW / 2;
                    
                    let c1 = state.moonMode ? '#95a5a6' : '#C84C0C';
                    let c2 = state.moonMode ? '#bdc3c7' : '#ffcca6';
                    let c3 = state.moonMode ? '#7f8c8d' : '#8B2C04';
                    
                    ctx.fillStyle = c1;
                    ctx.fillRect(cx + 2, cy + 2, brickW - 4, brickH - 4);
                    
                    ctx.fillStyle = c2;
                    ctx.fillRect(cx + 2, cy + 2, brickW - 4, 3);
                    ctx.fillRect(cx + 2, cy + 2, 3, brickH - 4);
                    
                    ctx.fillStyle = c3;
                    ctx.fillRect(cx + 2, cy + brickH - 5, brickW - 4, 3);
                    ctx.fillRect(cx + brickW - 5, cy + 2, 3, brickH - 4);
                }
            }
            ctx.restore();
            
        } else if (this.type === 'brick') {
            ctx.fillStyle = state.moonMode ? '#7f8c8d' : '#CC4A14';
            ctx.fillRect(this.x, drawY, this.width, this.height);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, drawY, this.width, this.height);
            ctx.fillStyle = state.moonMode ? '#bdc3c7' : '#FFB89A';
            ctx.fillRect(this.x + 2, drawY + 2, this.width - 4, 3);
            ctx.fillRect(this.x + 2, drawY + 2, 3, this.height - 4);
        } else if (this.type === 'mystery') {
            if (this.hit) {
                ctx.fillStyle = '#A0522D';
                ctx.fillRect(this.x, drawY, this.width, this.height);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(this.x, drawY, this.width, this.height);
                ctx.fillStyle = '#8B2C04';
                ctx.fillRect(this.x + 4, drawY + 4, 4, 4);
                ctx.fillRect(this.x + this.width - 8, drawY + 4, 4, 4);
                ctx.fillRect(this.x + 4, drawY + this.height - 8, 4, 4);
                ctx.fillRect(this.x + this.width - 8, drawY + this.height - 8, 4, 4);
            } else {
                ctx.fillStyle = '#FDF104';
                ctx.fillRect(this.x, drawY, this.width, this.height);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.x, drawY, this.width, this.height);
                ctx.fillStyle = '#D35400';
                ctx.font = 'bold 24px VT323';
                ctx.textAlign = 'center';
                ctx.fillText('?', this.x + this.width/2, drawY + 26);
            }
        } else if (this.type === 'pipe') {
            ctx.fillStyle = '#00AA00';
            ctx.fillRect(this.x, drawY, this.width, this.height);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, drawY, this.width, this.height);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(this.x + 6, drawY, 8, this.height);
            
            ctx.fillStyle = '#00AA00';
            ctx.fillRect(this.x - 4, drawY, this.width + 8, 20);
            ctx.strokeRect(this.x - 4, drawY, this.width + 8, 20);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(this.x + 2, drawY, 8, 20);
        }
        
        ctx.restore();
    }
}

class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 20;
        this.height = 20;
        this.vy = -6;
        this.vx = type === 'mushroom' ? 2 : 0;
        this.collected = false;
        this.markedForDeletion = false;
    }
    update() {
        if (state.current !== GAME_STATE.PLAYING) return;
        this.x -= state.currentSpeed;
        
        let isMagnetic = this.type !== 'chip';
        
        if (isMagnetic && typeof player !== 'undefined' && player && !player.dead) {
            let dx = (player.x + player.width/2) - (this.x + this.width/2);
            let dy = (player.y + player.height/2) - (this.y + this.height/2);
            let dist = Math.max(1, Math.sqrt(dx*dx + dy*dy));
            
            let pullStrength = 2.0; 
            this.vx += (dx / dist) * pullStrength;
            this.vy += (dy / dist) * pullStrength;
            
            // Dampen speed to prevent wild orbiting 
            this.vx *= 0.9;
            this.vy *= 0.9;
        } else {
            this.vy += (state.moonMode ? CONFIG.gravity * 0.1 : CONFIG.gravity * 0.8);
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (!isMagnetic && this.type === 'mushroom') {
             let grounded = false;
             for(let plat of platforms) {
                if (this.x < plat.x + plat.width &&
                    this.x + this.width > plat.x &&
                    this.y < plat.y + plat.height &&
                    this.y + this.height > plat.y) {
                    if (this.vy > 0 && this.y + this.height - this.vy <= plat.y + 10) {
                        this.y = plat.y - this.height;
                        this.vy = 0;
                        grounded = true;
                        if (this.x <= plat.x || this.x + this.width >= plat.x + plat.width) {
                            this.vx *= -1;
                        }
                    } else if (this.y > plat.y - 10) {
                        this.vx *= -1;
                    }
                }
            }
        }
        
        if (this.y > canvas.height + 100) this.markedForDeletion = true;
        
        if (this.type === 'chip' && this.vy > 0 && Math.abs(this.vy) < 2) {
            this.collected = true;
        }
        
        if (this.collected) {
            this.markedForDeletion = true;
            if (this.type === 'chip') {
                state.coins++;
                for(let i=0; i<6; i++) {
                    particles.push(new Particle(this.x+10, this.y+10, (Math.random()-0.5)*6, (Math.random()-0.5)*6, 4, '#fdf104'));
                }
            }
        }
    }
    draw(ctx) {
        if (this.type === 'chip') {
            ctx.fillStyle = '#fdf104'; 
            ctx.beginPath();
            ctx.ellipse(this.x + 10, this.y + 10, 8, 12, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#d35400';
            ctx.fillRect(this.x + 9, this.y + 4, 2, 12);
        } else if (this.type === 'mushroom') {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(this.x, this.y + 4, this.width, this.height - 4);
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(this.x + 4, this.y, this.width - 8, 4);
            ctx.fillRect(this.x + 2, this.y + 6, 4, 4);
            ctx.fillRect(this.x + this.width - 6, this.y + 6, 4, 4);
        } else if (this.type === 'fireflower') {
            ctx.fillStyle = '#f39c12';
            ctx.fillRect(this.x, this.y + 4, this.width, this.height - 4);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(this.x + 4, this.y + 8, this.width - 8, this.height - 12);
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(this.x + 8, this.y + 12, 4, 4);
        }
    }
}

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'bug', 'fast', 'turtle', 'ufo', 'mine'
        this.width = 32;
        this.height = 32;
        this.vx = type === 'fast' ? -2.5 : -1;
        this.baseY = y;
        this.gravityImmune = false;
        
        if (type === 'ufo') {
            this.vx = -1.5;
            this.gravityImmune = true;
        } else if (type === 'mine') {
            this.vx = -0.5;
            this.gravityImmune = true;
        }
        
        this.state = 'walking'; // For turtle
        this.vy = 0;
        this.markedForDeletion = false;
        this.dead = false;
        this.deadTimer = 0;
        this.animFrame = 0;
    }
    update() {
        if (state.current !== GAME_STATE.PLAYING) return;
        this.animFrame++;

        if (this.dead) {
            this.deadTimer++;
            if (this.deadTimer > 30) this.markedForDeletion = true;
            this.x -= state.currentSpeed; 
            return;
        }

        this.x -= state.currentSpeed - this.vx;
        
        if (this.gravityImmune) {
            if (this.type === 'ufo') {
                this.y = this.baseY + Math.sin(state.frames * 0.05) * 40;
            }
            // space mine moves straight linearly 
        } else {
            this.vy += (state.moonMode ? 0.05 : CONFIG.gravity);
            if (this.vy > 12) this.vy = 12;
            this.y += this.vy;
        }

        let grounded = false;
        for(let plat of platforms) {
            if (this.x < plat.x + plat.width &&
                this.x + this.width > plat.x &&
                this.y < plat.y + plat.height &&
                this.y + this.height > plat.y) {
                    
                if (this.vy > 0 && this.y + this.height - this.vy <= plat.y + 10) {
                    this.y = plat.y - this.height;
                    this.vy = 0;
                    grounded = true;
                    // reverse direction at edge
                    if (this.x <= plat.x || this.x + this.width >= plat.x + plat.width) {
                        this.vx *= -1;
                    }
                } else if (this.y > plat.y - 10) {
                    this.vx *= -1;
                }
            }
        }
        
        if (this.y > window.innerHeight) this.markedForDeletion = true;
        if (this.x < -100) this.markedForDeletion = true;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.dead) {
            ctx.scale(1, 0.3);
            ctx.translate(0, this.height * 2.3);
        } else {
            if (Math.floor(this.animFrame / 10) % 2 === 0) {
                ctx.translate(0, -2);
            }
        }
        
        if (this.type === 'bug') {
            ctx.fillStyle = '#C0392B'; // Red glitch
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.fillStyle = '#000';
            ctx.fillRect(4, 8, 6, 6);
            ctx.fillRect(22, 8, 6, 6);
            ctx.fillStyle = '#fff';
            ctx.fillRect(6, 10, 2, 2);
            ctx.fillRect(24, 10, 2, 2);
            // Glitch pieces
            if (!this.dead && Math.random() < 0.2) {
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(Math.random()*20, Math.random()*20, 10, 2);
            }
        } else if (this.type === 'fast') {
            ctx.fillStyle = '#8E44AD'; // Purple drone
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.fillStyle = '#f1c40f'; // yellow scanning eye
            let eyeX = this.vx > 0 ? 12 : 0;
            ctx.fillRect(eyeX, 8, 20, 8);
        } else if (this.type === 'turtle') {
            ctx.fillStyle = this.state === 'sliding' ? '#E74C3C' : '#27AE60'; // Green bug/Red sliding
            
            if (this.state === 'walking') {
                ctx.fillRect(0, 0, this.width, this.height);
                ctx.fillStyle = '#145A32';
                ctx.fillRect(6, 6, 20, 20); // Shell
                ctx.fillStyle = '#000';
                ctx.fillRect(4, 12, 4, 4); // eye
            } else {
                // Shell
                ctx.fillRect(0, 0, this.width, this.height);
                ctx.fillStyle = '#145A32';
                ctx.fillRect(4, 4, 24, 14);
            }
        } else if (this.type === 'ufo') {
            // UFO saucer
            ctx.fillStyle = '#95a5a6'; // grey
            ctx.beginPath();
            ctx.ellipse(this.width/2, this.height/2, 22, 8, 0, 0, Math.PI*2);
            ctx.fill();
            // Cyan dome
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(this.width/2, this.height/2 - 2, 10, Math.PI, 0);
            ctx.fill();
            // Green beam
            if (!this.dead && Math.floor(state.frames/4)%2===0) {
                ctx.fillStyle = 'rgba(46, 204, 113, 0.4)';
                ctx.beginPath();
                ctx.moveTo(this.width/2 - 5, this.height/2 + 5);
                ctx.lineTo(this.width/2 + 5, this.height/2 + 5);
                ctx.lineTo(this.width/2 + 15, this.height/2 + 40);
                ctx.lineTo(this.width/2 - 15, this.height/2 + 40);
                ctx.fill();
            }
        } else if (this.type === 'mine') {
            ctx.fillStyle = '#34495e'; // dark grey
            ctx.beginPath();
            ctx.arc(this.width/2, this.height/2, 12, 0, Math.PI*2);
            ctx.fill();
            
            // Spikes
            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(this.width/2 - 2, this.height/2 - 16, 4, 32);
            ctx.fillRect(this.width/2 - 16, this.height/2 - 2, 32, 4);
            
            // Blinking red light
            if (!this.dead && Math.floor(state.frames/10)%2===0) {
                ctx.fillStyle = '#e74c3c';
                ctx.beginPath();
                ctx.arc(this.width/2, this.height/2, 4, 0, Math.PI*2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
}

class Projectile {
    constructor(x, y, vx) {
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 12;
        this.vx = vx;
        this.vy = 0;
        this.markedForDeletion = false;
        this.dead = false;
    }
    update() {
        if (state.current !== GAME_STATE.PLAYING) return;
        this.x += this.vx - state.currentSpeed;
        this.vy += CONFIG.gravity * 0.8;
        if (this.vy > 10) this.vy = 10;
        this.y += this.vy;
        
        for(let plat of platforms) {
            if (this.x < plat.x + plat.width &&
                this.x + this.width > plat.x &&
                this.y < plat.y + plat.height &&
                this.y + this.height > plat.y) {
                    
                if (this.vy > 0 && this.y + this.height - this.vy <= plat.y + 10) {
                    this.y = plat.y - this.height;
                    this.vy = -6; // bounce
                } else {
                    this.markedForDeletion = true; // hit wall
                }
            }
        }
        
        for (let enemy of enemies) {
            if (!enemy.dead && !enemy.markedForDeletion) {
                if (this.x < enemy.x + enemy.width &&
                    this.x + this.width > enemy.x &&
                    this.y < enemy.y + enemy.height &&
                    this.y + this.height > enemy.y) {
                    enemy.dead = true;
                    this.markedForDeletion = true;
                    state.score += 200;
                    for(let i=0; i<4; i++) {
                        particles.push(new Particle(enemy.x+15, enemy.y+15, (Math.random()-0.5)*8, (Math.random()-0.5)*8, 4, '#e74c3c'));
                    }
                }
            }
        }

        if (this.y > window.innerHeight || this.x > canvas.width || this.x < -100) {
            this.markedForDeletion = true;
        }
    }
    draw(ctx) {
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(this.x + 6, this.y + 6, 6, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(this.x + 6, this.y + 6, 3, 0, Math.PI*2);
        ctx.fill();
    }
}
